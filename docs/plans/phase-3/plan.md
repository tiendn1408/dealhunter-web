# Deal Hunter Web — Phase 3: Ke Hoach Trien Khai
# [Cross-platform Price Comparison — So Sanh Gia Da Nen Tang]

> **Pham vi**: Ke hoach ky thuat Frontend cho **Phase 3: So Sanh Gia Da Nen Tang**.
> Giai doan nay bo sung kha nang xem va so sanh gia tu nhieu san TMDT tren cung
> mot san pham, lien ket them URL san moi, va hien thi Best Observed Price.
>
> **Phien ban**: 3.0
> **Nguon goc**:
> - Roadmap goc: `deal_hunter/docs/plans/phase-1-core-tracking.md` — phan Phase 3 (dong 1390-1400)
> - Master UI/UX spec: `docs/specs/master-ui-ux.md` — muc 35 va 36
> - BE Phase 3 API: `deal_hunter/docs/plans/phase-3-cross-platform.md`

---

## 1. Nguyen Tac Thiet Ke (KISS / YAGNI)

- **Khong tao trang moi**: Core van la trang chi tiet (`/tracking/[id]`).
- **Tai su dung toi da**: `PlatformBadge`, `formatVND`, `detectPlatform`, `safeFetch`, modal pattern tu Phase 2.
- **Chi them khi that su can**: Khong bo sung thu vien nao khac ngoai `@tanstack/react-query` va cac type moi cho API Phase 3.
- **Khong co emoji** trong bat ky file nao (.tsx, .ts, .md, .css).

---

## 2. Hien Trang He Thong (Gap Analysis)

### 2.1 Da Co San — Tai Su Dung Nguyen

| Thu gi da co | Vi tri | Tai su dung o Phase 3 |
|---|---|---|
| `PlatformBadge` | `components/ui/Badge.tsx` | Hien thi badge san Shopee, Lazada, TikTok trong bang so sanh |
| `detectPlatform(url)` | `lib/formatting.ts` | Nhan dien san TMDT khi nguoi dung dan URL vao Link Source Modal |
| `formatVND()` | `lib/formatting.ts` | Dinh dang gia trong bang so sanh |
| `formatRelativeTime()` | `lib/formatting.ts` | Hien thi "Cap nhat: 5 phut truoc" trong bang so sanh |
| `safeFetch` + `X-User-ID` | `lib/api.ts` | Goi ca 3 endpoint Phase 3 |
| Pattern modal | `app/tracking/[id]/page.tsx` (Target Modal) | Tai su dung y tuong modal, khong can thu vien rieng |
| Cau truc trang chi tiet | `app/tracking/[id]/page.tsx` | Nhet `SourceComparisonSection` vao sau Section 2 (Hero) |
| Cau truc the danh sach | `app/tracking/page.tsx` | Bo sung huy hieu da san nhe |

### 2.2 Con Thieu — Can Them Moi

| Hang muc | Ly do can them |
|---|---|
| `QueryClientProvider` wrapper | Cai dat TanStack Query cho toan ung dung |
| `lib/types.ts`: 6 interface moi | `SourcePrice`, `BestDealSummary`, `ComparisonResult`, `ProductGroupSummary`, `LinkSourcePayload`, `LinkSourceResponse` |
| `lib/api.ts`: Bo sung `ProductID` va `IsPrimary` vao `TrackedProduct` interface | **Critical**: Hien tai `TrackedProduct` KHONG CO truong nay. Can them truoc khi code page. |
| `lib/api.ts`: 3 ham goi API | `getProductComparison()`, `linkProductSource()`, `listProductGroups()` |
| `lib/hooks.ts` | Custom hooks: `useComparison()`, `useLinkSource()`, `useTrackings()` (boc TanStack Query) |
| `components/comparison/SourceComparisonSection.tsx` | Component chinh hien thi bang so sanh da san + Best Deal + nut them san |
| `components/comparison/LinkSourceModal.tsx` | Modal dan URL san moi, goi mutation va tu lam moi bang so sanh |
| Update `app/tracking/[id]/page.tsx` | Them `SourceComparisonSection`, chuyen `useQuery` thay cho `fetchData` |
| Update `app/tracking/page.tsx` | Huy hieu da san tren the danh sach (khong doi logic chinh) |

