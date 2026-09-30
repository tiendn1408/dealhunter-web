# Deal Hunter Web — Phase 1: Báo Cáo Triển Khai & Kiểm Định Hoàn Thiện 100%

> **Tài liệu chuẩn hóa**: Tổng hợp toàn bộ hạng mục đã hoàn thành, chi tiết các bước thực hiện, ma trận kiểm định chất lượng Phase 1 (Core Tracking UI) và bộ khung mẫu (blueprint template) để áp dụng xuyên suốt cho Phase 2 và các giai đoạn tiếp theo.

---

## 1. Tổng Quan & Phạm Vi Phase 1 (Phase Scope & Overview)

### 1.1 Mục Tiêu Cốt Lõi (Core Mission)
Hoàn thiện trọn vẹn lớp giao diện người dùng (Frontend) cho tính năng theo dõi giá cốt lõi:
- Cho phép người dùng dán link từ các sàn TMĐT (Shopee, Lazada, TikTok Shop).
- Tự động nhận diện sàn, đọc thông tin sản phẩm và lập lịch theo dõi giá tự động.
- Trực quan hóa biến động giá thực tế (bao gồm tiền hàng và phí vận chuyển) bằng biểu đồ diện tích (AreaChart).
- Thiết lập giá mục tiêu và quản lý danh sách sản phẩm theo dõi thời gian thực.
- Khớp nối 100% với hợp đồng API của Backend Go (`dealhunter`).

### 1.2 Ràng Buộc & Tiêu Chuẩn Kỹ Thuật (Non-negotiable Rules)
1. **Tiêu chuẩn "No Emoji"**: Tuyệt đối không sử dụng ký tự emoji trong toàn bộ mã nguồn, giao diện, thẻ thông báo, biểu tượng và tài liệu kỹ thuật. Toàn bộ hình ảnh biểu đạt sử dụng SVG vector thuần túy hoặc ký tự đồ họa tiêu chuẩn.
2. **Màu sắc nhận diện thương hiệu**:
   - Màu chủ đạo: Dark Pine Green (`#0A3832` / `pine-900`).
   - Màu nền ứng dụng: Warm Canvas (`#F8FAF9`).
   - Màu nhấn trạng thái: Emerald (`#059669` - giảm giá, thành công), Rose (`#E11D48` - tăng giá, giá mục tiêu), Amber (`#D97706` - cảnh báo, tạm dừng), Slate (`#475569` - trung tính).
3. **Triết lý thiết kế Mobile-First**:
   - Di động: Thanh điều hướng đáy (Bottom Navigation Bar) 4 tab cố định, luôn nằm trên cùng z-index với vùng đệm an toàn (`pb-24`).
   - Máy tính để bàn: Thanh điều hướng đỉnh (Sticky Header) với canvas tập trung rộng tối đa `max-w-6xl`, loại bỏ sidebar phụ gây phân tâm.
4. **Tính toàn vẹn của trạng thái rỗng (Zero-state Integrity)**:
   - Người dùng mới chưa theo dõi sản phẩm nào thì danh sách "Đang theo dõi" phải hiển thị trạng thái rỗng chuẩn mực (Empty State) kèm nút hành động (CTA), tuyệt đối không tự ý nhồi nhét dữ liệu giả vào danh sách cá nhân.

---

## 2. Danh Mục Các Hạng Mục Đã Hoàn Thiện 100% (Completed Deliverables)

### 2.1 Ma Trận 10 Màn Hình Mockup Chuẩn

