# Deal Hunter — UI/UX Plan

## Document Status

**FINAL / SOURCE OF TRUTH**

This is the canonical UI/UX handoff document for Deal Hunter.

When an older discussion, mockup, or document conflicts with this file, this document takes precedence.

Critical rules:
- Phase 1 starts from a real user zero-state.
- `Watching` contains only products the user has actually added.
- Global `Deals / Discovery` is a future capability and must not populate a new user's Home in Phase 1.
- The product must feel modern and consumer-friendly while expressing "deal hunting" through price movement, targets, freshness, signals, typography, charts, icons, and subtle motion.
- **No emoji** in the product UI, UX copy, design system, or product-facing documentation.

---

## 1. Mục tiêu

Deal Hunter phải tạo được cảm giác:

> "Đây là nơi giúp tôi phát hiện và chờ đúng mức giá để mua."

Không phải:

> "Đây là dashboard quản lý lịch sử giá."

UI phải đạt đồng thời 4 yêu cầu:

1. Modern B2C.
2. Người mới nhìn vào hiểu ngay sản phẩm dùng để làm gì.
3. Có DNA "săn sale" rõ ràng.
4. Không sử dụng emoji.

### Product feeling

```text
Modern
Clean
Fast
Trustworthy
Useful
Exciting
```

Nhưng không:

```text
Admin dashboard
Technical tool
Gamified shopping app
Overloaded analytics
```

---

# 2. Core UX Mental Model

Không xây trải nghiệm quanh:

```text
Product → Tracking → History
```

Mà xây quanh:

```text
DISCOVER
   ↓
WATCH
   ↓
PRICE MOVES
   ↓
SIGNAL
   ↓
ACT
```

Trong Phase 1:

```text
Paste link
   ↓
Watch product
   ↓
See current price
   ↓
See price movement
   ↓
Understand historical context
```

Phase sau:

```text
Discover deal
   ↓
Set target
   ↓
Watch
   ↓
Price reaches target
   ↓
Notification
   ↓
Purchase
```

---

# 3. Core UX Principles

## 3.1 Instant comprehension

Người mới phải hiểu trong vài giây:

```text
Đây là gì?
→ Theo dõi giá.

Tôi làm gì?
→ Dán link.

Tôi nhận được gì?
→ Biết khi giá giảm và khi đạt mức tôi muốn.
```

Không yêu cầu tutorial dài.

---

## 3.2 Consumer-first — HARD PRODUCT CONSTRAINT

Deal Hunter là **B2C consumer product**, không phải internal tool và không phải admin dashboard.

Mọi quyết định UI/UX phải bắt đầu từ hành vi của người mua:

```text
Tôi muốn mua gì?
        ↓
Giá hiện tại là bao nhiêu?
        ↓
Giá có đang tốt không?
        ↓
Tôi muốn mua ở mức nào?
        ↓
Theo dõi và chờ đúng thời điểm
```

Người dùng không cần biết hoặc quản lý:

```text
Worker
Scheduler
Crawler
Price Snapshot
Fetch Job
Redis
Product Source
Marketplace Adapter
```

Người dùng cần hiểu ngay:

```text
Giá hiện tại
Giá đã giảm bao nhiêu
Giá thấp nhất
Giá mục tiêu
Cập nhật khi nào
Tôi đang theo dõi gì
Tôi cần làm gì tiếp theo
```

### B2C rules bắt buộc

- **Không thiết kế sidebar trong Phase 1.**
- **Không lấy dashboard architecture làm mental model chính.**
- **Không expose technical modules qua navigation.**
- **Không biến Home thành bảng dữ liệu/KPI.**
- **Không dùng table density làm mặc định cho product browsing.**
- **Không yêu cầu user hiểu thuật ngữ hệ thống.**
- **Không thêm navigation chỉ vì backend có thêm một module.**
- Mỗi màn hình có **một primary user goal** và **một primary action** rõ ràng.
- Desktop ưu tiên **header + content canvas + cards/sections**.
- Navigation phải mô tả **hành vi người dùng**, không mô tả implementation.

Ví dụ:

```text
Đúng:
Khám phá · Đang theo dõi · Cảnh báo · Cài đặt

Sai:
Products · Sources · Jobs · Workers · Analytics
```

---

## 3.3 Price-first hierarchy

Trong product experience:

```text
Product name
       ↓
Current price
       ↓
Price change
       ↓
Price context
       ↓
Chart
       ↓
Metadata
```

Giá hiện tại phải là visual anchor.

---

## 3.4 Deal hunting through data, not decoration

Không dùng emoji, animation quá mức hoặc gamification để tạo cảm giác săn sale.

"Săn deal" đến từ:

```text
Price movement
Freshness
Target
Historical low
Price gap
Cross-store difference
Discovery
Timing
```

---

## 3.5 Progressive disclosure

### Level 1

Người dùng chỉ cần:

```text
6.190.000đ
Giảm 12,7%
Giá thấp nhất 90 ngày: 6.050.000đ
```

### Level 2

Muốn hiểu sâu hơn:

```text
Price chart
30D / 90D
Average
Lowest
Highest
```

### Level 3

Power user:

```text
Price percentile
Volatility
Cross-platform comparison
Historical events
Price signals
```

---

# 4. Visual Direction

## Overall style

**B2C-first là baseline của giao diện, không phải một lớp trang trí.**

Tư duy:

