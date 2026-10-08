# Deal Hunter Web — Phase 2: Kế Hoạch Triển Khai & Kiểm Định

> **Cập nhật 2026-10-07:** Các tính năng giả lập mô tả trong tài liệu này (nút "Giả lập giảm giá", nút "Dùng số thử nghiệm (Sandbox)", link sản phẩm mẫu `mock.dealhunter.vn`) **đã bị gỡ bỏ** theo nguyên tắc "dữ liệu thật, việc thật" — xem `dealhunter/docs/plans/hardening-before-phase-4.md` (nhóm NOMOCK). Tài liệu được giữ nguyên làm lịch sử.

# [Alert Engine UI & Zalo Notification Integration]

> **Tài liệu chuẩn hóa**: Đặc tả chi tiết yêu cầu kỹ thuật, luồng tương tác người dùng, hợp đồng API và lộ trình triển khai giao diện người dùng cho **Phase 2: Bộ Máy Cảnh Báo Giá & Tích Hợp Thông Báo Zalo**.

---

## 1. Tổng Quan & Phạm Vi Phase 2 (Phase Scope & Overview)

### 1.1 Mục Tiêu Cốt Lõi (Core Mission)
Mở rộng trải nghiệm từ việc người dùng phải chủ động vào xem biểu đồ sang cơ chế **chủ động nhận thông báo biến động**:
1. Cho phép người dùng thiết lập quy tắc cảnh báo giá thông minh cho từng sản phẩm đang theo dõi (Giảm >= X%, Giá xuống dưới ngưỡng Y, hoặc Đáy lịch sử trong N ngày).
2. Tích hợp cổng liên kết tài khoản Zalo (quét mã QR hoặc xác thực số điện thoại) để nhận tin nhắn cảnh báo biến động giá tức thì qua Zalo OA / ZNS.
3. Nâng cấp Trung tâm thông báo (`/notifications`) thành luồng tin tức tương tác thời gian thực với phân loại theo mức độ quan trọng.
4. Hiển thị huy hiệu (Notification Badge) thông báo số lượng deal giảm giá mới trên thanh điều hướng (Desktop Header & Mobile Bottom Bar).

### 1.2 Ràng Buộc Kỹ Thuật & Quy Chuẩn (Non-negotiable Rules)
1. **Tiêu chuẩn "No Emoji"**: Duy trì nghiêm ngặt 100% không dùng ký tự emoji trong toàn bộ UI, mã nguồn, icon và tài liệu.
2. **Hệ màu thương hiệu**: Dark Pine Green (`#0A3832`), kết hợp Slate trung tính và màu trạng thái chuẩn (Emerald, Rose, Amber).
3. **Mobile-First Experience**: Luồng cài đặt cảnh báo và liên kết Zalo được tối ưu hóa theo dạng Drawer/Bottom Sheet trên điện thoại, dạng Modal tập trung trên Desktop.
4. **Đồng bộ trạng thái tức thì (Optimistic UI)**: Khi bật/tắt cảnh báo hoặc thay đổi ngưỡng giá, giao diện phản hồi ngay lập tức và đồng bộ ngầm với Backend.

---

## 2. Danh Mục Các Thành Phần Cần Triển Khai (Phase 2 Deliverables)

### 2.1 Ma Trận Màn Hình & Thành Phần Mới

| STT | Thành phần giao diện | Vị trí mã nguồn | Chức năng chi tiết |
|-----|----------------------|-----------------|--------------------|
| 01 | Drawer / Modal Tạo Cảnh Báo | `components/alerts/CreateAlertModal.tsx` | Form 3 điều kiện: Giảm theo %, Giá dưới mức X, Đáy N ngày; Chọn kênh (Zalo, In-app); Đặt thời hạn (30, 60, 90 ngày). |
| 02 | Thẻ Cảnh Báo Đang Kích Hoạt | `components/alerts/ActiveAlertCard.tsx` | Hiển thị tóm tắt luật đang chạy trên trang chi tiết sản phẩm kèm nút Chỉnh sửa / Tắt. |
| 03 | Modal Liên Kết Zalo | `components/settings/ZaloConnectModal.tsx` | Quét mã QR liên kết Zalo OA, xác nhận OTP hoặc liên kết qua Zalo Widget. |
| 04 | Trạng Thái Kết Nối Zalo | `app/settings/page.tsx` | Hiển thị thẻ Zalo Account (Tên, Ảnh đại diện, Trạng thái: Đã kết nối / Chưa kết nối), nút Ngắt kết nối. |
| 05 | Feed Thông Báo Tương Tác | `app/notifications/page.tsx` | Danh sách thông báo động: Thẻ giảm giá sâu, Deal đạt giá mục tiêu, Thông báo hệ thống; Đánh dấu đã đọc. |
| 06 | Huy Hiệu Chuông Báo Động | `components/Navbar.tsx` | Điểm đỏ (Dot indicator) hoặc số lượng thông báo chưa đọc trên icon Chuông (cả Desktop & Mobile). |

