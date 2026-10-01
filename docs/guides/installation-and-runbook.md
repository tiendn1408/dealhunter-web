# Deal Hunter — Hướng Dẫn Cài Đặt & Vận Hành Toàn Diện (Fullstack Runbook)

> **Mục tiêu tài liệu**: Cung cấp hướng dẫn từng bước chuẩn xác, chi tiết từ khâu chuẩn bị môi trường, khởi động cơ sở dữ liệu, chạy migration, khởi chạy các dịch vụ Backend Go (`dealhunter`) và giao diện Frontend Next.js (`deal-hunter-web`), cùng kịch bản kiểm thử tích hợp (End-to-End).

---

## 1. Yêu Cầu Môi Trường (System Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

| Công cụ | Phiên bản tối thiểu | Mục đích sử dụng | Kiểm tra phiên bản |
|---------|---------------------|------------------|-------------------|
| **Node.js** | `>= 18.17.0` (Khuyên dùng v20+) | Chạy ứng dụng web Next.js 14 | `node -v` |
| **npm** | `>= 9.0.0` | Trình quản lý gói cho Frontend | `npm -v` |
| **Go** | `>= 1.22.0` (Khuyên dùng 1.23+) | Biên dịch & chạy Backend Go | `go version` |
| **Docker & Docker Compose** | `>= 24.0.0` | Khởi chạy cụm PostgreSQL & Redis | `docker compose version` |
| **Git** | Bất kỳ | Quản lý phiên bản mã nguồn | `git --version` |

> [!NOTE]
> Đường dẫn mặc định của hai kho lưu trữ:
> - Backend: `/Users/tien.dang/Workplace/reference/dealhunter`
> - Frontend: `/Users/tien.dang/Workplace/reference/dealhunter-web`

---

## 2. Chuẩn Bị Hạ Tầng: PostgreSQL & Redis (Bước 1)

Backend sử dụng **PostgreSQL** để lưu trữ dữ liệu bền vững (sản phẩm, lịch sử giá, quy tắc cảnh báo, nhật ký thông báo) và **Redis** để làm hàng đợi Stream phân tán (`dh:stream:price-fetch` và `dh:stream:notifications`).

### Cách 1: Khởi động nhanh bằng Docker Compose (Khuyến nghị)
Mở một cửa sổ Terminal và thực hiện:

```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
docker compose up -d postgres redis
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```
Kỳ vọng kết quả:
- `dealhunter-postgres`: Cổng `5433:5432` (healthy / running)
- `dealhunter-redis`: Cổng `6380:6379` (healthy / running)

### Cách 2: Sử dụng PostgreSQL và Redis cài trực tiếp (Native)
Nếu bạn đã có sẵn PostgreSQL và Redis chạy trên máy:
- PostgreSQL URL: `postgres://dealuser:dealpass@localhost:5433/dealdb?sslmode=disable`
- Redis URL: `redis://localhost:6380`

---

## 3. Cấu Hình Môi Trường & Chạy Migration Backend (Bước 2)

### 3.1 Thiết lập tệp `.env` cho Backend
Tại thư mục `dealhunter`:

```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
cp .env.example .env
```

Nội dung tệp `.env` tiêu chuẩn cho phát triển local:
```env
APP_ENV=development
HTTP_PORT=8080
DATABASE_URL=postgres://dealuser:dealpass@localhost:5433/dealdb?sslmode=disable
REDIS_URL=redis://localhost:6380
WORKER_CONCURRENCY=10
DEFAULT_POLL_INTERVAL=1800
FETCH_TIMEOUT=10s
MAX_RETRY=5

# Zalo OA Configuration (Phase 2)
# De trong hoac bat ZALO_ENABLED=false neu dung che do Mock Sandbox
ZALO_ENABLED=false
ZALO_OA_ACCESS_TOKEN=
ZALO_TEMPLATE_ID=
ZALO_APP_ID=
```

### 3.2 Chạy Migration khởi tạo cấu trúc bảng Database
Hệ thống cung cấp sẵn công cụ migration tự động để tạo các bảng cho cả Phase 1, Phase 2 và Phase 3:
- Migration `000001`: Khởi tạo bảng `users`, `tracked_products`, `product_sources`, `price_snapshots`.
- Migration `000002`: Bổ sung cột cho `users`, tạo bảng `alert_rules` và `notification_logs`.
- Migration `000003`: Bổ sung cột `is_primary` cho `tracked_products`, tạo bảng `comparison_snapshots`.

Thực hiện lệnh:
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/migrate/main.go up
```
Kỳ vọng: Lệnh thông báo migration thành công lên phiên bản `000003`.

---

## 4. Khởi Chạy Các Dịch Vụ Backend (Bước 3)

Hệ thống Backend được thiết kế theo kiến trúc Modular Monolith gồm 4 tiến trình độc lập. Để có trải nghiệm đầy đủ tính năng, bạn nên mở các tab Terminal riêng biệt:

### Tab 1: Khởi chạy API Server
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/api/main.go
```
- Server lắng nghe tại: `http://localhost:8080`
- Kiểm tra sức khỏe hệ thống: Mở trình duyệt hoặc dùng curl:
  ```bash
  curl http://localhost:8080/health
  # Trả về: {"status":"ok"}
  ```

