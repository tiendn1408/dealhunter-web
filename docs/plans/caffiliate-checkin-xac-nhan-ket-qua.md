# Caffiliate: xác nhận kết quả điểm danh bằng câu trả lời của server

> Viết 2026-10-15. Trạng thái: **chờ chủ dự án lấy dữ liệu** (mục 3). Mã nằm ở repo `dealhunter/extension`.

## 1. Bối cảnh

- Đêm 2026-10-14, lần điểm danh 0h thất bại với lỗi duy nhất «Tới giờ không thấy nút · 0 lần bấm»: bộ đếm giờ không tìm ra nút điểm danh nên không gọi `app.checkIn()`.
- **Đã sửa (2026-10-15, chưa commit):** riêng Caffiliate, tới giờ là gọi chuỗi thử ngay (`app.checkIn()` -> API -> bấm nút), không cần tìm thấy nút. Nút chỉ dùng sau đó để đối chiếu kết quả.
  - `src/content/adapters/adapter_interface.ts`: thêm `strikesWithoutTarget()`.
  - `src/content/adapters/caffiliate_adapter.ts`: Caffiliate trả `true`.
  - `src/content/core/hunt_engine.ts`: tới giờ bắn luôn khi adapter bật cờ; xác nhận của adapter được tính cả khi không có nút.
  - Test: `src/content/core/hunt_engine_strike_without_target.test.ts` (không có nút, nút hiện «Đã điểm danh #12» bị khoá, xác nhận khi không có nút).

## 2. Việc còn lại: phần xác nhận đang dựa vào phỏng đoán

Bridge (`public/caffiliate_bridge.js`, hàm `isCheckedIn`) coi là **thành công** khi một trong hai điều xảy ra:

1. `app.state.todayCheckedIn === true`, hoặc
2. nút đổi sang «Đã điểm danh #N» khác nhãn trước lúc bắn.

Khi đã «thành công», các lần thử chưa chạy bị **huỷ**. Chưa ai đọc mã `app.checkIn()` của Caffiliate (trang nằm sau đăng nhập, `app.caffiliate.vn/dashboard`, mã viết thẳng trong trang, không có file JS công khai), nên chưa biết:

| Câu hỏi | Rủi ro nếu câu trả lời là "có" |
| --- | --- |
| `checkIn()` có bật `todayCheckedIn = true` **trước** khi server trả lời không? | Extension báo thành công giả, huỷ lần thử 2-5; nếu lần 1 tới sớm bị từ chối thì mất lượt. |
| Khi server từ chối («chưa tới giờ», token lỗi), `checkIn()` có **không** ném lỗi mà chỉ hiện popup? | Bridge không biết để chuyển sang tầng API. |
| `checkIn()` có khoá chống bấm lặp bằng biến khác ngoài `checkInLocked`, `isCheckingIn`? | Các lần thử sau bị chính trang chặn, không gửi đi. |
| Server trả JSON dạng nào khi thành công / thất bại? | Không đọc được kết quả thật từ câu trả lời. |

## 3. Việc chủ dự án cần làm (khoảng 2 phút)

### 3.1 Lấy mã các hàm của trang

1. Mở `https://app.caffiliate.vn`, đăng nhập, vào trang có nút **Điểm danh**.
2. Bấm F12, chọn tab **Console**.
3. Dán đoạn sau rồi Enter:

   ```js
   copy([
     "// checkIn\n" + app.checkIn,
     "// generateSignature\n" + app.generateSignature,
     "// getToken\n" + (window.CheckInTurnstile && CheckInTurnstile.getToken),
     "// state keys\n" + JSON.stringify(Object.keys(app.state || {}))
   ].join("\n\n"))
   ```

   Nếu báo `app is not defined`, chạy `Object.keys(window).filter(k => /app|caff|xeng/i.test(k))` và gửi kết quả.
4. Nội dung đã nằm trong clipboard: dán vào file `docs/plans/caffiliate-checkin-source.txt` (cùng thư mục với tài liệu này) hoặc gửi trong chat.

Đoạn mã trên chỉ in mã hàm và **tên** các biến trạng thái; không in giá trị, không gửi token hay mật khẩu đi đâu, không điểm danh.

### 3.2 Lấy câu trả lời của server (tuỳ chọn, rất có ích)

Tối nào điểm danh bằng tay hoặc extension chạy xong:

1. F12, tab **Network**, lọc `check-in`.
2. Bấm vào yêu cầu `POST .../api/v2/xeng/check-in-secure`, tab **Response**.
3. Chụp màn hình hoặc chép phần JSON (xoá token nếu có) vào cùng file ở 3.1. Một lần thành công và một lần bị từ chối là đủ.

### 3.3 Ảnh tab Log của extension

Sau mỗi lần chạy 0h: mở popup DealHunter Assistant, tab **Log**, chụp lần chạy đó (số lần thử, nhãn OK/FAILED, dòng server trả lời).

## 4. Việc sẽ làm khi có dữ liệu ở mục 3

1. Đọc mã `checkIn()` và trả lời bốn câu hỏi ở mục 2.
2. Sửa `isCheckedIn` trong bridge: thành công chỉ khi **câu trả lời của server** cho POST điểm danh báo thành công (bridge đã chặn và đọc câu trả lời này cho Log). Nhãn «Đã điểm danh #N» chỉ là dự phòng khi không đọc được câu trả lời. Không dùng cờ `todayCheckedIn` để huỷ các lần thử còn lại.
3. Nếu `checkIn()` nuốt lỗi: đọc kết quả từ câu trả lời server để quyết định chuyển sang tầng API.
4. Reset đúng các biến khoá chống bấm lặp của trang trước mỗi lần thử.
5. Thêm test cho bridge theo hành vi thật của trang; cập nhật `dealhunter/docs/optimize/ke-hoach-toi-uu-0s.md` (mục «Cần kiểm chứng»).

## 5. Kiểm tra trước mỗi đêm chạy

- [ ] `chrome://extensions` -> tải lại DealHunter Assistant (bản build mới nhất trong `extension/dist`).
- [ ] F5 trang Caffiliate sau khi tải lại extension.
- [ ] Tác vụ hẹn giờ 0h còn trong danh sách, đúng trang Caffiliate.
- [ ] Sáng hôm sau: chụp tab Log (mục 3.3).
