# Deal Hunter Web — B2C Price Tracker Frontend

Giao diện web người dùng của hệ thống **Deal Hunter** — Theo dõi biến động giá sản phẩm xuyên sàn thương mại điện tử (Shopee, Lazada, TikTok Shop, v.v.).

---

## 🎯 Tính Năng Phase 1 (Core Price Tracking)

- 🔍 **Dán Link & Tự Động Nhận Diện**: Tự động nhận biết sàn TMĐT, lấy thông tin và giá sản phẩm ngay lập tức.
- ⚡ **Tiến Trình 3 Bước Trực Quan**: Phản hồi tức thì khi phân tích link và lập lịch quét định kỳ.
- 📊 **Biểu Đồ Vùng Lịch Sử Giá (AreaChart)**: Trực quan hóa biến động giá thực tế (bao gồm tiền hàng + phí ship) với gradient mượt mà và đường đánh dấu đáy giá lịch sử.
- 📈 **Thẻ Sản Phẩm & Mini Sparkline**: Xem ngay đường xu hướng giá 30 ngày, huy hiệu % giảm giá (`↓ 8.7%`) ngay trên danh sách theo dõi.
- ⏱️ **Lưới Thống Kê 4 Chỉ Số**: Giá thấp nhất (đáy), giá trung bình, giá cao nhất (đỉnh), và khoảng cách so với đáy.
- ⏸️ **Tạm Dừng / Tiếp Tục Quét**: Quản lý trạng thái theo dõi trực tiếp từ danh sách hoặc màn hình chi tiết với Optimistic UI.
- 📱 **Mobile-First Responsive**: Tích hợp **Bottom Navigation Bar** cố định chuẩn ứng dụng di động.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Charts**: [Recharts 2](https://recharts.org/) (ResponsiveContainer, AreaChart, ReferenceLine)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Native `fetch` with typed API client & `localStorage` metadata caching

---

## 🚀 Khởi Chạy Nhanh (Local Development)

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Cấu hình môi trường:
Tạo file `.env.local` nếu backend chạy ở port khác `8080`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. Chạy môi trường phát triển:
```bash
npm run dev
```
Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000)

### 4. Kiểm tra Build:
```bash
npm run build
```

---

## 📂 Cấu Trúc Thư Mục

```
deal-hunter-web/
├── app/                        # Next.js App Router (Pages)
│   ├── layout.tsx              # Root Layout (Navbar & Mobile Bottom Nav)
│   ├── page.tsx                # Trang chủ: Dán link & Quét giá
│   ├── tracking/
│   │   ├── page.tsx            # Danh sách sản phẩm đang theo dõi
│   │   └── [id]/page.tsx       # Chi tiết sản phẩm & Biểu đồ biến động giá
│   └── settings/
│       └── page.tsx            # Cài đặt chu kỳ quét & Roadmap Phase 2
│
├── components/
│   ├── Navbar.tsx              # Header desktop + Bottom navigation bar di động
│   └── ui/                     # UI components tái sử dụng
│       ├── Badge.tsx           # Huy hiệu sàn TMĐT & Trạng thái quét
│       ├── PriceChangePill.tsx # Huy hiệu % biến động giá (tăng/giảm)
│       ├── Sparkline.tsx       # Đường biểu diễn xu hướng giá mini (SVG)
│       ├── LoadingSkeleton.tsx # Shimmer loading animation
│       └── EmptyState.tsx      # Màn hình rỗng thân thiện B2C
│
├── lib/
│   ├── api.ts                  # API client kết nối Backend Go
│   └── formatting.ts           # Format tiền VND, thời gian tương đối, thống kê giá
│
└── docs/                       # Tài liệu thiết kế & kế hoạch
    ├── README.md               # Mục lục điều hướng tài liệu
    ├── ui-ux-plan.md           # Thiết kế UX/UI toàn diện (gốc BA/PM)
    ├── architecture/overview.md # Kiến trúc frontend & Data flow
    └── plans/phase-1-core-tracking.md # Kế hoạch chi tiết Phase 1
```

---

## 🔗 Liên Kết Backend

Dự án này kết nối với Go backend tại `deal_hunter`:
- `POST /api/v1/tracked-products`: Bắt đầu theo dõi URL
- `GET  /api/v1/tracked-products`: Lấy danh sách sản phẩm
- `GET  /api/v1/tracked-products/:id`: Xem chi tiết sản phẩm
- `GET  /api/v1/tracked-products/:id/prices`: Lịch sử các snapshot giá
- `POST /api/v1/tracked-products/:id/pause`: Tạm dừng quét
- `POST /api/v1/tracked-products/:id/resume`: Tiếp tục quét
