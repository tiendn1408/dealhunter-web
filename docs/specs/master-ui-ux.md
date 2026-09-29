# Deal Hunter — UI/UX Plan

## 1. UI/UX Product Direction

Deal Hunter là một sản phẩm **B2C**, vì vậy UI không nên mang tư duy admin dashboard.

Không thiết kế theo kiểu:

```text
Sidebar
├── Products
├── Tracking
├── Jobs
├── Marketplace
├── Analytics
└── Settings
```

Đó là cách nhìn từ phía hệ thống.

Người dùng không quan tâm:

- Worker đang chạy bao nhiêu job.
- Scheduler đang xử lý gì.
- Có bao nhiêu crawler.
- Redis đang có bao nhiêu message.

Người dùng quan tâm:

> **"Món tôi muốn mua hiện giá bao nhiêu, giá này có tốt không, và khi nào tôi nên mua?"**

Do đó UI phải xoay quanh 3 hành động:

```text
DISCOVER
   ↓
TRACK
   ↓
ACT
```

Trong Phase 1:

```text
DISCOVER
   ↓
PASTE LINK
   ↓
TRACK
   ↓
VIEW PRICE HISTORY
```

Các phase sau mới mở rộng:

```text
DISCOVER DEALS
   ↓
TRACK
   ↓
GET SIGNAL
   ↓
BUY
```

---

# 2. UX Principles

## 2.1. Consumer-first

Mọi màn hình phải trả lời được:

> "User được lợi gì?"

Không expose internal system concepts nếu không cần.

---

## 2.2. One primary action per screen

Ví dụ Home:

```text
Paste product URL
        ↓
     Track
```

Không biến Home thành dashboard đầy KPI.

---

## 2.3. Price là visual hierarchy cao nhất

Ở Product Detail:

```text
Product name

6.290.000đ  ← lớn nhất

↓ 8.7%       ← signal

Price chart
```

Không để metadata như seller ID hoặc fetch status chiếm visual attention.

---

## 2.4. Explainable over decorative

Nếu hệ thống nói:

```text
GOOD DEAL
```

phải có lý do.

Ví dụ:

```text
13% thấp hơn giá trung vị 90 ngày
Gần mức giá thấp nhất đã ghi nhận
```

Không cần AI/LLM.

---

## 2.5. Progressive disclosure

Thông tin cơ bản hiển thị trước.

Thông tin sâu chỉ mở khi user cần.

```text
Level 1
Current Price
Price Signal

Level 2
Price chart
Historical statistics

Level 3
Marketplace metadata
Seller
Shipping
Raw details
```

---

## 2.6. Mobile-first, desktop-friendly

Use case chính:

```text
Mobile
→ nhận alert
→ xem giá
→ mở product
→ quyết định mua
```

Desktop:

```text
→ compare
→ xem chart
→ quản lý nhiều tracking
```

UI phải responsive từ đầu.

---

# 3. Information Architecture

Phase 1:

```text
Deal Hunter
│
├── Home
│   └── Add Product
│
├── Tracking
│   ├── All
│   ├── Price Dropped
│   └── Product Detail
│
└── Settings
```

Không cần navigation phức tạp.

### Mobile navigation

Có thể dùng bottom navigation:

```text
┌───────────────────────────────────────┐
│                                       │
│               CONTENT                 │
│                                       │
├────────┬───────────────┬──────────────┤
│ Home   │  Tracking     │   Settings   │
└────────┴───────────────┴──────────────┘
```

### Desktop navigation

Header đơn giản:

```text
DEAL HUNTER

Home     Tracking                     Settings
```

Không dùng sidebar nặng ở Phase 1.

---

# 4. Phase 1 User Journey

Primary journey:

```text
Home
 ↓
Paste URL
 ↓
Analyzing product
 ↓
Product preview
 ↓
Start tracking
 ↓
Tracking success
 ↓
Product Detail
 ↓
View price history
```

Secondary journey:

```text
Tracking
 ↓
Select product
 ↓
Product Detail
 ↓
Pause / Resume tracking
```

Error journey:

```text
Paste URL
 ↓
Detect platform
 ↓
Fetch failed
 ↓
Explain problem
 ↓
Retry
```

---

# 5. Phase 1 Screens

