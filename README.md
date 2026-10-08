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

## Tinh Nang Phase 2 (Alert Engine & Zalo Notification)

- **Quy Tac Canh Bao Thong Minh**: Form dat canh bao theo % giam, gia muc tieu, hoac day N ngay.
- **Tich Hop Zalo OA / ZNS**: Ket noi So dien thoai / Zalo ID de nhan tin nhan canh bao bien dong gia.
- **Trung Tam Thong Bao**: Feed thong bao dong, bo loc da che do, danh dau da doc.

---

## Tinh Nang Phase 3 (Cross-Platform Price Comparison)

- **So Sanh Gia Da San**: Bang so sanh gia thuc tra (da gom phi ship va giam gia) giua Shopee, Lazada, TikTok Shop.
- **Huy Hieu Gia Tot Nhat (Best Deal)**: Tu dong tinh toan so tien va phan tram tiet kiem duoc so voi san dat nhat.
- **Lien Ket Them San (Link Source Modal)**: Dan them duong link san pham tu san khac de mo rong nhom so sanh voi nhan dien san truc quan.
- **TanStack Query v5**: Quan ly cache, tu dong cap nhat du lieu khi focus hoac co mutation.

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components & Client Components)
- **Data Fetching & Cache**: [TanStack Query v5](https://tanstack.com/query) (`@tanstack/react-query`)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Charts**: [Recharts 2](https://recharts.org/) (ResponsiveContainer, AreaChart, ReferenceLine)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Native `fetch` with typed API client & `localStorage` metadata caching

---

## Khoi Chay Nhanh (Local Development)

> **Tai lieu huong dan toan dien**: Xem chi tiet cach khoi dong ca Backend Go (Postgres, Redis, Worker, Notifier) va Frontend tai [`docs/guides/installation-and-runbook.md`](./docs/guides/installation-and-runbook.md).

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

## Trien Khai Production & Docker (Deployment)

### 1. Chay Standalone truc tiep tren may chu Node.js:
Next.js da duoc cau hinh `output: "standalone"` de tao ra ban build doc lap nhe:
```bash
NEXT_PUBLIC_API_URL=https://dealhunter.vn/api/v1 npm run build
NODE_ENV=production PORT=3000 node .next/standalone/server.js
```

### 2. Dong goi Docker Image:
```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://dealhunter.vn/api/v1 -t dealhunter-web:latest .
docker run -d -p 3000:3000 --name dealhunter-web dealhunter-web:latest
```
Hoac khoi chay dong bo cung he thong Go backend qua `docker-compose.prod.yml` tai thu muc `dealhunter`.

---

## Cau Truc Thu Muc

```
dealhunter-web/
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
│   ├── QueryProvider.tsx       # TanStack Query Client Provider
│   ├── Navbar.tsx              # Header desktop + Bottom navigation bar di dong
│   ├── alerts/                 # Modal & the canh bao gia thong minh
│   ├── comparison/             # Component so sanh da san & modal lien ket (Phase 3)
│   │   ├── SourceComparisonSection.tsx
│   │   └── LinkSourceModal.tsx
│   ├── settings/               # Modal lien ket Zalo OA
│   └── ui/                     # UI components tai su dung
│       ├── Badge.tsx           # Huy hieu san TMDT & Trang thai quet
│       ├── PriceChangePill.tsx # Huy hieu % bien dong gia (tang/giam)
│       ├── Sparkline.tsx       # Duong bieu dien xu huong gia mini (SVG)
│       ├── LoadingSkeleton.tsx # Shimmer loading animation
│       └── EmptyState.tsx      # Man hinh rong than thien B2C
│
├── lib/
│   ├── api.ts                  # API client ket noi Backend Go
│   ├── hooks.ts                # Custom hooks TanStack Query (Phase 3)
│   ├── types.ts                # Typescript DTO interfaces
│   └── formatting.ts           # Format tien VND, thoi gian tuong doi, thong ke gia
│
└── docs/                       # Tai lieu thiet ke & ke hoach
    ├── README.md               # Muc luc dieu huong tai lieu
    ├── architecture/           # Kien truc frontend & Data flow
    ├── specs/                  # Thiet ke UI/UX goc, ban cai tien va mockups
    └── plans/                  # Ke hoach & Bao cao kiem dinh tung Phase
        ├── phase-1/            # Phase 1: Core Tracking UI [100% Hoan thanh]
        ├── phase-2/            # Phase 2: Alert Engine & Zalo Notification [100% Hoan thanh]
        └── phase-3/            # Phase 3: Cross-Platform Price Comparison [100% Hoan thanh]
```

---

## Lien Ket Backend

Du an nay ket noi truc tiep voi he thong Go backend tai `dealhunter`:

### Phase 1: Core Price Tracking
- `POST /api/v1/tracked-products`: Bat dau theo doi URL san pham
- `GET  /api/v1/tracked-products`: Lay danh sach san pham theo doi
- `GET  /api/v1/tracked-products/:id`: Xem chi tiet san pham
- `GET  /api/v1/tracked-products/:id/prices`: Lich su cac snapshot gia
- `POST /api/v1/tracked-products/:id/pause`: Tam dung quet gia
- `POST /api/v1/tracked-products/:id/resume`: Tiep tuc quet gia

### Phase 2: Alert Rules & Zalo Notification
- `GET  /api/v1/tracked-products/:id/alerts`: Lay danh sach quy tac canh bao cua san pham
- `POST /api/v1/tracked-products/:id/alerts`: Tao quy tac canh bao (% giam, gia muc tieu, day N ngay)
- `DELETE /api/v1/alerts/:id`: Xoa quy tac canh bao
- `GET  /api/v1/notifications`: Feed lich su thong bao bien dong gia
- `POST /api/v1/notifications/:id/read`: Danh dau thong bao da doc
- `POST /api/v1/user/zalo/connect`: Lien ket so dien thoai / Zalo ID nhan tin ZNS
- `GET  /api/v1/user/zalo/status`: Kiem tra trang thai ket noi Zalo
- `DELETE /api/v1/user/zalo`: Huy ket noi Zalo

### Phase 3: Cross-Platform Price Comparison
- `GET  /api/v1/tracked-products/:id/comparison`: Bang so sanh gia da san va Best Deal
- `GET  /api/v1/products/:product_id/comparison`: So sanh theo Product ID goc
- `POST /api/v1/products/:product_id/link-source`: Lien ket URL san moi vao nhom san pham
- `GET  /api/v1/product-groups`: Danh sach cac nhom san pham da san (>= 2 nguon)
