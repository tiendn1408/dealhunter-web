# Deal Hunter Web — He Thong Tai Lieu Ky Thuat (Documentation)

He thong tai lieu Frontend cho ung dung **Deal Hunter Web** (Next.js 14 · TypeScript · Tailwind CSS · TanStack Query · Recharts).

---

## 1. Cau Truc Thu Muc Tai Lieu (Directory Tree)

```text
docs/
├── README.md                          # Muc luc dieu huong tai lieu tong the
│
├── specs/                             # Dac ta san pham & Yeu cau thiet ke UI/UX
│   ├── master-ui-ux.md               # Thiet ke UI/UX toan dien goc tu BA/PM
│   ├── phase-1-ui-ux-improve.md      # Ban cai tien UI/UX chi tiet khop voi mockup
│   └── mockups/                      # File hinh anh thiet ke chuan
│       └── phase-1/
│           ├── mobile.png            # Mockup 10 man hinh chuan Mobile-First
│           ├── web-dashboard.png     # Mockup chuan Desktop Dashboard
│           └── logo_crop.png         # Anh trich xuat logo nguyen ban
│
├── architecture/                      # Kien truc ky thuat Frontend
│   └── overview.md                   # So do luong du lieu, component tree, TanStack Query cache
│
├── guides/                            # Huong dan cai dat & van hanh thuc te
│   └── installation-and-runbook.md   # Huong dan cai dat & chay du an fullstack chi tiet
│
└── plans/                             # Ke hoach trien khai & Bao cao kiem dinh theo Phase
    ├── phase-1/
    │   ├── plan.md                   # Ke hoach trien khai ky thuat Phase 1
    │   └── verification-report.md    # Bao cao kiem dinh 100% hoan thien Phase 1
    │
    ├── phase-2/
    │   ├── plan.md                   # Ke hoach chi tiet Phase 2 (Alert Engine + Zalo)
    │   └── verification-report.md    # Bao cao kiem dinh 100% hoan thien Phase 2
    │
    └── phase-3/
        ├── plan.md                   # Ke hoach chi tiet Phase 3 (Cross-platform Comparison)
        └── verification-report.md    # Bao cao kiem dinh 100% hoan thien Phase 3
```

---

## 2. Bang Tra Cuu Tai Lieu Nhanh (Navigation Hub)

| Thu muc | Tep tai lieu | Mo ta noi dung | Trang thai |
|---|---|---|:---:|
| **api/** | [**rest-api-reference.md**](file:///Users/tien.dang/Workplace/reference/dealhunter/docs/api/rest-api-reference.md) | **Dac ta toan dien 24+ REST API endpoints, auth token va curl test** | **SAN SANG** |
| **deployment/** | [**production-deployment-guide.md**](file:///Users/tien.dang/Workplace/reference/dealhunter/docs/deployment/production-deployment-guide.md) | **Cam nang trien khai Production toan dien (Docker Compose Prod, Systemd, Nginx SSL, Backup)** | **SAN SANG** |
| **guides/** | [`guides/installation-and-runbook.md`](./guides/installation-and-runbook.md) | **Huong dan cai dat & van hanh toan dien (Fullstack Runbook)** | **SAN SANG** |
| **specs/** | [`specs/master-ui-ux.md`](./specs/master-ui-ux.md) | Dac ta trai nghiem nguoi dung goc (toan bo 6 phase) | Tai lieu goc |
| **specs/** | [`specs/phase-1-ui-ux-improve.md`](./specs/phase-1-ui-ux-improve.md) | Quy chuan chi tiet mau sac, layout, 10 man hinh mockup | Chuan thiet ke |
| **architecture/** | [`architecture/overview.md`](./architecture/overview.md) | Kien truc thu muc, component tree, TanStack Query caching | Hoan thien |
| **plans/phase-1/** | [`plans/phase-1/plan.md`](./plans/phase-1/plan.md) | Ke hoach trien khai ban dau cua Phase 1 | Hoan thanh |
| **plans/phase-1/** | [`plans/phase-1/verification-report.md`](./plans/phase-1/verification-report.md) | Bao cao nghiem thu & kiem dinh chat luong 100% Phase 1 | [100% PASSED] |
| **plans/phase-2/** | [`plans/phase-2/plan.md`](./plans/phase-2/plan.md) | Ke hoach trien khai chi tiet Alert Engine & Zalo Notification | [HOAN THANH 100%] |
| **plans/phase-2/** | [`plans/phase-2/verification-report.md`](./plans/phase-2/verification-report.md) | Bao cao nghiem thu & kiem dinh chat luong 100% Phase 2 | [100% PASSED] |
| **plans/phase-3/** | [`plans/phase-3/plan.md`](./plans/phase-3/plan.md) | Ke hoach trien khai So Sanh Gia Da San (Shopee, Lazada, TikTok) | [HOAN THANH 100%] |
| **plans/phase-3/** | [`plans/phase-3/verification-report.md`](./plans/phase-3/verification-report.md) | Bao cao nghiem thu & kiem dinh chat luong 100% Phase 3 (E2E Full Flow) | [100% PASSED] |

---

## 3. Lo Trinh Phat Trien (Roadmap)

```text
Phase 1    Core Price Tracking          [HOAN THANH 100% - DA KIEM DINH]
Phase 2    Alert Engine + Zalo UX       [HOAN THANH 100% - DA KIEM DINH]
Phase 3    Cross-platform Comparison    [HOAN THANH 100% - DA KIEM DINH]
Phase 3.5  Monetization & Voucher Box   [HOAN THANH 100% - DA KIEM DINH]
Phase 4    Price Intelligence           [Du kien]
Phase 5    Discovery / Auto Hunt        [Du kien]
Phase 6    Advanced Consumer Product    [Du kien]
```