---

### 2.2 Cấu Trúc Dữ Liệu Frontend (TypeScript Interfaces)

```typescript
// Định nghĩa quy tắc cảnh báo
export type AlertConditionType = 'drop_percent' | 'target_price' | 'lowest_in_days';

export interface AlertRule {
  id: string;
  trackingId: string;
  productSourceId: string;
  productTitle: string;
  productImage: string;
  conditionType: AlertConditionType;
  thresholdValue: number; // % giam hoac so tien VND hoac so ngay
  channels: ('zalo' | 'in_app')[];
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

// Định nghĩa thông báo gửi đến người dùng
export interface PriceNotification {
  id: string;
  alertRuleId: string;
  trackingId: string;
  productTitle: string;
  productImage: string;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
  channel: 'zalo' | 'in_app';
  read: boolean;
  sentAt: string;
}

// Trạng thái tài khoản Zalo liên kết
export interface ZaloAccountConnection {
  connected: boolean;
  zaloId?: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt?: string;
}
```

---

## 3. Khớp Nối Hợp Đồng API Frontend ↔ Backend (API Matrix)

| Endpoint Backend (`dealhunter`) | Phương thức | Chức năng phía Frontend |
|-----------------------------------|-------------|-------------------------|
| `/api/v1/tracked-products/{id}/alerts` | `POST` | Tạo mới quy tắc cảnh báo giá cho một sản phẩm |
| `/api/v1/tracked-products/{id}/alerts` | `GET` | Tải danh sách cảnh báo của một sản phẩm |
| `/api/v1/alert-rules` | `GET` | Tải toàn bộ danh sách cảnh báo của người dùng |
| `/api/v1/alerts/{alert_id}` | `DELETE` | Xóa hoặc tắt quy tắc cảnh báo |
| `/api/v1/notifications` | `GET` | Tải lịch sử thông báo biến động giá |
| `/api/v1/notifications/{id}/read` | `POST` | Đánh dấu thông báo đã đọc |
| `/api/v1/users/me/zalo` | `POST` | Gửi dữ liệu liên kết Zalo (phone/zalo_id) thay vì quét QR |
| `/api/v1/auth/zalo/status` | `GET` | Kiểm tra trạng thái liên kết Zalo của người dùng |
| `/api/v1/auth/zalo/disconnect` | `POST` | Hủy liên kết tài khoản Zalo |

---

## 4. Quy Trình & Các Bước Triển Khai Kỹ Thuật (Execution Walkthrough)

```
[Buoc 1: Mo rong API Client & Type Definitions]
                     │
                     ▼
[Buoc 2: Xay dung UI Alert Creation & Rule Management]
                     │
                     ▼
[Buoc 3: Xay dung Luong Lien ket Zalo OA (QR / OAuth)]
                     │
                     ▼
[Buoc 4: Nang cap Notification Center & Badge Navigation]
                     │
                     ▼
[Buoc 5: Tich hop Hop dong Backend & Mock Simulator]
                     │
                     ▼
[Buoc 6: Kiem dinh Chat luong 100% & Production Build]
```

### Bước 1: Mở Rộng API Client & Type Definitions
- Khai báo các interface `AlertRule`, `PriceNotification`, `ZaloAccountConnection` trong `lib/types.ts`.
- Bổ sung các phương thức gọi API trong `lib/api.ts` với cơ chế `safeFetch` an toàn.

### Bước 2: Xây Dựng UI Alert Creation & Rule Management
- Tạo component `CreateAlertModal.tsx` cho phép chọn 1 trong 3 điều kiện bằng Radio buttons tùy biến.
- Tích hợp thanh trượt hoặc ô nhập số tiền với nút gợi ý nhanh (`-5%`, `-10%`, `-15%`).
- Hiển thị thẻ tóm tắt trạng thái cảnh báo trên trang chi tiết sản phẩm `app/tracking/[id]/page.tsx`.

### Bước 3: Xây Dựng Luồng Liên Kết Zalo OA
- Tại màn hình Cài đặt `app/settings/page.tsx`, hoàn thiện khối "Kết nối Zalo".
- Xây dựng Modal liên kết tài khoản cho phép người dùng nhập Số điện thoại hoặc Zalo ID (thay vì quét QR chưa được hỗ trợ từ Backend).
- Cung cấp trạng thái Sandbox/Mock để người dùng có thể thử nghiệm liên kết ngay cả khi chưa kết nối cổng Zalo thật.