> **Luu y CRITICAL**: `@tanstack/react-query` CHUA DUOC CAI vao `package.json`. Buoc 1 trong lo trinh trien khai phai chay `npm install @tanstack/react-query` truoc khi lam bat cu dieu gi khac.

---

## 3. Hop Dong API Backend Phase 3 (API Contract)

Backend da co san tai router `/api/v1`. Frontend se goi truc tiep qua `safeFetch`.

### 3.1 Lay Bang So Sanh Gia Da San

```
GET /api/v1/tracked-products/{id}/comparison
Header: X-User-ID: <uuid>

Response 200:
{
  "product_id": "uuid",
  "product_title": "Sony WH-1000XM6",
  "comparison_available": true,         // true khi co >= 2 nguon
  "sources": [
    {
      "source_id": "uuid",
      "product_id": "uuid",
      "platform": "tiktok",
      "seller_name": "TikTok Shop Verified",
      "canonical_url": "https://tiktok.com/...",
      "listed_price": 7118500,
      "shipping_fee": 12000,
      "effective_price": 6202000,        // listed_price + shipping_fee sau giam gia
      "in_stock": true,
      "is_best_deal": true,              // dung cho source co effective_price thap nhat
      "captured_at": "2026-09-30T10:00:00Z"
    },
    ...
  ],
  "best_deal": {
    "platform": "tiktok",
    "effective_price": 6202000,
    "saving_vs_most_expensive": 103000, // chenh lech so voi san dat nhat
    "saving_percent": 1.63
  },
  "computed_at": "2026-09-30T10:01:00Z"
}
```

**Luu y quan trong**: Backend da xu ly phan giai ID thong minh.
Frontend chi can truyen `id` tu URL trang chi tiet (co the la `tracking_id` hoac `product_source_id`),
Backend tu dong tim ra `product_id` chinh xac qua `resolveCanonicalProductID`.

### 3.2 Lien Ket Them Nguon San Moi

```
POST /api/v1/products/{product_id}/link-source
Header: X-User-ID: <uuid>
Body: { "url": "https://shopee.vn/..." }

Response 201:
{
  "source_id": "uuid",
  "platform": "shopee",
  "message": "Lien ket thanh cong. Du lieu gia se duoc cap nhat ngay lap tuc."
}

Response 409: // Link da duoc lien ket
Response 400: // URL khong ho tro hoac loi dinh dang
```

**Luu y**: Endpoint nhan `product_id` (khong phai `tracking_id`). Frontend can lay
`tracking.ProductID` tu response `getTracking()` truoc khi goi endpoint nay.

### 3.3 Lay Danh Sach Nhom Da San

```
GET /api/v1/product-groups
Header: X-User-ID: <uuid>

Response 200:
{
  "groups": [
    {
      "product_id": "uuid",
      "product_title": "Sony WH-1000XM6",
      "best_price": 6202000,
      "best_platform": "tiktok",
      "source_count": 3
    }
  ]
}
```

Su dung cho tab "So sanh da san" tren trang danh sach (tuy chon, Phase 3 cu tac).

---

## 4. Cac Type Moi Trong `lib/types.ts`

Khop chinh xac ten truong JSON ma Backend tra ve (snake_case):

```typescript
export interface SourcePrice {
  source_id: string;
  product_id: string;
  platform: string;
  seller_name: string;
  canonical_url: string;
  listed_price: number;
  shipping_fee: number;
  effective_price: number;
  in_stock: boolean;
  is_best_deal: boolean;
  captured_at: string | null;
}

export interface BestDealSummary {
  platform: string;
  effective_price: number;
  saving_vs_most_expensive: number;
  saving_percent: number;
}

export interface ComparisonResult {
  product_id: string;
  product_title: string;
  comparison_available: boolean;
  sources: SourcePrice[];
  best_deal: BestDealSummary | null;
  computed_at: string;
}

export interface ProductGroupSummary {
  product_id: string;
  product_title: string;
  best_price: number | null;
  best_platform: string;
  source_count: number;
}

export interface LinkSourcePayload {
  url: string;
}

export interface LinkSourceResponse {
  source_id: string;
  platform: string;
  message: string;
}
```

---