## Screen 01 — Home

### Goal

Một việc duy nhất:

> Bắt đầu theo dõi một sản phẩm.

### Layout

```text
┌─────────────────────────────────────────────┐
│ DEAL HUNTER                                  │
│                                             │
│          Săn giá trước khi xuống tiền       │
│                                             │
│   Theo dõi biến động giá từ các sàn         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Dán link sản phẩm...                    │ │
│ └─────────────────────────────────────────┘ │
│                              [ Theo dõi ]   │
│                                             │
│ Shopee · Lazada · TikTok Shop               │
└─────────────────────────────────────────────┘
```

### Design intent

Không đưa chart, KPI, table lên Home.

User mới vào chưa có data.

Home phải dẫn tới action.

---

# 6. Add Product Flow

Sau khi user paste URL:

```text
[ Theo dõi ]
     ↓
Analyzing
```

Loading state:

```text
Đang kiểm tra sản phẩm...

✓ Nhận diện nền tảng
✓ Đọc thông tin sản phẩm
● Lấy giá hiện tại
```

Không dùng spinner đơn thuần nếu request có thể kéo dài.

---

# 7. Product Preview

Khi lấy được dữ liệu:

```text
┌─────────────────────────────────────────────┐
│                                             │
│ [product image]                             │
│                                             │
│ Sony WH-1000XM6                             │
│ Shopee                                      │
│                                             │
│ 6.290.000đ                                  │
│                                             │
│ Shop: ABC Official                          │
│ Tình trạng: Còn hàng                        │
│                                             │
│          [ Bắt đầu theo dõi ]               │
└─────────────────────────────────────────────┘
```

### UX rule

Cho user thấy:

- Product title
- Platform
- Current price
- Stock
- Seller nếu có

Trước khi user confirm tracking.

---

# 8. Tracking Success

Sau khi tracking:

```text
┌─────────────────────────────────────────────┐
│ ✓ Đang theo dõi                             │
│                                             │
│ Sony WH-1000XM6                             │
│                                             │
│ Giá hiện tại                                │
│ 6.290.000đ                                  │
│                                             │
│ Hệ thống sẽ tự động kiểm tra giá định kỳ.   │
│                                             │
│ [ Xem sản phẩm ]                            │
│ [ Theo dõi sản phẩm khác ]                 │
└─────────────────────────────────────────────┘
```

Không cần chúc mừng quá mức.

Focus vào next action.

---

# 9. Screen 02 — Tracking

Đây là "My Products".

Không nên là table admin.

### Desktop

Card/grid:

```text
┌────────────────────┐ ┌────────────────────┐
│ Sony XM6           │ │ SSD 2TB            │
│ Shopee             │ │ Lazada             │
│                    │ │                    │
│ 6.290.000đ         │ │ 2.790.000đ         │
│ ↓ 8.7%             │ │ ↓ 14.2%            │
│                    │ │                    │
│ 30D chart          │ │ 30D chart          │
│                    │ │                    │
│ Checked 12m ago    │ │ Checked 8m ago     │
└────────────────────┘ └────────────────────┘
```

### Mobile

Single-column cards:

```text
Sony XM6
6.290.000đ
↓ 8.7%

[mini chart]
```

---

# 10. Tracking Filters

Phase 1:

```text
All
Price Dropped
Unavailable
```

Không cần 10 filter.

Sau này:

```text
All
Price Dropped
New Lowest
Good Deals
Expiring Alerts
```

---

# 11. Tracking Card Design

Mỗi card nên có:

```text
1. Product image
2. Product name
3. Platform badge
4. Current effective price
5. Price change
6. Mini sparkline
7. Last checked
```

Ví dụ:

```text
Sony WH-1000XM6
[Shopee]

6.290.000đ
↓ 8.7%

╭────────────╮
│╲      ╲___ │
│ ╲___       │
╰────────────╯

12 phút trước
```

### Không hiển thị

```text
product_source_id
job_id
external_product_id
fetch status = succeeded
```

Đó là system metadata, không phải user value.

---

# 12. Screen 03 — Product Detail

Đây là màn hình quan trọng nhất Phase 1.

## Hero section

```text
Sony WH-1000XM6

6.290.000đ
↓ 8.7% từ lúc bắt đầu theo dõi

[Shopee]
```