### Tab 2: Khởi chạy Worker quét giá & Đánh giá Alert Rules (Worker Service)
Worker chịu trách nhiệm đọc nhiệm vụ cào giá, phát hiện biến động và đánh giá các luật cảnh báo:
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/worker/main.go
```
- Tự động kết nối Redis stream `dh:stream:price-fetch`.
- Khi phát hiện giá giảm thỏa mãn điều kiện `AlertRule`, tự động sinh payload và đẩy vào `dh:stream:notifications`.

### Tab 3: Khởi chạy Notifier Service (Gửi tin Zalo OA)
Notifier chịu trách nhiệm tiêu thụ stream thông báo và bắn tin nhắn ZNS tới người dùng:
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/notifier/main.go
```
- Khi `ZALO_ENABLED=false` (mặc định), Notifier sử dụng `MockZaloClient` an toàn, ghi nhận tin gửi thành công vào Database mà không tốn phí ZNS.

### Tab 4: Khởi chạy Scheduler định kỳ (Tùy chọn)
Nếu bạn muốn hệ thống tự động lập lịch quét định kỳ mỗi 30 phút:
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/scheduler/main.go
```

---

## 5. Cài Đặt & Khởi Chạy Giao Diện Frontend Next.js (Bước 4)

### 5.1 Cài đặt các gói phụ thuộc (Dependencies)
Mở một cửa sổ Terminal mới:

```bash
cd /Users/tien.dang/Workplace/reference/dealhunter-web
npm install
```

### 5.2 Thiết lập tệp môi trường `.env.local`
Tạo file `.env.local` nếu cần tùy chỉnh cổng backend:
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter-web
cp .env.example .env.local
```
Nội dung tệp:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 5.3 Khởi chạy máy chủ phát triển (Development Server)
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter-web
npm run dev
```
- Ứng dụng web hoạt động tại: **`http://localhost:3000`**

### 5.4 Kiểm tra biên dịch Production (Production Build)
Để đảm bảo toàn bộ mã nguồn không phát sinh lỗi kiểu hoặc cảnh báo:
```bash
cd /Users/tien.dang/Workplace/reference/dealhunter-web
npm run build
```
Kỳ vọng kết quả:
```text
[OK] Compiled successfully
[OK] Linting and checking validity of types
[OK] Generating static pages (8/8)
[OK] Finalizing page optimization
```

---

## 6. Kịch Bản Nghiệm Thu & Kiểm Thử Toàn Diện (End-to-End Walkthrough)

Sau khi cả 4 tab Terminal đã hoạt động, thực hiện kịch bản 5 bước dưới đây trên trình duyệt:

### Bước 1: Dán link và bắt đầu theo dõi sản phẩm mới
1. Mở trình duyệt truy cập: `http://localhost:3000`.
2. Tại thanh nhập link trang chủ, dán đường dẫn thử nghiệm:
   `https://shopee.vn/product/tai-nghe-sony-wh-1000xm6`
3. Nhận thấy nhãn logo **Shopee** tự động sáng lên.
4. Bấm nút **"Bắt đầu theo dõi"**:
   - Modal phân tích xuất hiện với tiến trình 3 bước: Nhận diện link -> Đọc dữ liệu -> Lập lịch quét.
   - Thẻ thành công hiển thị thông tin sản phẩm và giá khởi điểm.
5. Bấm **"Xem chi tiết ngay"** để chuyển hướng sang trang chi tiết `/tracking/[id]`.

### Bước 2: Thiết lập quy tắc cảnh báo giá thông minh
1. Tại trang chi tiết sản phẩm, kéo xuống Section 2.5: **"Cảnh báo giá thông minh"**.
2. Bấm nút **"Thêm cảnh báo"**:
   - Chọn điều kiện: **"Giảm theo %"**.
   - Bấm chọn mốc nhanh: **`-10%`** (hoặc tự nhập con số mong muốn).
   - Chọn thời hạn: **`30 ngày`**.
   - Bấm **"Kích hoạt cảnh báo giá"**.
3. Thẻ quy tắc cảnh báo xuất hiện ngay trên danh sách với badge "Đang bật" và mô tả rõ ràng.

### Bước 3: Thiết lập giá mục tiêu trên biểu đồ
1. Tại trang chi tiết, bấm nút **"Đặt giá mục tiêu"** (hoặc nút chỉnh sửa mốc).
2. Nhập mức giá mong muốn (ví dụ: `5.500.000đ`) -> Bấm lưu.
3. Biểu đồ vùng **AreaChart** tự động hiển thị đường nét đứt màu đỏ `ReferenceLine` đánh dấu mốc giá mục tiêu của bạn.