```text
Premium consumer product
+
Shopping utility
+
Data visualization
+
Subtle energy
```

### Reference feeling

Không copy UI của sản phẩm khác.

Chỉ lấy các nguyên tắc:

```text
Large product imagery
Large price typography
Generous whitespace
Soft cards
Clear hierarchy
Fast interaction
Strong visual focus
```

---

# 5. Layout Philosophy

## Desktop / Web — HARD CONSTRAINT

**Phase 1 không sử dụng sidebar.**

Web phải có cảm giác của một **modern consumer shopping product**: header gọn, content canvas rộng, nhiều whitespace, card/section theo ngữ cảnh và tập trung vào sản phẩm + giá + hành động.

```text
┌───────────────────────────────────────────────────────────────┐
│ Deal Hunter     Search / Paste URL     Notifications    User  │
└───────────────────────────────────────────────────────────────┘
│                                                               │
│                         MAIN CONTENT                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Không tạo layout kiểu:

```text
Sidebar
├── Dashboard
├── Products
├── Sources
├── Jobs
├── Workers
└── Analytics
```

### Lý do

- Sidebar mặc định dễ kéo mental model sang admin/SaaS.
- Deal Hunter là consumer shopping companion.
- User cần tập trung vào **sản phẩm, giá và hành động**, không phải module hệ thống.
- Ít navigation hơn giúp giảm cognitive load.

Nếu future phase có thêm nhiều capability, ưu tiên **top navigation hoặc contextual navigation** trước khi cân nhắc sidebar. Sidebar không phải mặc định.

## Mobile

Bottom navigation:

```text
┌──────────────────────────────────────┐
│                                      │
│              CONTENT                 │
│                                      │
├────────────┬────────────┬────────────┤
│ Discover   │ Watching   │ Settings   │
└────────────┴────────────┴────────────┘
```

## Desktop

Header đơn giản:

```text
DEAL HUNTER

Discover        Watching        Settings
```

Không expose nhiều menu nội bộ.

---

# 6. Home — Rebuild Completely

Home không được giống một form nhập link trống.

## Objective

Ngay khi mở app phải có cảm giác:

> "Có thứ đang xảy ra với giá."

## Proposed layout

```text
┌────────────────────────────────────────────────┐
│ DEAL HUNTER                                     │
│                                                │
│ Săn đúng giá trước khi mua                     │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ Dán link sản phẩm                          │ │
│ └────────────────────────────────────────────┘ │
│                           [ Theo dõi giá ]      │
│                                                │
│ ────────────────────────────────────────────── │
│                                                │
│ GIÁ ĐANG GIẢM                                  │
│                                                │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ Sony WH-1000XM6    │ │ Samsung SSD 2TB    │ │
│ │                    │ │                    │ │
│ │ 6.190.000đ         │ │ 2.790.000đ         │ │
│ │ Giảm 12,7%         │ │ Giảm 16,4%         │ │
│ │                    │ │                    │ │
│ │ Giá thấp 90 ngày   │ │ Giá thấp 30 ngày   │ │
│ └────────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────┘
```

### Important

Phase 1 nếu chưa có global deal discovery đủ dữ liệu, section này có thể dùng:

```text
Sản phẩm đang theo dõi
```

thay vì giả lập "hot deals".

Khi có đủ marketplace data mới chuyển thành discovery feed thực sự.

Không tạo cảm giác giả bằng dữ liệu fake.

---

# 7. Home Hero Copy

Không nên dùng technical language.

Các lựa chọn phù hợp:

```text
Săn đúng giá trước khi mua
```

hoặc:

```text
Chờ đúng giá. Mua đúng lúc.
```

Primary CTA:

```text
Theo dõi giá
```

Secondary action:

```text
Tìm deal
```

`Tìm deal` chỉ xuất hiện khi Phase 5 có discovery engine thực sự.

---

# 8. Product Card — Signature Component

Đây là component quan trọng nhất của UI.

## Design

```text
┌──────────────────────────────────┐
│                                  │
│ [ Product image ]                │
│                                  │
│ Sony WH-1000XM6                  │
│                                  │
│ 6.190.000đ                      │
│ 7.090.000đ   Giảm 12,7%         │
│                                  │
│ ───── price movement ─────       │
│                                  │
│ Giá thấp nhất 90 ngày            │
│ Cập nhật 3 phút trước            │
│                                  │
│ [ Xem giá ]                      │
└──────────────────────────────────┘
```

### Card hierarchy

1. Image.
2. Name.
3. Current price.
4. Price change.
5. Historical signal.
6. Freshness.
7. CTA.

Không hiển thị technical metadata.

---

# 9. Price Movement Component

Đây phải là một signature visual primitive.

```text
7.090.000đ
────────────
6.190.000đ

-900.000đ
-12,7%
```

Component dùng ở:

```text
Home
Watching
Product Detail
Notification
Zalo message
Deal Feed
Hunt results
```

Visual language phải nhất quán toàn product.

---

# 10. Deal Signal System

Không sử dụng emoji.

Dùng text badge + icon/vector + color.

## Phase 1

```text
VỪA GIẢM
GIÁ THẤP
GẦN GIÁ MỤC TIÊU
ĐANG THEO DÕI
```

## Phase 4+

```text
MỨC THẤP MỚI
GIẢM NHANH
GIÁ THẤP 90 NGÀY
GIÁ THẤP NHẤT QUAN SÁT
```

Mỗi badge phải có logic dữ liệu cụ thể.

Ví dụ:

```text
GIÁ THẤP 90 NGÀY
=
Current price <= minimum price in last 90 days
```

Không dùng badge chỉ để trang trí.

---

# 11. Price Target

Đây là interaction trung tâm của "săn deal".

## UI

```text
GIÁ MỤC TIÊU