Current price phải có hierarchy cao nhất.

---

# 13. Price Chart

Chart là core visual của Deal Hunter.

### Range selector

```text
7D | 30D | 90D | ALL
```

Phase 1 có thể bắt đầu:

```text
7D
30D
ALL
```

### Chart

```text
7.0m ┤ ●
6.8m ┤   ╲
6.6m ┤     ●
6.4m ┤       ╲
6.2m ┤          ●
     └────────────────────
       Sep 1    Sep 15  Sep 29
```

### Interaction

Hover/tap:

```text
Sep 27
14:30

Price
6.290.000đ

Shipping
20.000đ

Effective
6.310.000đ
```

Mobile nên hỗ trợ touch tooltip.

---

# 14. Historical Summary

Bên dưới chart:

```text
┌────────────────┬────────────────┐
│ Lowest         │ Average        │
│ 6.180.000đ     │ 6.540.000đ     │
├────────────────┼────────────────┤
│ Highest        │ Current        │
│ 7.190.000đ     │ 6.290.000đ     │
└────────────────┴────────────────┘
```

Phase 1 không cần quá nhiều metric.

---

# 15. Current Price Context

Một section rất quan trọng:

```text
Giá hiện tại

6.290.000đ

So với lúc bắt đầu theo dõi
↓ 8.7%

So với mức thấp nhất đã ghi nhận
+110.000đ
```

Tạo context tốt hơn chỉ hiển thị price.

---

# 16. Product Metadata

Đặt thấp hơn visual price area:

```text
Thông tin sản phẩm

Platform
Shopee

Seller
ABC Official

Stock
Còn hàng

Last checked
12 phút trước
```

Có thể collapse trên mobile.

---

# 17. Tracking Controls

Bottom action:

```text
[ Tạm dừng theo dõi ]
```

Khi paused:

```text
Tracking paused

[ Tiếp tục theo dõi ]
```

Không cần các action nguy hiểm nằm gần nút chính.

---

# 18. Empty State

User chưa track sản phẩm nào:

```text
Chưa có sản phẩm nào

Dán link sản phẩm để bắt đầu theo dõi giá.

[ Theo dõi sản phẩm ]
```

Không:

```text
No data.
```

Phải nói rõ user nên làm gì tiếp theo.

---

# 19. Loading States

Mỗi page nên có skeleton thay vì blank screen.

Ví dụ Tracking:

```text
┌──────────────────────┐
│ █████████            │
│ ███████              │
│                      │
│ ████████████         │
│ ███████              │
└──────────────────────┘
```

Product Detail:

```text
Title skeleton
Price skeleton
Chart skeleton
Stats skeleton
```

---

# 20. Error States

## Invalid URL

```text
Link này không được hỗ trợ

Hãy sử dụng link sản phẩm từ marketplace được hỗ trợ.

[ Thử link khác ]
```

## Marketplace unavailable

```text
Không thể lấy thông tin sản phẩm lúc này

Marketplace có thể đang không phản hồi.

[ Thử lại ]
```

## Product removed

```text
Sản phẩm không còn khả dụng

Có thể sản phẩm đã bị gỡ hoặc thay đổi đường dẫn.

[ Quay lại danh sách ]
```

## Price unavailable

Không xóa product ngay.

```text
Không lấy được giá mới

Giá gần nhất:
6.290.000đ

Cập nhật lần cuối:
2 giờ trước
```

Điều này quan trọng: user vẫn cần nhìn thấy **last known state**.

---

# 21. Platform Identity

Mỗi marketplace có badge riêng.

Ví dụ:

```text
[Shopee]
[Lazada]
[TikTok Shop]
```

Nhưng không để platform branding lấn át product.

Hierarchy:

```text
Product
Current Price
Price Signal
Platform
```

---

# 22. Price Signal Design

Phase 1 chưa có Deal Score.

Chỉ dùng các signal factual:

```text
↓ 8.7% since tracking started
```

```text
Lowest tracked price
```

```text
Price increased 4.2%
```

```text
No change
```

Tránh đánh giá kiểu:

```text
BEST DEAL!!!
MUST BUY!!!
```

khi chưa có historical context.

---

# 23. Micro-interactions