### 5.0 Truoc Tien: Bo Sung Truong Vao `TrackedProduct` Interface

**Day la dieu kien tien quyet**. `TrackedProduct` trong `lib/api.ts` hien THIEU 2 truong:
- `ProductID` — FE can de goi `linkProductSource(productId, url)`
- `IsPrimary` — FE can de hien huy hieu "Da san" tren the danh sach

Backend (`EnrichedTracking`) da tra ve 2 truong nay. FE chi can khai bao type:

```typescript
// Them vao cuoi interface TrackedProduct trong lib/api.ts (sau dong LastInStock)
ProductID?: string;   // UUID san pham chinh (canonical product) — co the undefined neu BE chua tra
IsPrimary?: boolean;  // True neu day la nguon duoc tao dau tien khi TrackURL
```

**Khong xoa cac truong cu**. Chi append 2 dong moi vao cuoi interface.

### 5.1 3 Ham Goi API Phase 3

Truoc tien, cap nhat dong import tai dong 267 cua `lib/api.ts` de nap cac type moi tu `./types`:

```typescript
import {
  AlertRule,
  CreateAlertPayload,
  PriceNotification,
  UserProfile,
  ConnectZaloPayload,
  ComparisonResult,
  LinkSourceResponse,
  ProductGroupSummary,
} from "./types";
```

Sau do, append 3 ham moi vao cuoi file `lib/api.ts`:

```typescript
// Lay bang so sanh gia da san
// id: co the la tracking_id hoac product_source_id —
// Backend tu dong phan giai
export async function getProductComparison(id: string): Promise<ComparisonResult> {
  const res = await safeFetch(
    `${API_BASE_URL}/tracked-products/${id}/comparison`,
    { headers: { "X-User-ID": getUserId() } }
  );
  if (!res.ok) throw new Error("Khong the tai du lieu so sanh gia");
  return res.json();
}

// Lien ket them URL san moi vao nhom san pham
// productId: lay tu tracking.ProductID (khong phai tracking ID)
export async function linkProductSource(
  productId: string,
  url: string
): Promise<LinkSourceResponse> {
  const res = await safeFetch(
    `${API_BASE_URL}/products/${productId}/link-source`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-ID": getUserId() },
      body: JSON.stringify({ url }),
    }
  );
  if (res.status === 409) throw new Error("URL nay da duoc lien ket voi san pham roi");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Khong the lien ket san");
  }
  return res.json();
}

// Lay danh sach cac nhom san pham co tu 2 san tro len
export async function listProductGroups(): Promise<ProductGroupSummary[]> {
  const res = await safeFetch(`${API_BASE_URL}/product-groups`, {
    headers: { "X-User-ID": getUserId() },
  });
  if (!res.ok) throw new Error("Khong the tai danh sach nhom san pham");
  const data = await res.json();
  return data.groups || [];
}
```

---

## 6. Custom Hooks Voi TanStack Query (`lib/hooks.ts`)

File moi, giu logic goi API va cache tap trung. Cac page chi viet `useComparison(id)`.

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTrackings,
  getTracking,
  getPriceHistory,
  listAlerts,
  getProductComparison,
  linkProductSource,
} from "./api";

// ---- Phase 1 & 2: Chuyen hien tai dung useState/useEffect sang query hooks ----

export function useTrackings() {
  return useQuery({
    queryKey: ["trackings"],
    queryFn: listTrackings,
    staleTime: 30_000,      // 30 giay
  });
}