| STT | Màn hình theo thiết kế | Tệp mã nguồn phụ trách | Vai trò & Trạng thái hoàn thiện |
|-----|-------------------------|------------------------|----------------------------------|
| 01 | Trang chủ (Home Banner & Value Props) | `app/page.tsx` | [100%] Thẻ đồ họa 3D, 3 bước hoạt động, sàn hỗ trợ, 3 thẻ sản phẩm mẫu trực quan. |
| 02 | Màn hình Dán Link (URL Input Field) | `app/page.tsx` | [100%] Ô nhập link thông minh, nút "Dán nhanh từ clipboard", tự nhận diện logo sàn. |
| 03 | Modal Phân Tích Link (Analysis Progress) | `app/page.tsx` | [100%] Tiến trình 3 bước với spinner và icon check vector: Nhận diện -> Đọc giá -> Lập lịch. |
| 04 | Thẻ Thêm Thành Công (Success Preview Card)| `app/page.tsx` | [100%] Card xem trước sản phẩm vừa thêm, 2 nút CTA "Xem chi tiết ngay" / "Tiếp tục thêm". |
| 05 | Danh Sách Đang Theo Dõi (Watching List) | `app/tracking/page.tsx`| [100%] Signature product card: giá hiện tại, giá cũ gạch ngang, % giảm, khoảng cách tới đáy, progress bar. |
| 06 | Chi Tiết Sản Phẩm (Product Detail Hub) | `app/tracking/[id]/page.tsx`| [100%] Hero image, giá lớn, trạng thái quét, nút Tạm dừng/Tiếp tục quét, 4-stat metrics grid. |
| 07 | Biểu Đồ Lịch Sử Biến Động Giá (Price Chart) | `app/tracking/[id]/page.tsx`| [100%] Recharts AreaChart dải gradient 2 lớp, tooltip chuẩn VND, dải lọc thời gian (7D/30D/ALL). |
| 08 | Thiết Lập Giá Mục Tiêu (Target Price Modal)| `app/tracking/[id]/page.tsx`| [100%] Modal đặt giá mong muốn, nút tính nhanh (-5%, -10%, -15%, -20%), đường nét đứt đỏ ReferenceLine. |
| 09 | Trung Tâm Thông Báo (Notification Center)| `app/notifications/page.tsx`| [100%] Tab bộ lọc (Tất cả, Giảm giá, Hệ thống), Empty state minh họa vector chuông thông báo. |
| 10 | Cá Nhân & Cài Đặt (Profile & Settings) | `app/settings/page.tsx`| [100%] Thẻ Avatar người dùng, cấu hình chu kỳ quét (1h, 3h, 6h, 12h, 24h), huy hiệu lộ trình Zalo Phase 2. |

---

### 2.2 Hệ Thống Thành Phần Tái Sử Dụng (Design System Components)

1. **Biểu tượng thương hiệu (Abstract Mark Logo)**:
   - `components/ui/DealHunterLogo.tsx`: Biểu tượng hình học vector gồm 2 mảng bo góc đối xứng (-28 độ và +28 độ) tạo hình mũi tên hướng xuống (giá giảm) và 2 lớp xếp chồng (theo dõi biến động theo thời gian).
   - `app/icon.svg`: Favicon SVG đồng bộ hiển thị sắc nét trên mọi tab trình duyệt và bookmark di động.
2. **Thanh điều hướng hai chế độ (Dual Navbar)**:
   - `components/Navbar.tsx`: Tự động nhận diện thiết bị. Hiển thị Header tinh gọn trên Desktop và Floating Bottom Bar cố định trên Di động với 4 điểm chạm: Trang chủ, Đang theo dõi, Thông báo, Cá nhân.
3. **Thành phần trạng thái rỗng (Empty State)**:
   - `components/ui/EmptyState.tsx`: Minh họa vector tinh tế, thông điệp định hướng rõ ràng và nút kích hoạt hành động dán link tức thì.
4. **Huy hiệu & Tín hiệu biến động (Pills & Badges)**:
   - `components/ui/Badge.tsx`: Định dạng nhận diện sàn TMĐT (Shopee cam, Lazada xanh dương, TikTok đen).
   - `components/ui/PriceChangePill.tsx`: Huy hiệu tính toán độ lệch giá kèm mũi tên vector chỉ hướng giảm hoặc tăng.
   - `components/ui/Sparkline.tsx`: Biểu đồ thu nhỏ SVG mini hiển thị xu hướng giá 30 ngày ngay trên từng thẻ sản phẩm.
   - `components/ui/LoadingSkeleton.tsx`: Hiệu ứng shimmer loading chuẩn cho danh sách và chi tiết.