Không cần animation nặng.

Nên có:

### Price changed

Khi refresh:

```text
6.490.000đ
      ↓
6.290.000đ
```

Có subtle transition.

### Tracking added

Button:

```text
Theo dõi
   ↓
Đang theo dõi ✓
```

### Chart

Tooltip smooth.

### Error

Inline feedback thay vì toast cho mọi lỗi.

---

# 24. Responsive Strategy

## Mobile

Ưu tiên:

```text
Current price
Price change
Chart
Track state
```

## Tablet

2-column layout khi hợp lý.

## Desktop

Có thể:

```text
┌───────────────────────┬────────────────┐
│ Product + Price       │ Tracking info  │
│                       │                │
│ Price chart           │ Seller         │
│                       │ Platform       │
└───────────────────────┴────────────────┘
```

Nhưng không biến thành dashboard.

---

# 25. Visual Design Direction

## Personality

Deal Hunter nên có cảm giác:

```text
Fast
Useful
Trustworthy
Data-driven
Consumer
```

Không nên:

```text
Corporate SaaS
Admin panel
Financial terminal
Overly gamified
```

---

## Typography

Ưu tiên:

- Sans-serif hiện đại.
- Price dùng font weight mạnh.
- Secondary metadata nhẹ hơn.
- Không dùng quá nhiều font size.

Hierarchy gợi ý:

```text
Product title       24–32px desktop
Current price       32–48px
Price change        16–20px
Section title       18–20px
Metadata            13–15px
```

Có thể điều chỉnh khi đưa vào design system thực tế.

---

# 26. Color Strategy

Không nên dùng màu như một hệ thống status quá dày.

Có thể có:

```text
Neutral
→ default UI

Green
→ price decreased / positive price movement

Red
→ price increased / warning

Amber
→ unavailable / attention
```

Nhưng green không mặc định đồng nghĩa với "good deal".

Màu chỉ thể hiện **data state**.

---

# 27. Component System

Phase 1 nên xây reusable component:

```text
AppShell
Header
BottomNav
SearchBar / UrlInput

ProductCard
ProductImage
PlatformBadge
PriceDisplay
PriceChange
PriceSparkline

PriceChart
TimeRangeSelector
PriceStatCard

TrackingButton
PauseTrackingButton

LoadingSkeleton
EmptyState
ErrorState
Toast
Modal
```

Không xây component abstraction quá sớm.

---

# 28. Frontend State

Có 3 loại state:

## Server state

- tracked products
- product detail
- price history
- tracking status

Nên dùng một server-state library phù hợp framework.

## UI state

- selected chart range
- modal open
- loading
- filter

## URL state

Có thể để:

```text
/products/:id
```

hoặc query:

```text
/products/:id?range=90d
```

để share/deep-link được.

---

# 29. Data Fetching UX

Không để:

```text
Open detail
→ white screen
→ wait
→ all data arrives
```

Nên:

```text
Open detail
   ↓
Show cached/last-known data
   ↓
Refresh current state
   ↓
Update chart if necessary
```

Với price tracker, **stale-but-known data tốt hơn blank UI**.

UI phải luôn nói rõ:

```text
Last checked 12 minutes ago
```

để user hiểu freshness.

---

# 30. Accessibility

Phase 1 nên đạt mức cơ bản:

- Keyboard navigation.
- Visible focus.
- Button có text rõ.
- Chart có summary textual.
- Không chỉ dùng màu để biểu thị tăng/giảm.
- Contrast đủ tốt.
- Touch target đủ lớn trên mobile.
- Screen reader label cho icon buttons.

Ví dụ:

```text
↓ 8.7%
```

nên có accessible meaning:

```text
Giá giảm 8.7 phần trăm
```

---

# 31. Phase 1 Product Analytics

Đây là product analytics, không phải admin UI.

Track events:

```text
home_view
paste_url
url_validation_failed
product_resolved
tracking_created
tracking_create_failed
tracking_list_viewed
product_detail_viewed
price_chart_range_changed
tracking_paused
tracking_resumed
```

Mục đích:

Biết user bỏ ở bước nào:

```text
Home
 ↓ 80%
Paste
 ↓ 65%
Resolved
 ↓ 90%
Tracking
```