export function useTracking(id: string) {
  return useQuery({
    queryKey: ["tracking", id],
    queryFn: () => getTracking(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function usePriceHistory(id: string) {
  return useQuery({
    queryKey: ["prices", id],
    queryFn: () => getPriceHistory(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useAlerts(id: string) {
  return useQuery({
    queryKey: ["alerts", id],
    queryFn: () => listAlerts(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ---- Phase 3: Comparison hooks ----

export function useComparison(id: string) {
  return useQuery({
    queryKey: ["comparison", id],
    queryFn: () => getProductComparison(id),
    enabled: !!id,
    staleTime: 300_000,     // 5 phut — khop voi Redis TTL phia Backend
    refetchOnWindowFocus: true,
  });
}

export function useLinkSource(trackingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, url }: { productId: string; url: string }) =>
      linkProductSource(productId, url),
    onSuccess: () => {
      // Xoa cache comparison: tu dong refetch bang so sanh
      qc.invalidateQueries({ queryKey: ["comparison", trackingId] });
      // Xoa cache trackings: cap nhat the danh sach
      qc.invalidateQueries({ queryKey: ["trackings"] });
    },
  });
}
```

---

## 7. Cac Component Moi (Phase 3)

### 7.1 `components/comparison/SourceComparisonSection.tsx`

Component chinh cho trang chi tiet. Dat sau Section "Canh bao gia thong minh" (Section 2.5).

**Hien thi khi `comparison_available = true` (>= 2 nguon)**:
```text
+--------------------------------------------------+
| So Sanh Gia Da San          [ + Them san khac ]  |
|                                                  |
| [Nen xanh emerald - Best Deal]                   |
| [TikTok] TikTok Shop Verified                    |
| Gia hang: 6.190.000 d  Ship: 12.000 d            |
| Tiet kiem 103.000d (1.6%) so voi san dat nhat    |
| Thuc tra: 6.202.000 d         [ Den noi ban ]    |
|                                                  |
| [Shopee] Shopee Mall Official                    |
| Gia hang: 6.290.000 d  Ship: 15.000 d            |
| Thuc tra: 6.305.000 d         [ Den noi ban ]    |
|                                                  |
| [Lazada] Lazada Flagship Store                   |
| Gia hang: 6.390.000 d  Ship: 20.000 d            |
| Thuc tra: 6.410.000 d         [ Den noi ban ]    |
+--------------------------------------------------+
```

**Hien thi khi `comparison_available = false` (1 nguon)**:
```text
+--------------------------------------------------+
| So Sanh Gia Da San                               |
| San pham nay chi dang theo doi tren [Shopee].    |
| Ban co muon so sanh them voi Lazada hoac         |
| TikTok Shop khong?                               |
|          [ Lien ket them san ]                   |
+--------------------------------------------------+
```

**Props**:
```typescript
interface Props {
  trackingId: string;       // id tren URL — truyen thang vao useComparison()
  productId: string;        // tracking.ProductID — truyen vao linkProductSource()
  onLinkSource: () => void; // Mo LinkSourceModal
}
```

**Logic**:
- Goi `useComparison(trackingId)`.
- Sort sources: `is_best_deal = true` len dau.
- Moi dong source tai su dung `PlatformBadge` (da co san).
- Xu ly nguon moi lien ket chua co gia: Neu `source.effective_price <= 0` hoac `!source.captured_at`, hien thi cot gia la "Dang kiem tra..." va cot trang thai la "Dang quet" thay vi "0 d" hay "Het hang".
- Moi dong source co nut "Den noi ban" mo `canonical_url` vao tab moi.
- Hien thi `formatRelativeTime(computed_at)` o chan section: "Cap nhat 3 phut truoc".
- Skeleton: 3 dong shimmer (tai su dung `LoadingSkeleton` pattern da co).

### 7.2 `components/comparison/LinkSourceModal.tsx`

Modal don gian. Tai su dung y tuong modal tu Target Price Modal trong `app/tracking/[id]/page.tsx`.

```text
+------------------------------------------+
| [ X ]                                    |
| Lien Ket Them San                        |
| Dan duong dan san pham tu san TMDT khac  |
|                                          |
| [ https://shopee.vn/...         ] [x]    |
| => Nhan dien: [Shopee] (badge hien ngay) |
|                                          |
| [ Lien Ket ]  (loading spinner khi goi) |
|                                          |
| Luu y: Sau khi lien ket, he thong se    |
| tu dong cap nhat bang so sanh.           |
+------------------------------------------+
```

**Props**:
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  trackingId: string;
}
```

**Logic**:
- Input url: onChange => goi `detectPlatform(url)` => hien badge san ngay lap tuc.
- Submit: goi mutation `useLinkSource(trackingId)`.
- Nut bam lien ket: hien spinner / text "Dang lien ket..." dua tren `mutation.isPending` (TanStack Query v5, khong dung `mutation.isLoading`).
- `onSuccess`: dong modal, thong bao thanh cong, bang so sanh tu dong refetch nho `invalidateQueries`.
- `onError` 409: hien inline error "San nay da co trong danh sach so sanh".
- `onError` unsupported platform: Neu server bao loi `unsupported platform`, hien "Duong dan khong thuoc cac san duoc ho tro (Shopee, Lazada, TikTok Shop)".
- `onError` khac: hien inline error message tu server.
- Khong dung `alert()`. Dung inline error state.

---

## 8. Tich Hop Vao Cac Trang Hien Co

### 8.1 `components/QueryProvider.tsx` & `app/layout.tsx`

Tao moi file `components/QueryProvider.tsx` (Client Component):

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Boc `QueryProvider` trong `app/layout.tsx`:

```tsx
import "./globals.css";
import Navbar from "@/components/Navbar";
import { QueryProvider } from "@/components/QueryProvider";

export const metadata = {
  title: "Deal Hunter — San dung gia truoc khi mua",
  description:
    "Theo doi gia san pham ban quan tam va nhan thong bao khi co gia tot tu Shopee, Lazada, TikTok Shop.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#F8FAF9] text-slate-900 antialiased">
        <QueryProvider>
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 8.2 `app/tracking/[id]/page.tsx` — Tich Hop So Sanh

**Nhung gi giu nguyen**:
- Toan bo JSX hien tai (Header, Hero Section, Canh bao gia, Recharts AreaChart, Target Modal).
- Logic `handleToggle`, `handleShare`, `handleSaveTarget`, `handleQuickPercent`.
- Cac `useState` goc (`showTargetModal`, `savedTarget`, `targetInput`, `copyNotice`).

**Nhung gi thay doi**:
1. Thay the `fetchData` va `useState(tracking, snapshots, loading, error)` bang TanStack Query hooks tu `lib/hooks.ts`.
   Duy tri `alerts` state dong bo tu `alertsData` de giu nguyen `setAlerts` cho cac callback Phase 2 (`CreateAlertModal`, `ActiveAlertCard`, `handleSaveTarget`):

```typescript
  // 1. Cap nhat import o dau file app/tracking/[id]/page.tsx:
  import { useTracking, usePriceHistory, useAlerts } from "@/lib/hooks";
  import { SourceComparisonSection } from "@/components/comparison/SourceComparisonSection";
  import { LinkSourceModal } from "@/components/comparison/LinkSourceModal";

  // 2. Hooks tu lib/hooks.ts thay the fetchData va useState cu
  const { data: tracking, isLoading: trackingLoading, error: trackingError } = useTracking(idOrSourceId);
  const { data: snapshots = [], isLoading: priceLoading, error: priceError } = usePriceHistory(idOrSourceId);
  const { data: alertsData = [], refetch: refetchAlerts } = useAlerts(idOrSourceId);

  // alerts state duoc duy tri de cac modal/card Phase 2 tuong thich 100%
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const loading = trackingLoading || priceLoading;
  const error = trackingError
    ? (trackingError as Error).message
    : priceError
    ? (priceError as Error).message
    : null;

  // Dong bo alerts tu cache va tu dong nap savedTarget tu quy tac target_price co san (hoac localStorage fallback)
  useEffect(() => {
    if (alertsData.length > 0) {
      setAlerts(alertsData);
      const targetRule = alertsData.find((r) => r.rule_type === "target_price" && r.active);
      if (targetRule) {
        setSavedTarget(targetRule.threshold_value);
        setTargetInput(targetRule.threshold_value);
        return;
      }
    }
    try {
      const raw = localStorage.getItem("dealhunter_targets");
      if (raw) {
        const store = JSON.parse(raw);
        if (store[idOrSourceId] && !savedTarget) {
          setSavedTarget(store[idOrSourceId]);
          setTargetInput(store[idOrSourceId]);
        }
      }
    } catch {}
  }, [alertsData, idOrSourceId, savedTarget]);
```

2. Dat `SourceComparisonSection` vao sau Section 2.5 (Canh bao gia) va truoc Section 3 (Lich su gia):

```tsx
      {/* 2.6 SECTION SO SANH GIA DA SAN (Phase 3) */}
      <SourceComparisonSection
        trackingId={idOrSourceId}
        productId={tracking?.ProductID || idOrSourceId}
        onLinkSource={() => setShowLinkModal(true)}
      />
```

3. Dat `LinkSourceModal` vao cuoi component (cung cap voi `CreateAlertModal`):

```tsx
      {/* LINK SOURCE MODAL (Phase 3) */}
      <LinkSourceModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        productId={tracking?.ProductID || idOrSourceId}
        trackingId={idOrSourceId}
      />
```

### 8.3 `app/tracking/page.tsx` — Huy Hieu Da San Tren The

Trong JSX the san pham (`filteredTrackings.map((t) => ...)`):
Kiem tra san pham thuoc nhom da san (co tu 2 card cung `ProductID` tro len, hoac la nguon phu `!t.IsPrimary`):

```tsx
{/* Row 1 header cua card: them flex wrapper de PlatformBadge va huy hieu Da san nam canh nhau */}
<div className="flex items-center justify-between gap-2 mb-1">
  <div className="flex items-center gap-1.5 flex-wrap">
    <PlatformBadge platformOrUrl={t.Platform || t.CanonicalURL} />
    {Boolean(
      (t.ProductID && trackings.filter((item) => item.ProductID === t.ProductID).length > 1) ||
      !t.IsPrimary
    ) && (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        Da san
      </span>
    )}
  </div>
  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pine-50 text-pine-900 border border-pine-100">
    {t.Active ? "Dang theo doi" : "Tam dung"}
  </span>
</div>
```

---

## 9. Thu Vien Can Cai Dat

Chi can cai dat **dung 1 package**:

```bash
npm install @tanstack/react-query
```

| Thu vien | Version | Ly do |
|---|---|---|
| `@tanstack/react-query` | `^5.x` | Cache, refetch, mutation, invalidation cho toan ung dung |

**Khong cai them**:
- Khong `axios` — `safeFetch` da du va on dinh.
- Khong `react-hot-toast` / `sonner` — Xu ly loi bang inline error state, tuong tu modal Pattern da co.
- Khong `react-query-devtools` — Chi can trong development, co the bo qua de giam build size.

---

## 10. Cau Truc Thu Muc Sau Phase 3

```text
deal-hunter-web/
├── app/
│   ├── layout.tsx                     -- Them QueryProvider boc ngoai
│   ├── page.tsx                       -- Khong doi
│   ├── tracking/
│   │   ├── page.tsx                   -- Bo sung huy hieu "Da san" nho
│   │   └── [id]/
│   │       └── page.tsx               -- Them SourceComparisonSection + LinkSourceModal
│   ├── notifications/page.tsx         -- Khong doi
│   └── settings/page.tsx             -- Khong doi
│
├── components/
│   ├── QueryProvider.tsx              -- Moi: Client Component wrap QueryClientProvider
│   ├── Navbar.tsx                     -- Khong doi
│   ├── alerts/                        -- Khong doi
│   ├── settings/                      -- Khong doi
│   ├── ui/                            -- Khong doi
│   └── comparison/                    -- Moi: 2 component Phase 3
│       ├── SourceComparisonSection.tsx
│       └── LinkSourceModal.tsx
│
└── lib/
    ├── api.ts                         -- Bo sung 3 ham goi API Phase 3
    ├── types.ts                       -- Bo sung 6 interface Phase 3
    ├── hooks.ts                       -- Moi: Custom hooks boc TanStack Query
    └── formatting.ts                  -- Khong doi
```

---

## 11. Thu Tu Trien Khai (Theo Buoc)

| Buoc | Hang muc | File thay doi | Nguyen tac |
|:---:|---|---|---|
| 1 | Cai dat `@tanstack/react-query`, tao `QueryProvider` | `package.json`, `components/QueryProvider.tsx`, `app/layout.tsx` | Nen tang, khong co boc nay moi thu khac khong chay |
| 2 | Bo sung `ProductID?` va `IsPrimary?` vao `TrackedProduct` | `lib/api.ts` (sua interface, khong them ham) | **Dieu kien tien quyet** — trang chi tiet can ProductID de goi linkSource |
| 3 | Bo sung 6 types Phase 3 | `lib/types.ts` | Them vao cuoi, khong xoa gi |
| 4 | Bo sung 3 ham goi API Phase 3 | `lib/api.ts` | Them vao cuoi, khong doi ham cu |
| 5 | Tao `lib/hooks.ts` | `lib/hooks.ts` (moi) | Boc ca Phase 1, 2, 3 query logic |
| 6 | Tao `SourceComparisonSection` | `components/comparison/SourceComparisonSection.tsx` (moi) | Component doc lap, test duoc doc lap |
| 7 | Tao `LinkSourceModal` | `components/comparison/LinkSourceModal.tsx` (moi) | Tai su dung modal pattern tu Target Price |
| 8 | Tich hop vao trang chi tiet | `app/tracking/[id]/page.tsx` | Chuyen sang hooks, nhet 2 component moi |
| 9 | Them huy hieu da san | `app/tracking/page.tsx` | Chi them 4 dong JSX, khong doi gi khac |
| 10 | Kiem dinh | Build + Emoji audit | `npm run build` + Python scan script |

---

## 12. Checklist Nghiem Thu Phase 3

### 12.1 Tinh Nang So Sanh Gia
- [ ] Trang chi tiet hien thi Section "So Sanh Gia Da San" cho moi san pham
- [ ] Khi chi co 1 nguon: Hien thi khuyen khich lien ket them san
- [ ] Khi co >= 2 nguon: Hien thi bang day du (san, ten shop, gia hang, phi ship, thuc tra)
- [ ] Nguon co `is_best_deal = true` duoc hien thi noi bat (nen xanh Emerald)
- [ ] Tiet kiem (so tien va %) hien dung
- [ ] Nut "Den noi ban" mo `canonical_url` sang tab moi
- [ ] "Cap nhat X phut truoc" hien thi dung dua tren `computed_at`
- [ ] Loading skeleton hien dung trong khi doi du lieu
- [ ] Khi Backend chua bat: Hien inline error, khong crash trang

### 12.2 Lien Ket San Moi
- [ ] Mo LinkSourceModal khi bam "Them san khac" hoac "Lien ket them san"
- [ ] Dan URL vao: Badge san hien ngay lap tuc (detectPlatform)
- [ ] Shopee, Lazada, TikTok, Mock deu duoc nhan dien dung
- [ ] Submit thanh cong: Bang so sanh tu dong cap nhat (khong reload trang)
- [ ] Loi 409 (da lien ket): Hien "San nay da co trong danh sach so sanh"
- [ ] Loi khac: Hien thong bao loi ro rang, khong dung `alert()`

### 12.3 Danh Sach Theo Doi
- [ ] The san pham da co >= 2 nguon hien huy hieu "Da san"
- [ ] The cac san pham 1 nguon khong bi anh huong

### 12.4 Tieu Chuan Ky Thuat
- [ ] `@tanstack/react-query` co trong `package.json` dependencies (khong phai devDependencies)
- [ ] `TrackedProduct` interface co them `ProductID?` va `IsPrimary?` (TypeScript khong bao loi)
- [ ] `npm run build`: 8/8 routes bien dich thanh cong, 0 TypeScript error
- [ ] `go build ./cmd/...`: Backend van bien dich tot (khong bi anh huong)
- [ ] Python emoji scan: 0 emoji tren toan bo file .tsx, .ts, .md
- [ ] Khong co `alert()` moi nao trong code Phase 3
- [ ] Khong co `cache: "no-store"` trong `safeFetch()` calls (khong tuong thich)

---

## 13. Rang Buoc & Quyet Dinh Kien Truc

| Quyet dinh | Ly do |
|---|---|
| Endpoint `tracked-products/{id}/comparison` thay vi `products/{id}/comparison` | BE da ho tro phan giai ca tracking_id lan product_source_id. FE chi can truyen id co san tren URL. |
| `linkProductSource` nhan `productId` (UUID san pham) | Endpoint `POST /products/{id}/link-source` yeu cau product_id. FE lay tu `tracking.ProductID` (da co trong `EnrichedTracking`). |
| `IsPrimary` huy hieu tren the danh sach | `EnrichedTracking.IsPrimary` da co san tu Phase 3 BE. Khong can goi them API. |
| Khong them Multi-line chart | Thuoc Phase 4 (Price Intelligence). Phase 3 chi can bang so sanh gia hien tai. |
| Khong tao trang `/product-groups` rieng | Master UI/UX spec: "Core van la product detail". Endpoint `listProductGroups` du phong cho tuong lai. |
