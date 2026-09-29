# Deal Hunter Web — Phase 1: Core Tracking UI

> **Mục tiêu**: Hoàn thiện giao diện đủ để người dùng thực sự dùng được —  
> paste link → theo dõi → xem biểu đồ giá.  
> Khớp 100% với **BE Phase 1** đã hoàn thành.

---

## 1. Đối Chiếu BE Phase 1 ↔ FE Phase 1

BE Phase 1 đã có đủ các API sau. FE Phase 1 phải dùng được toàn bộ:

| BE đã có | FE Phase 1 cần |
|----------|----------------|
| `POST /tracked-products` | ✅ Home: form paste URL → track |
| `GET /tracked-products` | ✅ Tracking list page |
| `GET /tracked-products/:id` | ⚠️ Thiếu — chưa dùng để hiện product name |
| `GET /tracked-products/:id/prices` | ✅ Product detail page (chart) |
| `POST /tracked-products/:id/pause` | ✅ Toggle trên tracking list |
| `POST /tracked-products/:id/resume` | ✅ Toggle trên tracking list |

---

## 2. Hiện Trạng Code (Gap Analysis)

### ✅ Đã có — hoạt động được

| File | Tình trạng |
|------|-----------|
| `app/page.tsx` | Form paste URL, gọi trackProduct(), redirect sang detail |
| `app/tracking/page.tsx` | List tracking cards, pause/resume |
| `app/tracking/[id]/page.tsx` | Price chart (Recharts), bảng snapshot |
| `lib/api.ts` | Đủ 6 API functions khớp với BE |

### ❌ Thiếu — cần làm để Phase 1 hoàn chỉnh

| Vấn đề | Tác động | Việc cần làm |
|--------|----------|-------------|
| Tracking card chỉ hiện `ProductSourceID` (UUID) | User không biết đây là sản phẩm gì | Gọi `GET /tracked-products/:id` → lấy metadata, hoặc lưu tên từ response `trackProduct()` |
| Product detail page dùng `sourceId` làm param nhưng `prices` endpoint dùng `trackingId` | Có thể sai khi BE yêu cầu `tracking_id` | Xác nhận lại với BE endpoint `/prices` nhận `tracking_id` hay `product_source_id` |
| Không có loading skeleton | White screen khi load | Thêm skeleton cho Tracking list và Product detail |
| Không có Empty State đúng UX | "Chưa có sản phẩm nào" thiếu CTA rõ | Thêm Empty state với hình minh họa + CTA |
| Tracking card không hiện giá hiện tại | User không thấy giá ngay trên list | Gọi thêm price history để lấy latest snapshot |
| Không có filter "Price Dropped" / "Paused" | UX cơ bản của tracking list | Thêm filter tabs: All / Đang quét / Tạm dừng |
| Không có Range selector trên chart (7D/30D/ALL) | Chart hiện tất cả snapshot | Thêm time range filter |
| Product detail không có Historical Summary | Thiếu: Lowest / Highest / Average / Current | Tính từ snapshots và hiển thị 4-stat grid |
| Product detail không có Price Change signal | Thiếu: "↓ 8.7% so với lúc bắt đầu" | Tính từ first vs last snapshot |
| Pause/Resume ở detail page thiếu | Chỉ có ở list, không có ở detail | Thêm control ở Product Detail |
| Không có Error state đúng chuẩn | Alert() thô khi thất bại | Thay `alert()` bằng inline error |
| `TrackedProduct` interface thiếu `ProductName`, `Platform`, `ProductImageURL` | Không render được thông tin sản phẩm | Cập nhật type + xem BE response có field này không |
| `getUserId()` hardcode UUID | User auth chưa có | Chấp nhận Phase 1, ghi note để Phase 2 xử lý |

---

## 3. Screens Cần Hoàn Thiện

### Screen 01 — Home (`app/page.tsx`)

**Còn thiếu:**
- [ ] Badge "Shopee · Lazada · TikTok" (đúng UX plan)
- [ ] Trạng thái loading step-by-step: "✓ Nhận diện nền tảng → ✓ Đọc thông tin → ● Lấy giá"
- [ ] Product Preview screen sau khi fetch xong (hiện tại redirect thẳng → thiếu bước confirm)
- [ ] Tracking Success screen với 2 CTA: "Xem sản phẩm" / "Theo dõi sản phẩm khác"

**Mức độ ưu tiên**: Medium — Product Preview là UX tốt hơn nhưng cần thêm endpoint trả về product info trước.

---

### Screen 02 — Tracking List (`app/tracking/page.tsx`)