Từ đó cải thiện funnel.

---

# 32. Phase 1 Performance UX

Target:

```text
Home render
→ fast

Tracking list
→ skeleton immediately

Product detail
→ render current known data first

Chart
→ lazy load if history large
```

Không cần over-optimize.

Quan trọng nhất là perceived latency.

---

# 33. Phase 2 — Alert + Zalo UX

Phase 2 bắt đầu thêm **"Act"**.

Product Detail:

```text
Current Price
6.290.000đ

[ [Alert] Tạo cảnh báo ]
```

## Alert creation

```text
Báo tôi khi...

○ Giá giảm ít nhất
  [ 10 ] %

○ Giá xuống dưới
  [ 6.000.000 ] đ

○ Thấp nhất trong
  [ 90 ] ngày

Thời hạn
[ 30 ngày ]

Kênh
☑ Zalo

[ Tạo cảnh báo ]
```

Sau khi tạo:

```text
[Active] Alert active

Báo khi giá ≤ 6.000.000đ

Hết hạn:
23/10/2026

Zalo connected ✓
```

---

# 34. Phase 2 — Notification Center

Thêm:

```text
Notifications
```

Không cần thành inbox phức tạp.

Ví dụ:

```text
[Deal] Sony XM6
Giá vừa giảm xuống 5.990.000đ

2 giờ trước

[Deal] SSD 2TB
Đã đạt điều kiện bạn đặt

Hôm qua
```

Click → Product Detail.

---

# 35. Phase 3 — Cross-platform Comparison UX

Khi đã matching được product xuyên sàn:

```text
Sony WH-1000XM6

Shopee      6.290.000đ
Lazada      6.390.000đ
TikTok      6.190.000đ
```

Có thể dùng:

```text
Best observed price
6.190.000đ
```

và:

```text
Compare prices
```

Không cần tạo một marketplace UI riêng.

Core vẫn là product detail.

---

# 36. Phase 3 — Source Comparison

```text
┌─────────────────────────────────────────────┐
│ Sony WH-1000XM6                             │
│                                             │
│ Best price                                  │
│ 6.190.000đ                                  │
│                                             │
│ Shopee       6.290.000đ                     │
│ Lazada       6.390.000đ                     │
│ TikTok       6.190.000đ                     │
│                                             │
│ [ Xem deal ]                                │
└─────────────────────────────────────────────┘
```

Có thể thêm:

```text
Shipping
Seller
Stock
Effective price
```

---

# 37. Phase 4 — Deal Intelligence UX

Đây là lúc UI bắt đầu có "wow factor".

## Deal explanation

```text
[Hot Deal] Strong price signal

6.190.000đ

↓ 13.4% vs 90-day median
↓ 2.1% vs lowest observed price
↓ 8.4% vs other marketplaces
```

Thay vì chỉ:

```text
Deal Score: 92
```

---

# 38. Phase 4 — Price Context

Product Detail có thể thêm:

```text
PRICE CONTEXT

Current        6.190m
90D median     7.140m
90D low        6.150m
90D high       8.290m

Current rank
██████████████████░░
```

Mục tiêu là giúp user tự quyết định.

---

# 39. Phase 4 — Fake Discount Visualization

Ví dụ:

```text
Seller says:

9.990.000đ
↓
6.990.000đ

But historical price:

7.090.000đ
```

UI:

```text
"Listed discount" ≠ "Historical discount"
```

Hiển thị factual evidence.

---

# 40. Phase 5 — Deal Feed

Lúc này Home không còn chỉ là Paste URL.

Home trở thành:

```text
DEAL HUNTER

What are you hunting for?

[ Search product / category ]

──────────────────────────────

[Deals] Deals worth watching

Sony XM6
6.19m
↓ 13%

SSD 2TB
2.79m
↓ 17%

Mechanical Keyboard
1.59m
↓ 11%
```

Personalized feed dựa trên:

- tracked products
- categories
- keywords
- price ranges
- historical signals

Không cần LLM.

---

# 41. Phase 5 — Hunt Mode

Một UX riêng:

```text
What are you hunting?

[ RTX 5070 ]

Budget
[ 45.000.000đ ]

Platform
☑ Shopee
☑ Lazada
☑ TikTok

Notify me when
○ Below budget
○ New historical low
○ Strong deal signal

[ Start Hunt ]
```

