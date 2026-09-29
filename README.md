# Deal Hunter Web — B2C Price Tracker Frontend

Giao diện web người dùng của hệ thống **Deal Hunter** — Theo dõi biến động giá sản phẩm xuyên sàn thương mại điện tử (Shopee, Lazada, TikTok Shop, v.v.).

---

## Tinh Nang Phase 1 (Core Price Tracking)

- **Dan Link & Tu Dong Nhan Dien**: Tu dong nhan biet san TMDT, lay thong tin va gia san pham ngay lap tuc.
- **Tien Trinh 3 Buoc Truc Quan**: Phan hoi tuc thi khi phan tich link va lap lich quet dinh ky.
- **Bieu Do Vung Lich Su Gia (AreaChart)**: Truc quan hoa bien dong gia thuc te (bao gom tien hang + phi ship) voi gradient muot ma va duong danh dau day gia lich su.
- **The San Pham & Mini Sparkline**: Xem ngay duong xu huong gia 30 ngay, huy hieu % giam gia (`↓ 8.7%`) ngay tren danh sach theo doi.
- **Luoi Thong Ke 4 Chi So**: Gia thap nhat (day), gia trung binh, gia cao nhat (dinh), va khoang cach so voi day.
- **Tam Dung / Tiep Tuc Quet**: Quan ly trang thai theo doi truc tiep tu danh sach hoac man hinh chi tiet voi Optimistic UI.
- **Mobile-First Responsive**: Tich hop **Bottom Navigation Bar** co dinh chuan ung dung di dong.

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Charts**: [Recharts 2](https://recharts.org/) (ResponsiveContainer, AreaChart, ReferenceLine)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Native `fetch` with typed API client & `localStorage` metadata caching

---

## Khoi Chay Nhanh (Local Development)

### 1. Cai dat thu vien:
```bash
npm install
```

### 2. Cau hinh moi truong:
Tao file `.env.local` neu backend chay o port khac `8080`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. Chay moi truong phat trien:
```bash
npm run dev
```
Truy cap ung dung tai: [http://localhost:3000](http://localhost:3000)

### 4. Kiem tra Build:
```bash
npm run build
```

---

## Cau Truc Thu Muc

```
deal-hunter-web/
├── app/                        # Next.js App Router (Pages)
│   ├── layout.tsx              # Root Layout (Navbar & Mobile Bottom Nav)
│   ├── page.tsx                # Trang chu: Dan link & Quet gia
│   ├── tracking/
│   │   ├── page.tsx            # Danh sach san pham dang theo doi
│   │   └── [id]/page.tsx       # Chi tiet san pham & Bieu do bien dong gia
│   └── settings/
│       └── page.tsx            # Cai dat chu ky quet & Roadmap Phase 2
│
├── components/
│   ├── Navbar.tsx              # Header desktop + Bottom navigation bar di dong
│   └── ui/                     # UI components tai su dung
│       ├── Badge.tsx           # Huy hieu san TMDT & Trang thai quet
│       ├── PriceChangePill.tsx # Huy hieu % bien dong gia (tang/giam)
│       ├── Sparkline.tsx       # Duong bieu dien xu huong gia mini (SVG)
│       ├── LoadingSkeleton.tsx # Shimmer loading animation
│       └── EmptyState.tsx      # Man hinh rong than thien B2C
│
├── lib/
│   ├── api.ts                  # API client ket noi Backend Go
│   └── formatting.ts           # Format tien VND, thoi gian tuong doi, thong ke gia
│
└── docs/                       # Tai lieu thiet ke & ke hoach
    ├── README.md               # Muc luc dieu huong tai lieu
    ├── ui-ux-plan.md           # Thiet ke UX/UI toan dien (goc BA/PM)
    ├── architecture/overview.md # Kien truc frontend & Data flow
    └── plans/phase-1-core-tracking.md # Ke hoach chi tiet Phase 1
```

---

## Lien Ket Backend

Dự án này kết nối với Go backend tại `deal_hunter`:
- `POST /api/v1/tracked-products`: Bắt đầu theo dõi URL
- `GET  /api/v1/tracked-products`: Lấy danh sách sản phẩm
- `GET  /api/v1/tracked-products/:id`: Xem chi tiết sản phẩm
- `GET  /api/v1/tracked-products/:id/prices`: Lịch sử các snapshot giá
- `POST /api/v1/tracked-products/:id/pause`: Tạm dừng quét
- `POST /api/v1/tracked-products/:id/resume`: Tiếp tục quét