---

### 2.3 Khớp Nối Hợp Đồng API Backend (API Integration Matrix)

| Endpoint Backend (`dealhunter`) | Phương thức | Chức năng trên Frontend | Cơ chế xử lý |
|-----------------------------------|-------------|-------------------------|--------------|
| `/api/v1/tracked-products` | `POST` | Thêm sản phẩm cần theo dõi | Tự động sinh `UserID` duy nhất, bắt lỗi trùng lặp |
| `/api/v1/tracked-products` | `GET` | Tải danh sách theo dõi | Tự động làm giàu metadata (Tên, Ảnh, Sàn, Giá mới nhất) |
| `/api/v1/tracked-products/:id` | `GET` | Tải chi tiết sản phẩm đơn lẻ | Tương thích cả `TrackingID` và `ProductSourceID` |
| `/api/v1/tracked-products/:id/prices` | `GET` | Tải toàn bộ snapshot giá | Đưa vào Recharts, tự động sắp xếp theo mốc thời gian |
| `/api/v1/tracked-products/:id/pause` | `POST` | Tạm dừng quét định kỳ | Cập nhật Optimistic UI ngay lập tức không cần tải lại trang |
| `/api/v1/tracked-products/:id/resume`| `POST` | Tiếp tục kích hoạt quét | Khôi phục trạng thái "Đang quét" tức thì |

- **Cơ chế chịu lỗi mạng (Network Resilience)**:
  - Tích hợp `safeFetch` trong `lib/api.ts`. Khi Backend chưa bật hoặc mất kết nối, hệ thống không bị crash màn hình trắng mà hiển thị khung hướng dẫn khởi động Backend tiếng Việt thân thiện kèm lệnh chạy cụ thể.

---

## 3. Quy Trình & Các Bước Thực Hiện Chi Tiết (Execution Methodology)

Quy trình triển khai Phase 1 đã tuân thủ nghiêm ngặt 6 bước kỹ thuật:

```
[Buoc 1: Kien truc & Gap Analysis]
               │
               ▼
[Buoc 2: Design System & Branding Core]
               │
               ▼
[Buoc 3: Hien thuc 10 Man hinh Mobile-First]
               │
               ▼
[Buoc 4: Can chinh Adapter & Hop dong API BE]
               │
               ▼
[Buoc 5: CSR Hydration & Toi uu Production Build]
               │
               ▼
[Buoc 6: Kiem dinh chat luong 100% & Rasoat Zero-Emoji]
```

### Bước 1: Phân Tích Kiến Trúc & Gap Analysis (BE ↔ FE)
1. Đọc và phân tích tài liệu đặc tả ban đầu `docs/specs/master-ui-ux.md` kết hợp tài liệu cải tiến `docs/specs/phase-1-ui-ux-improve.md`.
2. So chiếu 6 API sẵn có của Go Backend với nhu cầu hiển thị thực tế của người dùng:
   - Phát hiện thiếu sót: Backend ban đầu chỉ lưu ID thô (`ProductSourceID`), chưa trả về tên sản phẩm, ảnh đại diện và sàn TMĐT trong danh sách.
   - Quyết định kỹ thuật: Mở rộng `internal/http/handler.go` và tạo cơ chế phân tích URL slug linh hoạt tại `internal/marketplace/mock/adapter.go`.

### Bước 2: Thiết Lập Design System & Branding Core
1. Cấu hình bảng màu chuẩn tại `tailwind.config.js`:
   - Định nghĩa `pine`: `#0A3832` làm màu nhận diện chủ lực (`pine-900`), kèm các dải màu từ 50 đến 950.
   - Bổ sung cấu hình đường dẫn `content` bao quát cả `./lib/**/*.{js,ts,jsx,tsx}` để tránh hiện tượng Tailwind purge mất style màu động.