Bạn sẽ mua ở mức giá nào?

[ 6.000.000đ ]

[ Đặt giá mục tiêu ]
```

Sau đó:

```text
GIÁ HIỆN TẠI
6.190.000đ

GIÁ MỤC TIÊU
6.000.000đ

Còn cách 190.000đ
```

Visual:

```text
6.190m ───────────── 6.000m
         ████████████░
```

Progress chỉ biểu thị khoảng cách giá.

Không dùng game terminology.

---

# 12. Product Detail — Rebuild Around Decision Making

Không thiết kế như analytics dashboard.

## Top section

```text
Sony WH-1000XM6
Shopee

6.190.000đ
Giảm 12,7%

Cập nhật 3 phút trước
```

CTA:

```text
[ Đặt giá mục tiêu ]
```

---

# 13. Product Detail — Price Brief

Ngay dưới hero:

```text
THÔNG TIN GIÁ

Giá hiện tại thấp hơn 12,7%
so với mức trung vị 90 ngày.

Mức thấp nhất đã ghi nhận:
6.050.000đ

Bạn đang cách mức thấp này 140.000đ.
```

Mục tiêu:

Người dùng không cần tự đọc chart mới hiểu tình hình.

---

# 14. Product Detail — Chart

Chart phục vụ câu hỏi:

> "Giá này đang ở đâu trong lịch sử?"

## Range

```text
7 ngày | 30 ngày | 90 ngày | Tất cả
```

## Visual

```text
7.5m ┤
7.0m ┤ ●─────●
6.5m ┤        ╲
6.2m ┤          ●
6.0m ┤ ───────────── Giá mục tiêu
     └────────────────────────
```

### Markers

Có thể đánh dấu:

```text
Giá thấp
Giá mục tiêu
Mức giảm lớn
```

Tooltip:

```text
27/09/2026
14:30

Giá
6.190.000đ

Phí giao hàng
20.000đ

Giá thực tế
6.210.000đ
```

---

# 15. Price Context

Sau chart:

```text
GIÁ TRONG 90 NGÀY

┌────────────────┬────────────────┐
│ Thấp nhất      │ Trung bình     │
│ 6.050.000đ     │ 6.730.000đ     │
├────────────────┼────────────────┤
│ Cao nhất       │ Hiện tại       │
│ 8.290.000đ     │ 6.190.000đ     │
└────────────────┴────────────────┘
```

Không cần 10–20 metrics.

---

# 16. Watching Screen

Tên user-facing nên là:

```text
Đang theo dõi
```

Không dùng:

```text
Tracked Products
```

## Layout

Card grid trên desktop.

Single-column trên mobile.

Filter:

```text
Tất cả
Đang giảm
Gần giá mục tiêu
Không khả dụng
```

Phase 1 chỉ cần những filter có ý nghĩa thật.

---

# 17. Watching Card — More Hunting DNA

Ví dụ:

```text
Sony WH-1000XM6

6.190.000đ
Giảm 12,7%

Giá mục tiêu
6.000.000đ

Còn cách 190.000đ

Cập nhật 3 phút trước

[ Xem giá ]
```

User nhìn card là biết ngay:

```text
Tôi đang theo cái gì?
Giá bao nhiêu?
Giá giảm chưa?
Target của tôi là gì?
Còn bao xa?
Data có mới không?
```

---

# 18. Freshness System

Deal hunting cần yếu tố thời gian.

## Fresh

```text
Cập nhật 3 phút trước
```

## Older

```text
Cập nhật 47 phút trước
```

## Stale

```text
Giá được cập nhật lần cuối 3 giờ trước
```

Không nên biến stale thành alarm quá mạnh.

Mục tiêu là **minh bạch về độ mới của dữ liệu**.

---

# 19. Price Drop Moment

Khi giá giảm:

```text
6.490.000đ
      ↓
6.190.000đ
```

UI có animation nhẹ:

1. Current price transition.
2. Price movement appears.
3. Historical signal cập nhật.
4. Chart thêm point.

Không dùng confetti, particle hoặc animation gaming.

---

# 20. Target Reached Moment

Khi giá đạt target:

```text
GIÁ MỤC TIÊU ĐÃ ĐẠT

5.990.000đ

Giá mục tiêu
6.000.000đ
```

CTA:

```text
[ Xem sản phẩm ]
```

Có thể highlight nhẹ trong vài giây.

Sau đó trở lại trạng thái bình thường.

---

# 21. Empty State

## Chưa theo dõi sản phẩm

```text
Bạn chưa theo dõi sản phẩm nào.

Dán link sản phẩm để bắt đầu theo dõi giá.

[ Theo dõi giá ]
```

## Chưa có price history

```text
Đang thu thập lịch sử giá.

Khi có thêm dữ liệu, bạn sẽ thấy giá
thay đổi theo thời gian ở đây.
```

Không hiển thị chart giả.

---

# 22. Error State

## URL không hợp lệ

```text
Link này chưa được hỗ trợ.

