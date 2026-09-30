# Deal Hunter Web — Kien Truc Frontend (Phase 1, 2 & 3)

Tai lieu nay dac ta kien truc tong the, mo hinh quan ly state, luong du lieu va kien truc thu muc cua ung dung Frontend **Deal Hunter Web**.

---

## 1. Cong Nghe Su Dung (Technology Stack)

| Thanh phan | Cong nghe / Thu vien | Phien ban | Vai tro |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `14.2.24` | React Server & Client Components, Routing, SSR |
| **Server State & Cache** | TanStack Query | `v5.66.0` | Quan ly cache server, tu dong refetch, deduplication, cache invalidation |
| **Language** | TypeScript | `^5.0` | An toan kieu du lieu toan dien tu DTO den UI components |
| **Styling** | Tailwind CSS | `^3.4.1` | Design system Utility-first (Pine, Emerald, Rose themes) |
| **Bieu do (Charts)** | Recharts | `^2.15.1` | AreaChart truc quan hoa lich su bien dong gia |
| **Icons** | Lucide React | `^0.475.0` | Vector icon chuyen nghiep, dam bao tieu chuan No Emoji tuyet doi |

---

## 2. Cau Truc Thu Muc (Directory Structure)

```text
deal-hunter-web/
├── app/                        # Next.js App Router (Pages & Layouts)
│   ├── layout.tsx              # Root Layout: QueryProvider, Navbar, Mobile Bottom Nav, SEO metadata
│   ├── page.tsx                # Trang chu: Dan link, nhan dien san, khoi tao theo doi
│   ├── tracking/
│   │   ├── page.tsx            # Danh sach theo doi: bo loc, sparkline, huy hieu "Da san"
│   │   └── [id]/page.tsx       # Chi tiet san pham, bieu do lich su, canh bao & so sanh da san
│   ├── notifications/
│   │   └── page.tsx            # Feed thong bao bien dong gia, loc theo kenh, danh dau da doc
│   └── settings/
│       └── page.tsx            # Quan ly user ID, chu ky quet, lien ket Zalo OA
│
├── components/                 # Reusable UI & Business components
│   ├── QueryProvider.tsx       # TanStack Query Client Provider (SSR safe)
│   ├── Navbar.tsx              # Desktop header & Mobile bottom navigation
│   ├── alerts/                 # Modal tao canh bao & the canh bao hoat dong
│   │   ├── CreateAlertModal.tsx
│   │   └── ActiveAlertCard.tsx
│   ├── comparison/             # Component so sanh gia da san (Phase 3)
│   │   ├── SourceComparisonSection.tsx # Bang so sanh, Best Deal banner, sorted sources
│   │   └── LinkSourceModal.tsx         # Modal dan link san moi, live platform badge
│   ├── settings/               # Modal lien ket Zalo
│   │   └── ZaloConnectModal.tsx
│   └── ui/                     # UI components dung chung
│       ├── Badge.tsx           # PlatformBadge (Shopee, Lazada, TikTok), StatusBadge
│       ├── PriceChangePill.tsx # Huy hieu % bien dong gia
│       ├── Sparkline.tsx       # Mini SVG sparkline 30 ngay
│       ├── LoadingSkeleton.tsx # Shimmer skeletons cho list va detail
│       └── EmptyState.tsx      # Man hinh trang thai rong
│
├── lib/                        # Core client logic, data fetching & formatting
│   ├── api.ts                  # SafeFetch HTTP client ket noi Backend Go
│   ├── hooks.ts                # 14 custom hooks & mutations TanStack Query v5
│   ├── types.ts                # TypeScript DTO interfaces cho Phase 1, 2, 3
│   └── formatting.ts           # Format tien VND, thoi gian tuong doi, thong ke gia
│
└── docs/                       # Thu vien tai lieu ky thuat
    ├── README.md               # Muc luc tong the
    ├── architecture/           # Kien truc frontend (file nay)
    ├── guides/                 # Cam nang cai dat & van hanh (Runbook)
    ├── specs/                  # Thiet ke UI/UX goc va ban cai tien
    └── plans/                  # Ke hoach & Bao cao kiem dinh (phase-1, phase-2, phase-3)
```

---

## 3. Mo Hinh Luong Du Lieu (Data Flow Architecture)

Tu Phase 3, toan bo logic fetch du lieu cu (`useEffect` + `useState`) da duoc chuyen doi triet de sang kien truc TanStack Query v5:

```mermaid
flowchart TD
    UserAction["Thao tac nguoi dung (Xem trang / Dan link / Click)"]
    
    subgraph ClientView ["Client Component (app/*)"]
        HookCall["Goi Custom Query/Mutation Hook (lib/hooks.ts)"]
        Render["Render UI tu TanStack Query State (data, isLoading, error)"]
    end
    
    subgraph QueryLayer ["TanStack Query v5 (QueryClient)"]
        CacheCheck{"Kiem tra cache trong QueryClient"}
        CacheHit["Tra ve cache ngay lap tuc (< 5ms)"]
        CacheMiss["Kich hoat queryFn"]
        Mutate["mutationFn thuc thi"]
        Invalidate["qc.invalidateQueries({ queryKey })"]
    end
    
    subgraph ApiClient ["lib/api.ts (safeFetch)"]
        HTTPReq["HTTP Request (X-User-ID, JSON)"]
    end
    
    subgraph BackendGo ["Backend Go API (/api/v1/*)"]
        RedisCacheCheck{"Redis Cache hit?"}
        DBQuery["Query PostgreSQL"]
    end

    UserAction --> HookCall
    HookCall --> CacheCheck
    CacheCheck -->|Cache con han staleTime| CacheHit
    CacheCheck -->|Cache het han / chua co| CacheMiss
    CacheHit --> Render
    CacheMiss --> HTTPReq
    HTTPReq --> RedisCacheCheck
    RedisCacheCheck --> DBQuery
    DBQuery --> HTTPReq
    HTTPReq --> Render

    UserAction -->|Mutation (Link san, Doi trang thai, Canh bao)| Mutate
    Mutate --> HTTPReq
    Mutate --> Invalidate
    Invalidate -->|Refetch ngam| CacheMiss
```

### Nguyen Tac Khoi Tao QueryClient (SSR Hydration Safety):
- `QueryClient` duoc khoi tao ben trong `useState` tai Client Component [`components/QueryProvider.tsx`](file:///Users/tien.dang/Workplace/reference/deal-hunter-web/components/QueryProvider.tsx).
- Dieu nay ngan chan tinh trang ro ri cache (cache leaking) giua cac request nguoi dung khac nhau trong co che Server-Side Rendering cua Next.js App Router.

---

## 4. Bang Anh Xa API Backend ↔ Frontend (Full API Mapping)

| Chuc nang | Method & Endpoint | Custom Hook / Ham API | Query Key |
|---|---|---|---|
| **Dan link theo doi** | `POST /api/v1/tracked-products` | `trackProduct(url)` | Invalidate `["trackings"]` |
| **Danh sach theo doi** | `GET /api/v1/tracked-products` | `useTrackings()`, `useEnrichedTrackings()` | `["trackings"]`, `["trackings", "enriched"]` |
| **Chi tiet san pham** | `GET /api/v1/tracked-products/{id}` | `useTracking(id)` | `["tracking", id]` |
| **Lich su snapshot gia** | `GET /api/v1/tracked-products/{id}/prices` | `usePriceHistory(id)` | `["prices", id]` |
| **Tam dung / Bat lai** | `POST /api/v1/tracked-products/{id}/pause` & `/resume` | `useToggleTracking()` | Invalidate `["trackings"]` |
| **Danh sach canh bao** | `GET /api/v1/tracked-products/{id}/alerts` | `useAlerts(id)` | `["alerts", id]` |
| **Tao quy tac canh bao** | `POST /api/v1/tracked-products/{id}/alerts` | `useCreateAlert(id)` | Invalidate `["alerts", id]` |
| **Xoa quy tac canh bao** | `DELETE /api/v1/alerts/{id}` | `useDeleteAlert(id)` | Invalidate `["alerts", id]` |
| **Feed thong bao** | `GET /api/v1/notifications` | `useNotifications(limit)` | `["notifications", limit]` |
| **So thong bao chua doc** | `GET /api/v1/notifications` (unread) | `useUnreadNotificationsCount()` | `["notifications", "unread-count"]` |
| **Danh dau da doc** | `POST /api/v1/notifications/{id}/read` | `useMarkNotificationAsRead()` | Invalidate `["notifications"]` |
| **Trang thai Zalo OA** | `GET /api/v1/user/zalo/status` | `useZaloProfile()` | `["zalo", "profile"]` |
| **Huy ket noi Zalo** | `DELETE /api/v1/user/zalo` | `useDisconnectZalo()` | Invalidate `["zalo", "profile"]` |
| **Bang so sanh da san** | `GET /api/v1/tracked-products/{id}/comparison` | `useComparison(id)` | `["comparison", id]` |
| **Lien ket them URL san** | `POST /api/v1/products/{id}/link-source` | `useLinkSource(trackingId)` | Invalidate `["comparison", id]`, `["trackings"]` |
| **Nhom san pham da san** | `GET /api/v1/product-groups` | `listProductGroups()` | `["product-groups"]` |

---

## 5. Cau Truc Dieu Huong & Man Hinh (Routing Architecture)

```text
/                      Trang chu (Hero, Form dan URL, Nhan dien san, Huong dan)
/tracking              Danh sach san pham theo doi (Loc tat ca/giam sau/cham muc tieu, Huy hieu Da san)
/tracking/[id]         Chi tiet san pham (Thong so, Bieu do AreaChart, Canh bao, So sanh da san)
/notifications         Feed thong bao bien dong gia (Loc Chua doc, Giam gia, Zalo OA)
/settings              Cai dat chu ky quet, Ma dinh danh, Ket noi Zalo OA
```