2. Thiết kế logo trừu tượng `DealHunterLogo.tsx` dạng vector toán học:
   - Mảnh 1 (Xanh thông đậm): Xoay -28 độ, tâm (10.75, 13.5).
   - Mảnh 2 (Xanh ngọc tươi): Xoay +28 độ, tâm (21.25, 18.5).
   - Thể hiện sự giao thoa giữa dữ liệu giảm giá và dòng thời gian theo dõi.
3. Xuất file `app/icon.svg` để làm Favicon chuẩn của ứng dụng.

### Bước 3: Hiện Thực Hóa 10 Màn Hình Mobile-First
1. **Trang chủ & Form dán link (`app/page.tsx`)**:
   - Dựng Hero section với biểu tượng nổi bật và thẻ thông điệp cốt lõi.
   - Tích hợp tính năng đọc Clipboard tự động qua API trình duyệt (`navigator.clipboard.readText()`).
   - Xây dựng modal tiến trình 3 bước với animation quay mượt mà và chuyển đổi trạng thái bằng SVG checkmark.
   - Thêm 3 thẻ sản phẩm minh họa (Sony XM6, SSD Samsung 2TB, iPhone 16) để người dùng hình dung trước khi dán link.
2. **Danh sách theo dõi (`app/tracking/page.tsx`)**:
   - Dựng thẻ sản phẩm chữ ký (Signature Card) theo đúng mockup: Hiển thị giá hiện tại nổi bật, giá niêm yết gạch ngang, phần trăm giảm giá (`-14%`), cột giá mục tiêu, cột khoảng cách tới đáy, và thanh tiến độ hoàn thành mục tiêu.
   - Xử lý bộ lọc 3 trạng thái: Tất cả / Đang quét / Tạm dừng.
   - Tích hợp Empty State khi danh sách bằng 0.
3. **Chi tiết sản phẩm & Biểu đồ (`app/tracking/[id]/page.tsx`)**:
   - Dựng lưới 4 chỉ số thống kê giá: Thấp nhất lịch sử, Cao nhất lịch sử, Giá trung bình, Độ lệch so với đáy.
   - Tích hợp Recharts AreaChart dải màu chuyển tiếp (`linearGradient`), responsive theo độ rộng màn hình.
   - Xây dựng Modal "Đặt giá mục tiêu": Cho phép nhập số tiền hoặc bấm chọn nhanh các mốc `-5%`, `-10%`, `-15%`, `-20%`.
   - Vẽ đường nét đứt màu đỏ (`ReferenceLine`) trên biểu đồ thể hiện mốc giá mục tiêu đã đặt, lưu trữ bền vững tại `localStorage`.
4. **Thông báo (`app/notifications/page.tsx`)**:
   - Thiết kế giao diện trung tâm thông báo với 3 tab: Tất cả, Biến động giá, Hệ thống.
5. **Cá nhân & Cài đặt (`app/settings/page.tsx`)**:
   - Thiết kế hồ sơ người dùng với Avatar ký tự `T`.
   - Cung cấp tùy chọn tần suất quét định kỳ (1h, 3h, 6h, 12h, 24h) lưu vào `localStorage`.
   - Trưng bày tính năng kết nối Zalo Notification với huy hiệu "Phase 2".

### Bước 4: Tinh Chỉnh Backend Adapter & Khớp Nối Hợp Đồng Dữ Liệu
1. Mở rộng `MockAdapter` tại `internal/marketplace/mock/adapter.go`:
   - Phân tích chuỗi URL đầu vào để tự động nhận dạng sản phẩm thật (tai nghe Sony, ổ cứng SSD Samsung, điện thoại iPhone).
   - Tự động sinh lịch sử biến động giá ngẫu nhiên có kiểm soát (+/- 3% quanh giá nền) và phí vận chuyển thực tế để biểu đồ hiển thị dải sóng giá sống động.
2. Cập nhật `internal/http/handler.go`:
   - Đảm bảo endpoint `/tracked-products` và `/tracked-products/:id` luôn trả về đầy đủ các trường `Title`, `Platform`, `CanonicalURL`, `LastPrice`, `LastInStock`.