Hãy kiểm tra lại đường dẫn sản phẩm.

[ Thử lại ]
```

## Marketplace không phản hồi

```text
Không thể lấy giá lúc này.

Giá gần nhất:
6.290.000đ

Cập nhật lần cuối:
2 giờ trước

[ Thử lại ]
```

## Product unavailable

```text
Sản phẩm hiện không khả dụng.

Có thể sản phẩm đã bị gỡ hoặc thay đổi đường dẫn.
```

Always preserve last known information when possible.

---

# 23. Product Image Strategy

Product image là một phần quan trọng của B2C feeling.

Ưu tiên:

```text
Large
Clean
Centered
Consistent aspect ratio
```

Không nên:

```text
tiny thumbnail
busy card
too many metadata fields
```

Card phải nhìn giống một consumer shopping card hơn là data row.

---

# 24. Typography

## Recommended hierarchy

```text
Product title
24–32px desktop

Current price
32–48px desktop

Price change
16–20px

Section title
18–20px

Metadata
13–15px
```

Mobile giảm size nhưng giữ hierarchy.

Price phải luôn là một trong những thành phần lớn nhất trên màn hình.

---

# 25. Color System

Không cần nhiều màu.

```text
Background
Neutral / warm neutral

Primary text
Dark

Secondary text
Muted gray

Brand accent
1 signature accent

Price decrease
Accent hoặc green

Price increase
Red

Attention
Amber
```

## Important rule

Accent chỉ xuất hiện mạnh ở:

```text
Price movement
Target
Deal signal
Primary CTA
```

Nó không được phủ toàn UI.

---

# 26. Icon System

Không sử dụng emoji.

Dùng icon vector/system nhất quán cho:

```text
Price drop
Target
Clock / freshness
Store
Chart
Watch
Notification
External link
Pause
Resume
```

Icon chỉ hỗ trợ meaning.

Không dùng icon như decoration dày đặc.

---

# 27. Navigation Vocabulary

User-facing language:

```text
Khám phá
Đang theo dõi
Cài đặt
```

Phase 2:

```text
Khám phá
Đang theo dõi
Cảnh báo
Cài đặt
```

Phase 5:

```text
Deal
Săn giá
Đang theo dõi
Cảnh báo
```

Không dùng technical terms.

---

# 28. Search / Discovery Roadmap

Chỉ thêm khi discovery engine thật sự sẵn sàng.

## Phase 1

```text
Paste product URL
```

## Phase 3

```text
Search product
```

## Phase 5

```text
Search
   ↓
Cross-platform results
   ↓
Price comparison
   ↓
Deal signals
```

Search UI phải ưu tiên:

```text
Product
Current price
Discount
Historical signal
Platform
```

Không biến search result thành marketplace clone.

---

# 29. Phase 2 — Alert UX

Flow:

```text
Product Detail
      ↓
Đặt giá mục tiêu
      ↓
Điều kiện
      ↓
Kênh nhận thông báo
      ↓
Zalo
```

UI:

```text
ĐẶT GIÁ MỤC TIÊU

Giá hiện tại
6.190.000đ

Báo tôi khi giá:

[ 6.000.000đ ]

Hoặc

Giảm ít nhất [ 10 ] %

Thời hạn
[ 30 ngày ]

Nhận thông báo qua
[ Zalo ]

[ Lưu mục tiêu ]
```

---

# 30. Phase 2 — Alert Status

Trên product:

```text
ĐANG THEO DÕI

Giá hiện tại
6.190.000đ

Giá mục tiêu
6.000.000đ

Còn cách
190.000đ
```

Khi hit:

```text
GIÁ MỤC TIÊU ĐÃ ĐẠT

5.990.000đ
```

---

# 31. Phase 3 — Cross-platform UI

```text
Sony WH-1000XM6

Shopee
6.290.000đ

Lazada
6.390.000đ

TikTok Shop
6.190.000đ
```

Section:

```text
GIÁ THẤP NHẤT QUAN SÁT

6.190.000đ
```

Mỗi marketplace hiển thị:

```text
Price
Shipping
Stock
Seller
Freshness
```

Chỉ đưa ra dữ liệu thực tế.

---

# 32. Phase 4 — Price Intelligence UX

Product Detail có:

```text
TÌNH HÌNH GIÁ

6.190.000đ

Thấp hơn 12,7%
so với trung vị 90 ngày.

Cách mức thấp nhất:
140.000đ
```

Có thể thêm:

```text
Vị trí giá hiện tại
██████████████████░░
```

với chú thích rõ ràng.

Không chỉ đưa ra một "Deal Score" khó hiểu.

---

# 33. Phase 4 — Fake Discount

Nếu dữ liệu đủ tin cậy:

```text
GIÁ NIÊM YẾT
9.990.000đ

GIÁ HIỆN TẠI
6.990.000đ

LỊCH SỬ GIÁ
Giá phổ biến gần đây:
7.090.000đ
```

UI giúp user phân biệt:

```text
Discount shown by seller
vs
Historical price difference
```

Không kết luận quá mức nếu dữ liệu chưa đủ.

---

# 34. Phase 5 — Deal Feed

Home trở thành discovery engine thật:

```text
DEAL HUNTER

Bạn đang tìm gì?

[ Tìm sản phẩm ]

──────────────

Giá đang giảm

Sony WH-1000XM6
6.190.000đ
Giảm 12,7%