### Bước 4: Liên kết tài khoản Zalo OA
1. Bấm vào tab **"Cá nhân"** (`/settings`) trên thanh điều hướng.
2. Tại mục "Liên kết Zalo", bấm **"Kết nối ngay"**:
   - Bấm liên kết nhanh **"Dùng số thử nghiệm (Sandbox)"** (điền tự động `0988123456`).
   - Bấm **"Xác nhận liên kết Zalo"**.
3. Thẻ Zalo chuyển ngay sang trạng thái "Đã kết nối" kèm nút "Hủy liên kết".

### Bước 5: Kiểm thử Trung tâm thông báo & Phản hồi chuông
1. Bấm vào tab **"Thông báo"** (`/notifications`).
2. Tại màn hình rỗng, bấm nút **"Giả lập giảm giá 12%"**:
   - Một thông báo deal giảm giá lập tức xuất hiện với đầy đủ thông tin: giá trước, giá sau, nhãn Zalo OA và chấm đỏ chưa đọc.
   - Quan sát trên thanh điều hướng (Desktop Header hoặc Mobile Bottom Bar): Biểu tượng Chuông xuất hiện chấm đỏ pulsing.
3. Bấm trực tiếp vào thẻ thông báo:
   - Thẻ chuyển sang trạng thái đã đọc (mờ đi).
   - Chấm đỏ trên biểu tượng Chuông tự động biến mất.

### Bước 6: So sánh giá đa sàn & Xem Best Deal (Phase 3)
1. Tại trang chi tiết sản phẩm `/tracking/[id]`, cuộn xuống Section 2.6: **"So sánh giá các sàn"**.
2. Quan sát bảng so sánh liệt kê các sàn hiện có kèm giá niêm yết, phí vận chuyển và giá thực trả.
3. Bấm nút **"Liên kết thêm sàn"** (hoặc nút dán link trong callout khi chỉ có 1 sàn):
   - Modal liên kết sàn xuất hiện.
   - Dán một đường link từ sàn khác (ví dụ: TikTok Shop hoặc Lazada).
   - Logo sàn tự động nhận diện trực quan qua `PlatformBadge`.
   - Bấm **"Xác nhận liên kết sàn"**.
4. Modal đóng lại, hệ thống tự động refetch bảng so sánh qua TanStack Query:
   - Banner **"Giá tốt nhất"** (Emerald) tự động làm nổi bật sàn có giá thực trả thấp nhất.
   - Hiển thị số tiền và phần trăm tiết kiệm được so với sàn đắt nhất.
5. Bấm vào tab **"Đang theo dõi"** (`/tracking`):
   - Thẻ sản phẩm thuộc nhóm từ 2 nguồn trở lên tự động xuất hiện huy hiệu **"Đa sàn"**.

---

## 7. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### Vấn đề 1: Lỗi "Không thể kết nối đến máy chủ Backend"
- **Nguyên nhân**: API server Backend Go (`cmd/api/main.go`) chưa được bật hoặc gặp sự cố crash.
- **Khắc phục**:
  1. Kiểm tra xem Terminal chạy `cmd/api/main.go` có thông báo lỗi kết nối DB không.
  2. Thử truy cập `http://localhost:8080/health`. Nếu không phản hồi, khởi động lại lệnh `go run cmd/api/main.go`.

### Vấn đề 2: Lỗi kết nối PostgreSQL (`connection refused` trên port 5433)
- **Nguyên nhân**: Container Docker của PostgreSQL chưa khởi chạy hoặc đang bị chiếm dụng cổng bởi tiến trình khác.
- **Khắc phục**:
  ```bash
  docker compose down
  docker compose up -d postgres
  # Kiem tra cong
  lsof -i :5433
  ```

### Vấn đề 3: Lỗi Redis Stream consumer group (`NOGROUP`)
- **Nguyên nhân**: Redis khởi động lại làm mất metadata của Stream consumer group.
- **Khắc phục**: Backend Go trong `pkg/queue/redis.go` đã được thiết kế tự động tạo nhóm (`XGROUP CREATE ... MKSTREAM`). Nếu gặp lỗi, chỉ cần khởi động lại Worker và Notifier.

### Vấn đề 4: Lỗi phân quyền hoặc build trên môi trường macOS
- **Nguyên nhân**: Biến môi trường đường dẫn Go chưa đồng bộ.
- **Khắc phục**:
  Chạy lệnh với PATH đầy đủ của Homebrew:
  ```bash
  export PATH=/opt/homebrew/bin:$PATH
  go version
  ```

---

*Tài liệu được lưu trữ tại:* `dealhunter-web/docs/guides/installation-and-runbook.md`  
*Trạng thái:* **HOÀN THIỆN & SẴN SÀNG SỬ DỤNG**