### Bước 5: Tối Ưu Hóa Hiệu Năng, CSR Hydration & Build Verification
1. Giải quyết lỗi CSR Bailout trong Next.js 14:
   - Bao bọc `useSearchParams()` trong `app/page.tsx` bằng thẻ `<Suspense fallback={...}>` để Next.js thực hiện tối ưu hóa tĩnh (SSG) an toàn lúc build.
2. Giải quyết xung đột môi trường Sandbox:
   - Chạy lệnh cài đặt và build với cờ ủy quyền hệ thống để đảm bảo kết nối mạng và phân quyền thư mục chuẩn xác.
3. Thực hiện kiểm tra biên dịch production bằng lệnh:
   - `npm run build` -> Kết quả thành công 8/8 routes (100% không lỗi).

### Bước 6: Kiểm Soát Chất Lượng & Rà Soát Quy Chuẩn
1. Chạy script Python quét tự động toàn bộ cây mã nguồn (`app/`, `components/`, `lib/`) để phát hiện các ký tự emoji Unicode (khoảng mã `0x1F300` - `0x1FAFF`, `0x2600` - `0x27BF`, v.v.).
2. Thay thế toàn bộ ký tự dingbat/emoji bằng các thẻ SVG vector thuần túy.
3. Xác minh tính toàn vẹn của Zero-state trên tài khoản mới.

---

## 4. Bảng Ma Trận Kiểm Định Chất Lượng 100% (Verification Matrix)

| Hạng mục kiểm tra | Tiêu chí nghiệm thu (Acceptance Criteria) | Kết quả thực tế | Trạng thái |
|-------------------|-------------------------------------------|-----------------|------------|
| **Tiêu chuẩn Emoji** | Không chứa bất kỳ ký tự emoji Unicode nào trong code và UI | Script quét xác nhận 0 ký tự emoji trong toàn bộ mã nguồn | [PASSED] |
| **Hệ màu thương hiệu** | Sử dụng đúng mã Dark Pine Green `#0A3832` làm chủ đạo | Tailwind config và class `bg-pine-900`, `text-pine-900` đồng bộ | [PASSED] |
| **Biểu tượng Logo** | Abstract mark 2 mảng đối xứng (-28° / +28°), gợi sóng giảm giá | Đã dựng trong `DealHunterLogo.tsx` và `app/icon.svg` | [PASSED] |
| **Mobile Navigation** | Bottom bar cố định 4 tab, không bị che nội dung | `Navbar.tsx` có bottom bar, `layout.tsx` có padding `pb-24` | [PASSED] |
| **Desktop Layout** | Sticky header, không sidebar, căn giữa canvas `max-w-6xl` | Header cố định trên top, bố cục thoáng đãng, chuẩn responsive | [PASSED] |
| **Nhận diện link sàn** | Tự động nhận diện Shopee, Lazada, TikTok khi nhập link | Hàm `detectPlatform` nhận diện chính xác theo domain | [PASSED] |
| **Tiến trình 3 bước** | Modal hiển thị 3 giai đoạn rõ ràng khi phân tích link | Hiển thị spinner và đánh dấu tích xanh vector từng bước | [PASSED] |
| **Thẻ sản phẩm danh sách** | Đủ giá hiện tại, giá cũ, % giảm, mục tiêu, khoảng cách tới đáy | Thẻ sản phẩm signature hiển thị đầy đủ theo Screen 05 | [PASSED] |
| **Biểu đồ biến động giá** | Recharts AreaChart dải gradient, trục ngày, tooltip VND | Hiển thị biểu đồ vùng mượt mà, tooltip định dạng tiền Việt chuẩn | [PASSED] |
| **Thiết lập giá mục tiêu** | Modal đặt giá, tính nhanh % giảm, vẽ ReferenceLine nét đứt | Đặt giá mục tiêu hoạt động chuẩn, vẽ đường đỏ trên chart | [PASSED] |
| **Bộ lọc danh sách** | Lọc theo Tất cả / Đang quét / Tạm dừng | Bộ lọc client-side lọc đúng danh sách ngay lập tức | [PASSED] |
| **Tạm dừng / Tiếp tục** | Bấm toggle thay đổi trạng thái quét tức thì | Gọi API `/pause` và `/resume` thành công với Optimistic UI | [PASSED] |
| **Trung tâm thông báo** | Tab bộ lọc và Empty state minh họa vector chuông | Đã dựng hoàn thiện theo Screen 09 | [PASSED] |
| **Màn hình cài đặt** | Avatar người dùng, tùy chỉnh tần suất quét, roadmap Zalo | Đã dựng hoàn thiện theo Screen 10 | [PASSED] |
| **Khả năng chịu lỗi** | Không crash trang khi Backend chưa chạy, có thông báo rõ | Cơ chế `safeFetch` bắt lỗi và hiện hướng dẫn bật Backend | [PASSED] |
| **Biên dịch Production** | `npm run build` không phát sinh lỗi hoặc cảnh báo TypeScript | 8/8 trang biên dịch thành công (Static + Dynamic routes) | [PASSED] |