### Bước 4: Nâng Cấp Notification Center & Badge Navigation
- Cập nhật `app/notifications/page.tsx` để render danh sách thông báo thực tế theo thời gian tương đối.
- Bổ sung bộ lọc: Tất cả / Giá giảm sâu / Đạt mục tiêu / Hệ thống.
- Thêm chấm thông báo chưa đọc (Red Dot Badge) tại biểu tượng Chuông trong `components/Navbar.tsx`.

### Bước 5: Tích Hợp Hợp Đồng Backend & Mock Simulator
- Khớp nối trực tiếp với các endpoint mới của Backend Go (`cmd/api`, `cmd/notifier`).
- Hỗ trợ công cụ giả lập biến động giá tại môi trường phát triển (Dev Tool Button: "Giả lập giảm giá 10% để kiểm tra chuông").

### Bước 6: Kiểm Định Chất Lượng 100% & Production Build
- Quét toàn bộ mã nguồn đảm bảo 100% không chứa ký tự emoji.
- Kiểm tra biên dịch production bằng lệnh `npm run build`.

---

## 5. Bảng Ma Trận Kiểm Định Chất Lượng Phase 2 (Acceptance Matrix)

| Hạng mục kiểm tra | Tiêu chí nghiệm thu (Acceptance Criteria) | Trạng thái chuẩn bị |
|-------------------|-------------------------------------------|---------------------|
| **Tạo cảnh báo %** | Đặt giảm >= 10%, hệ thống lưu đúng quy tắc | [DA HOAN THIEN 100%] |
| **Tạo cảnh báo giá đích**| Đặt giá <= X VNĐ, hệ thống cập nhật đường mốc trên chart | [DA HOAN THIEN 100%] |
| **Tạo cảnh báo đáy N ngày**| Đặt cảnh báo đáy 30/60/90 ngày | [DA HOAN THIEN 100%] |
| **Liên kết Zalo** | Modal hiện form nhập số điện thoại/Zalo ID, sau khi lưu hiển thị liên kết thành công | [DA HOAN THIEN 100%] |
| **Ngắt kết nối Zalo** | Bấm ngắt kết nối, chuyển về trạng thái Chưa liên kết tức thì | [DA HOAN THIEN 100%] |
| **Feed thông báo** | Thẻ thông báo hiển thị đúng giá cũ, giá mới, % giảm và giờ | [DA HOAN THIEN 100%] |
| **Đánh dấu đã đọc** | Bấm vào thông báo làm mờ và giảm số lượng huy hiệu trên Navbar | [DA HOAN THIEN 100%] |
| **Quy chuẩn No-Emoji** | 0 ký tự emoji trong toàn bộ thành phần và thông báo mẫu | [DA HOAN THIEN 100%] |
| **Biên dịch Production** | `npm run build` vượt qua 100% không cảnh báo | [DA HOAN THIEN 100%] |

---

## 6. Hướng Dẫn Vận Hành & Kịch Bản Nghiệm Thu Phase 2 (Runbook)

### 6.1 Khởi Động Đồng Thời Backend (với Notifier Worker) & Frontend
```bash
# 1. Chạy Backend API & Worker
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/api/main.go

# 2. Chạy Notifier Worker trong terminal riêng (Phase 2)
cd /Users/tien.dang/Workplace/reference/dealhunter
go run cmd/notifier/main.go

# 3. Chạy Frontend
cd /Users/tien.dang/Workplace/reference/dealhunter-web
npm run dev
```

### 6.2 Kịch Bản Nghiệm Thu Người Dùng (Phase 2 User Journey)
1. **Thiết lập cảnh báo**: Mở chi tiết sản phẩm bất kỳ -> Bấm "Thêm cảnh báo" -> Chọn điều kiện -> Lưu quy tắc.
2. **Liên kết Zalo**: Vào tab Cá nhân -> Bấm "Liên kết Zalo" -> Nhập số điện thoại -> Xác nhận.
3. **Mô phỏng hạ giá**: Giá sản phẩm trên sàn giảm -> Worker phát hiện -> Đánh giá luật -> Gửi tin Zalo.
4. **Nhận thông báo**: Điện thoại nhận tin Zalo từ Deal Hunter OA; tab Thông báo trên Web hiện tin mới kèm chấm đỏ trên thanh điều hướng.

---

*Tài liệu được biên soạn và lưu trữ tại:* `dealhunter-web/docs/plans/phase-2/plan.md`  
*Trạng thái kế hoạch:* **100% HOAN THIEN (COMPLETED & VERIFIED)**