Samsung SSD 2TB
2.790.000đ
Giảm 16,4%

Keyboard
1.590.000đ
Giảm 11,0%
```

Ranking dựa trên:

```text
Recent price movement
Historical significance
Freshness
Target proximity
Cross-platform gap
```

---

# 35. Phase 5 — Hunt Mode

```text
SĂN GIÁ

Tôi đang tìm:

[ RTX 5070 ]

Ngân sách
[ 45.000.000đ ]

Nền tảng
[ Shopee ]
[ Lazada ]
[ TikTok Shop ]

Theo dõi khi:
[ ] Dưới ngân sách
[ ] Giá thấp mới
[ ] Giảm mạnh

[ Bắt đầu theo dõi ]
```

Sau đó:

```text
ĐANG SĂN

17 sản phẩm phù hợp
4 sản phẩm đáng theo dõi
```

---

# 36. Phase 6 — Personalized Experience

Future Home:

```text
Xin chào

3 sản phẩm bạn đang theo dõi vừa thay đổi giá.

Sony XM6
6.090.000đ
Giảm 5,2%

SSD 2TB
2.690.000đ
Gần giá mục tiêu

──────────────

2 deal mới phù hợp với tiêu chí của bạn.
```

Tạo cảm giác:

> "Deal Hunter đang đi săn cùng mình."

Nhưng vẫn phải dựa trên dữ liệu thực.

---

# 37. Motion Guidelines

Motion phải có mục đích.

## Use

```text
Price transition
Target progress
Signal appearance
Feed refresh
Chart interaction
```

## Avoid

```text
Confetti
Particles
Bouncing cards
Looping decoration
Fake countdown
Excessive hover animation
```

Motion duration nên ngắn, subtle.

---

# 38. Do Not Gamify

Không dùng:

```text
Points
Coins
XP
Level
Streak
Leaderboard
Virtual rewards
```

Deal Hunter là consumer utility.

Cảm giác "săn" đến từ:

```text
Discovery
Timing
Price movement
Target
Scarcity of price opportunity
Historical context
```

---

# 39. Consumer Copy Rules

## Use

```text
Giá hiện tại
Giá thấp nhất
Giảm 12,7%
Giá mục tiêu
Đang theo dõi
Vừa giảm
Cập nhật 5 phút trước
Còn cách 150.000đ
Giá mục tiêu đã đạt
```

## Avoid

```text
Effective Price
Price Snapshot
Fetch Status
Tracking Entity
Rule Engine
Price Event
Product Source
```

Internal terminology không xuất hiện trong UI.

---

# 40. Accessibility

Phải đảm bảo:

```text
Keyboard navigation
Visible focus
Sufficient contrast
Touch targets
Screen reader labels
Chart textual summary
Color-independent price signal
```

Ví dụ không chỉ:

```text
green = price decreased
```

mà phải có:

```text
Giảm 12,7%
```

---

# 41. Product Analytics

Track:

```text
home_view
paste_url
product_resolved
tracking_created
tracking_failed

tracking_list_viewed
product_detail_viewed

price_chart_opened
price_chart_range_changed

price_target_created
tracking_paused
tracking_resumed
```

Core funnel:

```text
Home
 ↓
Paste
 ↓
Resolved
 ↓
Tracking
```

Phase 2:

```text
Tracking
 ↓
Target created
 ↓
Target hit
 ↓
Notification opened
 ↓
Marketplace clicked
```

---

# 42. Primary UX Metrics

Phase 1:

```text
URL → Tracking conversion
Product detail engagement
Repeat visits
Tracking retention
```

Phase 2:

```text
Tracking → Price target conversion
Target → Notification engagement
Notification → Marketplace click
```

Phase 5:

```text
Deal discovery → Tracking
Deal discovery → Marketplace click
```

North-star principle:

> User phải tìm thấy giá trị nhanh, không phải ở lại app lâu một cách giả tạo.

---

# 43. Design System Structure

```text
design-system/
├── colors
├── typography
├── spacing
├── radius
├── shadows
├── icons
├── motion
└── components
```

Key reusable components:

```text
UrlInput
ProductCard
ProductImage
PlatformBadge

PriceDisplay
PriceMovement
PriceTarget
PriceSignal
FreshnessLabel

PriceChart
PriceSummary
PriceStat

TrackingButton
TargetButton

EmptyState
LoadingState
ErrorState