**Còn thiếu:**
- [ ] Hiển thị **tên sản phẩm** và **giá hiện tại** thay vì UUID
- [ ] **Price change signal** trên card: `↓ 8.7%`
- [ ] **Mini sparkline** (small Recharts LineChart thu nhỏ)
- [ ] **Platform badge**: [Shopee] / [Lazada]
- [ ] **Last checked**: "12 phút trước" (dùng `NextFetchAt` hoặc `UpdatedAt`)
- [ ] **Filter tabs**: All | Đang quét | Tạm dừng
- [ ] **Skeleton loading** thay vì spinner
- [ ] **Empty state** đúng UX: icon + CTA rõ ràng

---

### Screen 03 — Product Detail (`app/tracking/[id]/page.tsx`)

**Còn thiếu:**
- [ ] **Hero section**: Tên sản phẩm (hiện chỉ có "Source ID: xxx")
- [ ] **Price change** so với lúc bắt đầu theo dõi: `↓ 8.7% từ lúc bắt đầu`
- [ ] **Historical summary**: Lowest / Average / Highest / Current (4-stat grid)
- [ ] **Price context**: "So với lúc bắt đầu: ↓ 8.7%" + "So với lowest: +110.000đ"
- [ ] **Time range selector**: 7D | 30D | ALL
- [ ] **Platform badge** + Last checked
- [ ] **Pause / Resume** control trực tiếp trên trang detail
- [ ] **Tooltip mobile-friendly** trên chart
- [ ] **Skeleton loading** thay vì text "Đang tải..."
- [ ] Bảng snapshot: hiện `InStock` thực tế (đang hardcode "Còn hàng")

---

## 4. Checklist Triển Khai Phase 1 (Theo Thứ Tự)

### Bước 1 — Fix data types & API alignment
- [ ] Cập nhật `TrackedProduct` interface trong `lib/api.ts` — thêm các field BE trả về (xem response thực tế)
- [ ] Xác nhận `getPriceHistory()` dùng đúng `tracking_id` hay `product_source_id`
- [ ] Thêm `lib/formatting.ts`: `formatVND(n)`, `formatRelativeTime(ts)`, `calcPriceChange(first, last)`

### Bước 2 — Tracking List (UX priority cao nhất)
- [ ] Gọi `getTracking(id)` song song hoặc cache response để lấy tên sản phẩm
- [ ] Tính `priceChange` từ first vs latest snapshot (có thể cần gọi thêm `/prices`)
- [ ] Render card đúng UX plan: name, platform badge, current price, `↓ X%`, last checked
- [ ] Thêm filter tabs: All / Đang quét / Tạm dừng
- [ ] Skeleton loading
- [ ] Empty state đúng chuẩn

### Bước 3 — Product Detail (màn hình quan trọng nhất)
- [ ] Hero: hiện tên sản phẩm (từ `getTracking()`) + current price lớn
- [ ] Historical summary: tính min/max/avg từ snapshots
- [ ] Price context: % thay đổi từ đầu + khoảng cách đến lowest
- [ ] Time range selector → filter snapshots theo 7D/30D/ALL
- [ ] Pause/Resume button trên trang này
- [ ] Skeleton + Error state đúng chuẩn

### Bước 4 — Home & Add Product Flow
- [ ] Step-by-step loading state khi đang analyze
- [ ] Thêm màn Product Preview (nếu BE trả về đủ info sau `POST /tracked-products`)
- [ ] Tracking Success state với 2 CTA

### Bước 5 — Polish & Cross-cutting
- [ ] Responsive: mobile-first, kiểm tra bottom nav trên mobile
- [ ] Thay toàn bộ `alert()` bằng inline error component
- [ ] `app/settings/page.tsx`: UI stub (placeholder Phase 2)
- [ ] Navbar: active state cho route hiện tại

---

## 5. UX Acceptance Criteria Phase 1

Phase 1 FE hoàn thành khi đạt đủ 4 điều kiện:

**First-time user**:
> Home → Paste link → (Preview) → Start Tracking → Xem chart  
> Không cần tutorial.

**Returning user — Tracking List**:
> Mở /tracking → thấy ngay: tên sản phẩm, giá hiện tại, % thay đổi, last checked  
> Trong vòng 2 giây.

**Product Detail**:
> Trong 5 giây thấy: Tên, Giá hiện tại, % thay đổi, Chart, Last checked.

**Failure handling**:
> User luôn biết: chuyện gì xảy ra + dữ liệu cuối cùng là gì + làm gì tiếp.  
> Không có dead-end.

---

## 6. Không làm trong Phase 1

> Những thứ thuộc Phase sau — **không build sớm**:

- Alert rules UI → Phase 2
- Zalo connection → Phase 2
- Cross-platform comparison → Phase 3
- Deal Score, fake discount → Phase 4
- Deal feed, search → Phase 5
- Notification center → Phase 2
- Auth system thực sự → Phase 2+
