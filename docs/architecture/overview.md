# Deal Hunter Web — Kiến Trúc Frontend

## Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Chart | Recharts |
| Icons | Lucide React |
| State | React `useState` + `useEffect` (Phase 1 — no external state lib) |

---

## Folder Structure

```
deal-hunter-web/
├── app/                        # Next.js App Router — pages
│   ├── layout.tsx              # Root layout (AppShell, Navbar)
│   ├── page.tsx                # Home — Add Product
│   ├── tracking/
│   │   ├── page.tsx            # Tracking List
│   │   └── [id]/page.tsx       # Product Detail
│   └── settings/
│       └── page.tsx            # Settings (Phase 1: stub)
│
├── components/                 # Reusable UI components
│   ├── Navbar.tsx              # Header / BottomNav
│   └── ui/                    # (Phase 1: inline styles dùng Tailwind trực tiếp)
│
├── lib/
│   ├── api.ts                  # API client — gọi BE endpoints
│   └── formatting.ts           # (Phase 1: format tiền VND, thời gian)
│
└── docs/
    ├── README.md               # Muc luc tong quan
    ├── architecture/           # Kien truc he thong (file nay)
    ├── specs/                  # Dac ta UI/UX goc, cai tien va mockups
    └── plans/                  # Ke hoach va bao cao kiem dinh tung Phase
        ├── phase-1/            # Phase 1: Core Tracking UI [100% Hoan thanh]
        └── phase-2/            # Phase 2: Alert Engine & Zalo Notification
```

---

## Data Flow (Phase 1)

```
User action
    ↓
Page component (app/)
    ↓
lib/api.ts  (fetch → BE /api/v1/...)
    ↓
useState → re-render
```

Không dùng Redux, Zustand, hay React Query ở Phase 1. Server state quản lý thủ công qua `useEffect` + `useState`.

---

## API Mapping (FE ↔ BE Phase 1)

| FE action | BE endpoint | File |
|-----------|-------------|------|
| Track product | `POST /api/v1/tracked-products` | `lib/api.ts:trackProduct()` |
| List trackings | `GET /api/v1/tracked-products` | `lib/api.ts:listTrackings()` |
| Get tracking detail | `GET /api/v1/tracked-products/:id` | `lib/api.ts:getTracking()` |
| Price history | `GET /api/v1/tracked-products/:id/prices` | `lib/api.ts:getPriceHistory()` |
| Pause tracking | `POST /api/v1/tracked-products/:id/pause` | `lib/api.ts:pauseTracking()` |
| Resume tracking | `POST /api/v1/tracked-products/:id/resume` | `lib/api.ts:resumeTracking()` |

---

## Navigation (Information Architecture)

```
/           Home (Add Product)
/tracking   Tracking List
/tracking/:id  Product Detail
/settings   Settings (stub Phase 1)
```

Mobile: Bottom nav (Home | Tracking | Settings)  
Desktop: Header nav
