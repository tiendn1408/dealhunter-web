# E2E trình duyệt thật (Chrome headless)

Kiểm thử luồng phiên đăng nhập và nguyên tắc "không dữ liệu mock" trên trình duyệt thật.

## Chuẩn bị
Các script tạo guest, user test và gọi API ghi dữ liệu, nên API phải chạy trên **DB test** (`dealdb_test`, Redis DB 15),
không bao giờ trên DB dev `dealdb` (chỉ chứa dữ liệu thật). Mọi script chạy `preflight.mjs` trước: tạo một guest qua API và kiểm tra guest đó nằm trong `E2E_DB` (mặc định `dealdb_test`, API mặc định `E2E_API=http://localhost:18080/api/v1`); nếu API đang chạy trên DB khác, script dừng ngay.
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
