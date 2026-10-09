# E2E trình duyệt thật (Chrome headless)

Kiểm thử luồng phiên đăng nhập và nguyên tắc "không dữ liệu mock" trên trình duyệt thật.

## Chuẩn bị
Các script tạo guest, user test và gọi API ghi dữ liệu, nên API phải chạy trên **DB test** (`dealdb_test`, Redis DB 15),
không bao giờ trên DB dev `dealdb` / Redis DB 0 (chỉ chứa dữ liệu thật). Mọi script chạy `preflight.mjs` trước (API mặc định `E2E_API=http://localhost:18080/api/v1`):
1. **Postgres, không ghi gì qua API**: chèn trực tiếp vào `E2E_DB` (mặc định `dealdb_test`) một user guest tạm + một refresh token, rồi gọi `POST /auth/refresh` với token đó. Chỉ API chạy trên `E2E_DB` mới biết token (200). API trên DB khác trả 401 sau một lần tra cứu chỉ đọc ⇒ script dừng, không có gì được ghi vào DB đó. User tạm bị xoá lại (refresh token xoá theo, `ON DELETE CASCADE`).
2. **Redis** (chỉ sau khi bước 1 đạt): tạo một guest qua `POST /auth/guest` — request duy nhất khiến API ghi Redis: một member (UUID ngẫu nhiên) trong sorted set rate-limit `dh:rl:guest:<ip client>`. Một member mới (chưa có trước đó, score nằm trong khoảng thời gian của request) phải xuất hiện ở `E2E_REDIS_DB` (mặc định 15) — DB dành riêng cho E2E, và API chỉ ghi vào một DB, nên chỉ DB này quyết định kết quả; traffic dev đồng thời trên DB 0 không thể gây từ chối nhầm (cả hai DB chỉ được đọc bằng `SCAN`/`ZRANGE`). Guest này nằm trong `E2E_DB` và bị xoá ngay. Nếu API thực sự dùng Redis DB 0 thì đúng một member bị ghi vào DB 0 (không tránh được); vì không phân biệt được với traffic dev đồng thời, lỗi chỉ đếm số member mới ở DB 0, không nêu tên và không đề nghị xoá entry nào — nó tự hết hạn sau cửa sổ rate-limit 10 phút. `E2E_DB` phải khớp `^[A-Za-z0-9_]+_test$` và được truyền cho `psql` không qua shell. Ngoài ra preflight không ghi gì vào `dealdb` hay Redis DB 0.
```bash
cd e2e && npm init -y && npm install puppeteer-core@23
# Backend (thư mục dealhunter), Postgres/Redis local đang chạy:
make test-db
DATABASE_URL=postgres://dealuser:dealpass@localhost:5433/dealdb_test?sslmode=disable REDIS_URL=redis://localhost:6380/15 \
  HTTP_PORT=18080 CORS_ALLOWED_ORIGINS=http://localhost:3100 go run ./cmd/api
# Web (thư mục dealhunter-web):
NEXT_PUBLIC_API_URL=http://localhost:18080/api/v1 npx next dev -p 3100
```

## Chạy
| Script | Kiểm tra |
|---|---|
| `node session.mjs` | Tạo phiên guest, khôi phục qua reload, 2 tab refresh đồng thời, logout, guest không kết nối được Zalo, không có `X-User-ID`, cookie HttpOnly (17 kiểm tra) |
| `node member.mjs` | Phiên thành viên khôi phục từ cookie; phiên hết hạn trong tab ⇒ banner, không ghi nhầm dữ liệu. Cần API chạy với `ACCESS_TOKEN_TTL=40s`. Tự tạo/xoá user test trong `dealdb_test` (đổi bằng `E2E_DB`) qua `docker exec dealhunter-postgres` |
| `node nomock.mjs` | Không còn dữ liệu mẫu/giả trên 4 trang; dán link Shopee thật bị chặn ⇒ lỗi thật (502), không thêm sản phẩm giả |

Script dùng Chrome tại `/Applications/Google Chrome.app` (macOS).