BottomNav
Header
```

---

# 44. UI Component Priority

## P0 — Phase 1

```text
AppShell
UrlInput
ProductCard
PriceDisplay
PriceMovement
PriceChart
PriceTarget
FreshnessLabel
PlatformBadge
TrackingButton
EmptyState
ErrorState
LoadingState
```

## P1 — Phase 2

```text
AlertBuilder
AlertStatus
NotificationCard
ZaloConnection
TargetReachedState
```

## P2 — Phase 3+

```text
MarketplaceComparison
DealSignal
PriceContext
DealFeedCard
HuntCard
```

---

# 45. Phase-by-Phase UI Roadmap

## Phase 1 — Core Tracking

Goal:

> User hiểu ngay cách theo dõi giá và cảm nhận được price movement.

```text
[x] Modern Home
[x] Paste URL
[x] Product Preview
[x] Watching List
[x] Product Detail
[x] Price Chart
[x] Price Movement
[x] Price Context
[x] Price Target visual
[x] Freshness
[x] Responsive layout
[x] Loading states
[x] Empty states
[x] Error states
```

Chưa cần global deal feed nếu backend chưa có discovery data.

---

## Phase 2 — Target + Zalo

Goal:

> User bắt đầu thực sự "đặt bẫy giá".

```text
[ ] Price Target
[ ] Alert Builder
[ ] Alert Status
[ ] Target Progress
[ ] Target Reached State
[ ] Notification Center
[ ] Zalo Connection
```

---

## Phase 3 — Multi-marketplace

Goal:

> User thấy mình đang săn giá giữa nhiều nơi.

```text
[ ] Cross-platform comparison
[ ] Best observed price
[ ] Marketplace cards
[ ] Effective price display
[ ] Freshness per source
```

---

## Phase 4 — Price Intelligence

Goal:

> User hiểu giá hiện tại có đáng chú ý không.

```text
[ ] Price Context
[ ] Historical percentile
[ ] Deal signals
[ ] Historical low
[ ] Price volatility visualization
[ ] Fake discount evidence
[ ] Explainable deal information
```

---

## Phase 5 — Discovery

Goal:

> User mở app ngay cả khi chưa có sản phẩm cụ thể.

```text
[ ] Search
[ ] Deal Feed
[ ] Category
[ ] Keyword Hunt
[ ] Hunt Mode
[ ] Personalized discovery
```

---

## Phase 6 — Mature B2C Experience

Goal:

> Deal Hunter trở thành personal shopping intelligence product.

```text
[ ] Wishlist
[ ] Collections
[ ] Saved Hunts
[ ] Deal Calendar
[ ] Price journey
[ ] Advanced personalization
[ ] Buy / Wait signals
```

---

# 46. Final UI DNA

Deal Hunter phải giữ 6 nguyên tắc xuyên suốt:

```text
1. Modern consumer product
2. Instant comprehension
3. Price-first visual hierarchy
4. Data-driven hunting feeling
5. Minimal but meaningful interaction
6. No emoji
```

### One-line design statement

> **Deal Hunter should feel like a modern shopping companion that is always watching the price for you.**

Không phải:

> "A dashboard for tracking product prices."

---

# 47. Recommended Phase 1 Final Experience

Màn hình đầu:

```text
DEAL HUNTER

Săn đúng giá trước khi mua

[ Dán link sản phẩm ]

──────────────

ĐANG THEO DÕI

Sony WH-1000XM6
6.190.000đ
Giảm 12,7%

Giá thấp nhất 90 ngày
6.050.000đ

Cập nhật 3 phút trước

[ Xem giá ]
```

Product Detail:

```text
Sony WH-1000XM6
Shopee

6.190.000đ
Giảm 12,7%

Giá thấp nhất 90 ngày
6.050.000đ

Giá mục tiêu
6.000.000đ

Còn cách 190.000đ

────────────────

LỊCH SỬ GIÁ

[ 7 ngày ] [ 30 ngày ] [ 90 ngày ]

              PRICE CHART

────────────────

THÔNG TIN GIÁ

Thấp nhất      6.050.000đ
Trung bình     6.730.000đ
Cao nhất       8.290.000đ

[ Đặt giá mục tiêu ]
```

Đây là baseline UI/UX mà toàn bộ các phase sau nên phát triển tiếp, thay vì đổi mental model mỗi phase.

---

# 48. IMPORTANT — Home State & Data Ownership

## 48.1. Không được nhầm "Watching" với "Global Deals"

Đây là một rule quan trọng của product.

**`Watching`** là danh sách sản phẩm do **chính user đó thêm vào**.

**`Global Deals / Discovery`** là dữ liệu do hệ thống tự phát hiện trên thị trường và chỉ được xuất hiện khi Deal Hunter đã có **Discovery Engine** thực sự.

Hai khái niệm này phải tách biệt hoàn toàn trong UI và product logic.

```text
USER DATA
    ↓
Watching
    ↓
Chỉ có sản phẩm user đã thêm

SYSTEM DATA
    ↓
Discovery / Deals
    ↓
Sản phẩm hệ thống tự phát hiện
```

Không được dùng system-discovered products để giả lập danh sách "đang theo dõi" của user.

---

# 49. Phase 1 — Home phải hỗ trợ Zero State

Khi user mới mở app lần đầu:

```text
User mới
    ↓
Chưa theo dõi sản phẩm nào
    ↓
Không có lịch sử cá nhân
    ↓
Không có alert
```

Vì vậy **không được hiện section "Đang giảm giá" dưới danh nghĩa dữ liệu của user**.

## Home — New User

```text
DEAL HUNTER

Săn đúng giá trước khi mua

Dán link sản phẩm để bắt đầu theo dõi

[ Dán link sản phẩm ]

[ Theo dõi giá ]

────────────────────────

Theo dõi giá hoạt động thế nào?

1. Dán link sản phẩm
2. Deal Hunter tự kiểm tra giá
3. Xem lịch sử giá và chờ mức giá bạn muốn

────────────────────────

Hỗ trợ
Shopee · Lazada · TikTok Shop
```

### Mục tiêu

User phải hiểu ngay:

> "Tôi cần đưa cho app một sản phẩm trước."

Không tạo cảm giác hệ thống đã có sẵn danh sách cá nhân của user.

---

# 50. Phase 1 — Home khi user đã có dữ liệu

Khi user bắt đầu theo dõi sản phẩm:

```text
User
 ↓