System tự săn.

User không cần paste từng link.

---

# 42. Phase 6 — Advanced Consumer Experience

Có thể phát triển:

```text
Price timeline
Deal calendar
Wishlist
Collections
Price alerts
Cross-platform compare
Historical events
Buy/Wait signal
Personal deal feed
```

Một future Home:

```text
Good morning

3 products you're tracking changed price.

──────────────────

Sony XM6
↓ 8.2%

You are 1.5% above
the lowest observed price.

[ View ]

──────────────────

2 new deals match your hunt.
```

---

# 43. UI Roadmap Summary

```text
PHASE 1
Core Tracking
────────────────────────
Home
Add Product
Product Preview
Tracking List
Product Detail
Price Chart
Price History
Tracking Controls
Loading / Empty / Error
Responsive UI


PHASE 2
Alerts + Zalo
────────────────────────
Create Alert
Alert Status
Notification Center
Zalo Connection
Notification Feedback


PHASE 3
Cross-platform
────────────────────────
Price Comparison
Marketplace Sources
Cross-platform Product View
Best Observed Price


PHASE 4
Price Intelligence
────────────────────────
Deal Signals
Historical Context
Fake Discount Signals
Deal Explanation
Price Percentile


PHASE 5
Discovery / Auto Hunt
────────────────────────
Search
Deal Feed
Keyword Tracking
Category Tracking
Hunt Mode
Personalized Discovery


PHASE 6
Advanced Consumer Product
────────────────────────
Wishlist
Collections
Deal Calendar
Buy/Wait Signals
Advanced Preferences
Personalized Deal Experience
```

---

# 44. UI Technical Structure

Frontend có thể tổ chức:

```text
src/
├── app/
│   ├── page
│   ├── tracking/
│   ├── products/
│   └── settings/
│
├── features/
│   ├── tracking/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── products/
│   ├── pricing/
│   └── alerts/
│
├── components/
│   ├── ui/
│   ├── product/
│   ├── price/
│   └── feedback/
│
├── lib/
│   ├── api/
│   ├── formatting/
│   └── analytics/
│
└── styles/
```

Tư duy chính:

```text
features/
    ↓
business feature

components/
    ↓
reusable UI
```

Không tạo một `components/` khổng lồ chứa toàn bộ business logic.

---

# 45. Phase 1 UX Acceptance Criteria

Phase 1 UI được coi là hoàn thành khi:

## First-time user

```text
Open Home
 ↓
Understand product
 ↓
Paste link
 ↓
See product
 ↓
Start tracking
```

không cần tutorial.

## Returning user

```text
Open Tracking
 ↓
See products
 ↓
Immediately know:
- current price
- changed or not
- freshness
```

## Product detail

Trong 5 giây, user phải nhìn thấy:

```text
Product
Current price
Price change
Price chart
Last checked
```

## Failure

Nếu hệ thống không lấy được data:

```text
User biết chuyện gì xảy ra
User biết data cuối cùng là gì
User biết có thể làm gì tiếp
```

Không có dead-end.

---

# 46. Core UX Metric

Không chỉ đo page views.

Nên quan tâm:

```text
URL → Tracking Conversion
```

Ví dụ:

```text
Paste URL
   ↓
Product resolved
   ↓
Tracking created
```

Đây là funnel quan trọng nhất Phase 1.

Sau này:

```text
Tracking
   ↓
Alert created
   ↓
Alert triggered
   ↓
Product clicked
```

và cuối cùng:

```text
Deal discovered
   ↓
User opens marketplace
```

---

# 47. North Star UX

Deal Hunter không nên tối ưu:

> "User ở lại app lâu nhất."

Mà nên tối ưu:

> **User tìm thấy đúng giá trị nhanh nhất.**

Một trải nghiệm tốt là:

```text
Mở app
 ↓
Dán link
 ↓
Theo dõi
 ↓
Biết giá
 ↓
Nhận signal đúng lúc
 ↓
Ra quyết định
```

Đó là lý do UI phải **consumer-first, lightweight và data-driven**, thay vì biến sản phẩm thành một admin dashboard có rất nhiều bảng và trạng thái backend.