---

## 5. Hướng Dẫn Vận Hành & Kịch Bản Nghiệm Thu (Acceptance Runbook)

### 5.1 Các Lệnh Khởi Chạy Hệ Thống

#### Bước 1: Khởi chạy Backend Go
```bash
# Di chuyển vào thư mục backend
cd /Users/tien.dang/Workplace/reference/dealhunter

# Chạy server API (cổng mặc định 8080)
go run cmd/api/main.go
```
*Kiểm tra sức khỏe Backend: Mở trình duyệt truy cập `http://localhost:8080/health` (hoặc kiểm tra log cổng 8080).*

#### Bước 2: Khởi chạy Frontend Next.js
```bash
# Di chuyển vào thư mục frontend
cd /Users/tien.dang/Workplace/reference/dealhunter-web

# Khởi chạy máy chủ phát triển
npm run dev
```
*Truy cập ứng dụng tại: `http://localhost:3000`.*

---

### 5.2 Kịch Bản Nghiệm Thu Thực Tế (5 Phút Thử Nghiệm Toàn Diện)

1. **Thử nghiệm Zero-state**:
   - Truy cập tab `Đang theo dõi` (`/tracking`) khi chưa có dữ liệu.
   - Kỳ vọng: Hiển thị màn hình rỗng minh họa vector, thông điệp "Chưa có sản phẩm nào", kèm nút "Dán link theo dõi ngay".
2. **Thử nghiệm Dán Link & Tiến trình 3 bước**:
   - Quay về `Trang chủ` (`/`). Bấm vào link mẫu hoặc dán link: `https://shopee.vn/tai-nghe-sony-wh-1000xm6`.
   - Kỳ vọng: Logo sàn Shopee tự động sáng lên. Bấm "Bắt đầu theo dõi" -> Modal tiến trình hiện ra, chạy tuần tự 3 bước với animation.
3. **Thử nghiệm Thẻ Thêm Thành Công**:
   - Sau khi phân tích xong, màn hình hiển thị Thẻ thêm thành công (Screen 04) với tên sản phẩm "Tai nghe Sony WH-1000XM6", giá hiện tại và ảnh minh họa.
   - Bấm nút "Xem chi tiết ngay" để chuyển hướng sang trang chi tiết.
4. **Thử nghiệm Biểu Đồ & Đặt Giá Mục Tiêu**:
   - Tại trang chi tiết (`/tracking/[id]`), quan sát 4 chỉ số thống kê (Thấp nhất, Cao nhất, Trung bình, Khoảng cách tới đáy).
   - Quan sát biểu đồ vùng AreaChart màu xanh chuyển sắc.
   - Bấm nút "Đặt giá mục tiêu" -> Chọn nút giảm nhanh `-10%` -> Bấm "Lưu mục tiêu".
   - Kỳ vọng: Đường nét đứt màu đỏ xuất hiện ngay trên biểu đồ tương ứng với mức giá vừa đặt.