1+ tracked products
 ↓
Home có thể hiển thị "Đang theo dõi"
```

## Ví dụ

```text
DEAL HUNTER

Sản phẩm đang theo dõi

┌────────────────────────────┐
│ Sony WH-1000XM6            │
│ 6.190.000đ                 │
│ Giảm 8,7%                  │
│ Cập nhật 3 phút trước      │
│                            │
│ [ Xem giá ]                │
└────────────────────────────┘
```

Đây là **personal data** và phải được lấy từ `tracked_products`.

---

# 51. Home State 1 — New User

```text
tracked_products = 0
```

Hiển thị:

```text
Hero
+
Paste URL
+
How it works
+
Supported marketplaces
```

Không hiển thị:

```text
Global deals
Personal watching
Personal alerts
Price history
```

trừ khi đó là content thật sự độc lập với account và được product xác định rõ.

---

# 52. Home State 2 — User đang theo dõi ít sản phẩm

```text
tracked_products = 1..3
```

Home ưu tiên:

```text
Hero
+
Watching
+
Recent price changes của chính user
```

Ví dụ:

```text
Đang theo dõi

Sony XM6
6.190.000đ
Giảm 8,7%

SSD 2TB
2.790.000đ
Không đổi
```

Không cần global deal feed.

---

# 53. Home State 3 — User đã có nhiều dữ liệu

```text
tracked_products > 3
```

Home có thể trở thành:

```text
Sản phẩm đang theo dõi

2 sản phẩm vừa giảm giá
1 sản phẩm gần giá mục tiêu
1 sản phẩm chưa cập nhật
```

Ví dụ:

```text
Giá vừa thay đổi

Sony XM6
6.190.000đ
Giảm 300.000đ

SSD 2TB
2.790.000đ
Giảm 200.000đ
```

Tất cả đều phải đến từ sản phẩm mà user thực sự đang theo dõi.

---

# 54. Global Deal Discovery chỉ xuất hiện ở Phase có Discovery Engine

Section như:

```text
Đang giảm giá
Deals đang đáng chú ý
Deals cho bạn
```

chỉ được đưa vào product khi backend đã có:

```text
Marketplace Discovery
        ↓
Product Discovery
        ↓
Price Ingestion
        ↓
Historical Analysis
        ↓
Deal Detection
        ↓
Global / Personalized Discovery
```

Đây là roadmap Phase 5.

Không mock hoặc hard-code dữ liệu discovery để làm cho Phase 1 trông "đầy app".

---

# 55. Distinguish Three Different Product Lists

UI phải phân biệt rõ 3 nguồn dữ liệu.

## A. Watching

```text
Sản phẩm tôi đang theo dõi
```

Nguồn:

```text
tracked_products
```

Do user chủ động thêm.

---

## B. Discovery

```text
Deals đang đáng chú ý
```

Nguồn:

```text
Discovery Engine
```

Do hệ thống phát hiện.

User chưa cần theo dõi sản phẩm đó.

---

## C. Hunt Results

```text
Kết quả săn giá
```

Nguồn:

```text
Search / Hunt Engine
```

Dựa trên tiêu chí user nhập.

Ví dụ:

```text
RTX 5070
Budget < 45.000.000đ
```

Ba danh sách này không được gộp thành một khái niệm "products".

---

# 56. Navigation Rules

## Phase 1

```text
Khám phá
Đang theo dõi
Cài đặt
```

Nhưng `Khám phá` trong Phase 1 không đồng nghĩa với global deal feed.

Có thể đơn giản là:

```text
Khám phá
→ Home / Start Tracking
```

## Phase 5+

Khi Discovery Engine đã có thật:

```text
Deal
Săn giá
Đang theo dõi
Cảnh báo
Cài đặt
```

---

# 57. Important Mockup Rule

**Mockup không được dùng dữ liệu Phase 5 để đại diện cho trải nghiệm Phase 1.**

Ví dụ không được mock:

```text
User mới

Đang giảm giá
Sony XM6
SSD 2TB
Keyboard
```

nếu các sản phẩm đó không phải dữ liệu user đã theo dõi.

Nếu cần minh họa Discovery UI trong design exploration:

```text
LABEL:
Future / Phase 5 — Discovery
```

để đội dev và designer không nhầm scope.

---

# 58. Source-of-Truth Mapping

## UI: "Đang theo dõi"

Backend:

```text
tracked_products
```

## UI: "Giá hiện tại"

Backend:

```text
product_sources.last_effective_price
```

## UI: "Lịch sử giá"

Backend:

```text
price_snapshots
```

## UI: "Deals đang đáng chú ý"

Backend tương lai:

```text
discovery / deal detection pipeline
```

## UI: "Cảnh báo"

Backend tương lai:

```text
alert rules
```

---

# 59. Phase 1 Home Acceptance Criteria

### New user

```text
tracked_products = 0
```

UI phải:

- Giải thích sản phẩm làm gì.
- Có CTA dán link.
- Không giả lập watching list.
- Không giả lập personalized deals.
- Không hiển thị historical data chưa tồn tại.

### Existing user

```text
tracked_products > 0
```

UI có thể:

- Hiện sản phẩm đang theo dõi.
- Hiện current price.
- Hiện price movement.
- Hiện freshness.
- Hiện shortcut vào Product Detail.

### Discovery

Chỉ hiển thị khi backend feature tương ứng đã tồn tại.

---

# 60. Design Principle Added

> **Never fabricate product state to make the UI look populated.**

Empty state là một trạng thái hợp lệ của B2C product.

Một Home trống nhưng rõ ràng và hấp dẫn tốt hơn một Home đầy sản phẩm mà user không hề theo dõi.

---

# 61. Corrected Phase 1 Experience

## New User

```text
Home
 ↓
"Bạn muốn theo dõi sản phẩm nào?"
 ↓
Paste URL
 ↓
Product Preview
 ↓
Start Watching
 ↓
Product Detail
```

## Returning User

```text
Home
 ↓
Watching
 ↓
Recent Price Movement
 ↓
Product Detail
```

## Later — Discovery Phase

```text
Home
 ↓
Deals
 ↓
Discovery
 ↓
Watch / Hunt
```

---

# 62. Mockup Guidance

Mọi mockup cho Phase 1 phải được chia rõ:

```text
A. New User
B. User với 1–3 sản phẩm
C. User với nhiều sản phẩm
```

Nếu mockup Discovery:

```text
D. Future — Phase 5 Discovery
```

Không trộn A/B/C với D trong cùng một flow mà không có label.


---

# 63. B2C HANDOFF — NON-NEGOTIABLE UI CONSTRAINTS

Đội FE/Design phải coi các điểm dưới đây là **product constraints**, không phải suggestions.

## 63.1 Product identity

Deal Hunter = **modern shopping companion for price timing**.

Không phải:

```text
price management dashboard
admin panel
analytics console
marketplace back-office
```

---

## 63.2 Desktop layout

Phase 1 desktop/web: **không sidebar**.

Preferred structure:

```text
Header
  ├── Brand
  ├── Search / Paste URL
  ├── Notifications
  └── Account

Main content
  ├── Primary action / current context
  ├── Product cards / price information
  ├── Price chart
  └── Supporting information
```

Không tạo:

```text
Left sidebar
├── Dashboard
├── Products
├── Sources
├── Jobs
├── Workers
└── Analytics
```

---

## 63.3 Home behavior

### New user

```text
tracked_products = 0
```

Home phải trả lời:

> "Tôi bắt đầu săn giá như thế nào?"

Ưu tiên:

```text
Hero
↓
Paste product URL
↓
How it works
↓
Supported marketplaces
```

Không tự nhét vào Home:

```text
Watching products chưa tồn tại
Personal price signals chưa tồn tại
Personal alerts chưa tồn tại
Fake/global deals nếu Discovery chưa có thật
```

### Existing user

Khi user đã có tracking:

```text
Watching
↓
Recent price movement
↓
Product detail
```

### Future discovery

Global deal feed chỉ xuất hiện khi Discovery Engine thực sự tồn tại.

---

## 63.4 User language

UI phải dùng ngôn ngữ mà người mua hiểu ngay:

```text
Giá hiện tại
Giảm 12,7%
Giá thấp nhất
Giá mục tiêu
Đang theo dõi
Vừa giảm
Cập nhật 5 phút trước
```

Không dùng internal vocabulary:

```text
Effective Price
Price Snapshot
Fetch Job
Product Source
Rule Engine
Scheduler
Worker
```

---

## 63.5 B2C visual hierarchy

Mỗi product view ưu tiên:

```text
1. Product
2. Current price
3. Price movement
4. Price context / target
5. Chart
6. Metadata
```

Không ưu tiên:

```text
IDs
technical statuses
raw source metadata
job information
implementation details
```

---

## 63.6 Zero-state integrity

**Không dùng dữ liệu tương lai hoặc dữ liệu giả để làm Phase 1 trông đầy đặn.**

Ví dụ không được dùng:

```text
New user
↓
"Đang giảm giá"
↓
Sony XM6
SSD 2TB
Keyboard
```

trừ khi đó là một tính năng discovery thật sự tồn tại và được đánh dấu rõ là **Global Discovery**, không phải **Đang theo dõi**.

`Watching` chỉ lấy từ `tracked_products` của chính user.

---

## 63.7 Consumer comprehension test

Một user mới phải trả lời được trong vài giây:

```text
Đây là app gì?
→ Theo dõi giá để mua đúng lúc.

Tôi phải làm gì?
→ Dán link sản phẩm.

Giá hiện tại là bao nhiêu?
→ Nhìn thấy ngay.

Giá có đáng chú ý không?
→ Thấy mức giảm + ngữ cảnh lịch sử.

Tôi muốn mua ở giá nào?
→ Đặt giá mục tiêu.
```

Nếu cần đọc documentation để hiểu màn hình đầu tiên, UI đang fail acceptance criteria.

---

## 63.8 Mockup rules

Mọi mockup phải ghi rõ phase/state:

```text
Phase 1 — New User
Phase 1 — Existing User
Phase 2 — Alerts
Phase 3 — Cross-platform
Phase 5 — Discovery
```

Không trộn feature tương lai vào Phase 1 mockup chỉ để giao diện trông đầy đủ.

---

## 63.9 Final design principle

> **Modern B2C first. Deal-hunting DNA second. Technical complexity stays behind the interface.**

Deal Hunter có thể có backend phức tạp, crawler, workers, queues và price intelligence; nhưng người dùng phải trải nghiệm nó như một sản phẩm consumer đơn giản, rõ ràng và đáng tin cậy.