5. **Thử nghiệm Tạm Dừng / Tiếp Tục Quét**:
   - Bấm nút "Tạm dừng quét" trên thanh điều khiển chi tiết.
   - Kỳ vọng: Huy hiệu trạng thái chuyển sang màu vàng "Tạm dừng" ngay lập tức mà không cần F5 trang.
   - Bấm "Tiếp tục quét" để đưa sản phẩm về trạng thái "Đang quét" màu xanh.
6. **Thử nghiệm Điều Hướng Di Động**:
   - Thu nhỏ trình duyệt về kích thước điện thoại (dưới 768px).
   - Kỳ vọng: Header trên đỉnh ẩn đi, thanh Bottom Navigation Bar xuất hiện ở đáy màn hình. Chuyển đổi qua lại giữa 4 tab mượt mà.

---

## 6. Khung Mẫu Chuẩn Cho Kế Hoạch Phase 2 (Phase 2 Blueprint Template)

Để đảm bảo tính nhất quán tuyệt đối về cấu trúc tài liệu và chất lượng kỹ thuật, kế hoạch cho **Phase 2 (Alert Engine + Zalo Notification)** sẽ được xây dựng theo đúng cấu trúc tiêu chuẩn 6 phần như sau:

```markdown
# Deal Hunter Web — Phase 2: Kế Hoạch Triển Khai & Kiểm Định
# [Alert Engine & Zalo Notification Integration]

1. Tổng Quan & Mục Tiêu Cốt Lõi Phase 2
   - Cơ chế phát hiện giảm giá chạm ngưỡng mục tiêu (Alert Rule Evaluation).
   - Tích hợp cổng thông báo Zalo qua Zalo Notification Service (ZNS / Bot).
   - Tuân thủ tiêu chuẩn No-Emoji và nhận diện thương hiệu Dark Pine Green.

2. Danh Mục Các Màn Hình & Thành Phần Cần Nâng Cấp
   - Màn hình cấu hình cảnh báo chuyên sâu (Screen Alert Settings).
   - Luồng liên kết tài khoản Zalo (Screen Zalo OAuth / QR Connect Flow).
   - Hộp thư thông báo tương tác (Interactive Notification Feed).
   - Huy hiệu chuông cảnh báo thời gian thực trên thanh điều hướng.

3. Hợp Đồng API Mới Giữa Frontend ↔ Backend (BE Phase 2 Specs)
   - POST /api/v1/alerts (Tạo điều kiện cảnh báo)
   - GET  /api/v1/alerts (Danh sách cảnh báo của tôi)
   - POST /api/v1/notifications/zalo/connect (Liên kết tài khoản Zalo)
   - GET  /api/v1/notifications (Lịch sử các cảnh báo đã gửi)

4. Quy Trình Các Bước Triển Khai Kỹ Thuật (Step-by-Step Execution)
   - Bước 1: Thiết kế Alert Rules UI & Modal chọn ngưỡng thông minh
   - Bước 2: Xây dựng Zalo Connection Modal & hướng dẫn người dùng
   - Bước 3: Nâng cấp Notification Center (`app/notifications/page.tsx`)
   - Bước 4: Khớp nối với Alert Engine từ Backend Go
   - Bước 5: Kiểm thử luồng gửi thông báo mô phỏng (Webhook / Mock Worker)

5. Bảng Ma Trận Kiểm Định Chất Lượng Phase 2 (Acceptance Matrix)
   - Tiêu chí nghiệm thu cho từng điều kiện cảnh báo.
   - Kiểm thử độ trễ thông báo và tính chính xác của giá gửi qua Zalo.

6. Hướng Dẫn Vận Hành & Kịch Bản Nghiệm Thu Phase 2
   - Lệnh chạy kiểm thử Worker quét giá kèm tính năng bắn thông báo.
   - Kịch bản nghiệm thu luồng nhận thông báo Zalo khi giá giảm.
```

---

*Tài liệu được biên soạn và lưu trữ tại:* `dealhunter-web/docs/plans/phase-1/verification-report.md`  
*Trạng thái Phase 1:* **HOÀN THÀNH 100% (READY FOR PHASE 2)**
