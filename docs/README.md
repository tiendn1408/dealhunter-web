# Deal Hunter Web — Hệ Thống Tài Liệu Kỹ Thuật (Documentation)

Hệ thống tài liệu Frontend cho ứng dụng **Deal Hunter Web** (Next.js 14 · TypeScript · Tailwind CSS · Recharts).

---

## 1. Cấu Trúc Thư Mục Tài Liệu (Directory Tree)

```text
docs/
├── README.md                          # Mục lục điều hướng tài liệu tổng thể
│
├── specs/                             # Đặc tả sản phẩm & Yêu cầu thiết kế UI/UX
│   ├── master-ui-ux.md               # Thiết kế UI/UX toàn diện gốc từ BA/PM
│   ├── phase-1-ui-ux-improve.md      # Bản cải tiến UI/UX chi tiết khớp với mockup
│   └── mockups/                      # File hình ảnh thiết kế chuẩn
│       └── phase-1/
│           ├── mobile.png            # Mockup 10 màn hình chuẩn Mobile-First
│           ├── web-dashboard.png     # Mockup chuẩn Desktop Dashboard
│           └── logo_crop.png         # Ảnh trích xuất logo nguyên bản
│
├── architecture/                      # Kiến trúc kỹ thuật Frontend
│   └── overview.md                   # Sơ đồ luồng dữ liệu, component tree và routing
│
├── guides/                            # Hướng dẫn cài đặt & vận hành thực tế
│   └── installation-and-runbook.md   # Hướng dẫn cài đặt & chạy dự án fullstack chi tiết
│
└── plans/                             # Kế hoạch triển khai & Báo cáo kiểm định theo Phase
    ├── phase-1/
    │   ├── plan.md                   # Kế hoạch triển khai kỹ thuật Phase 1
    │   └── verification-report.md    # Báo cáo kiểm định 100% hoàn thiện Phase 1
    │
    └── phase-2/
        ├── plan.md                   # Kế hoạch chi tiết Phase 2 (Alert Engine + Zalo)
        └── verification-report.md    # Báo cáo kiểm định 100% hoàn thiện Phase 2
```

---

## 2. Bảng Tra Cứu Tài Liệu Nhanh (Navigation Hub)

| Thư mục | Tệp tài liệu | Mô tả nội dung | Trạng thái |
|---------|--------------|----------------|------------|
| **guides/** | [`guides/installation-and-runbook.md`](./guides/installation-and-runbook.md) | **Hướng dẫn cài đặt & vận hành toàn diện (Fullstack Runbook)** | **SẴN SÀNG** |
| **specs/** | [`specs/master-ui-ux.md`](./specs/master-ui-ux.md) | Đặc tả trải nghiệm người dùng gốc (toàn bộ 6 phase) | Tài liệu gốc |
| **specs/** | [`specs/phase-1-ui-ux-improve.md`](./specs/phase-1-ui-ux-improve.md) | Quy chuẩn chi tiết màu sắc, layout, 10 màn hình mockup | Chuẩn thiết kế |
| **architecture/** | [`architecture/overview.md`](./architecture/overview.md) | Kiến trúc thư mục, quy tắc client/server component, caching | Hoàn thiện |
| **plans/phase-1/** | [`plans/phase-1/plan.md`](./plans/phase-1/plan.md) | Kế hoạch triển khai ban đầu của Phase 1 | Hoàn thành |
| **plans/phase-1/** | [`plans/phase-1/verification-report.md`](./plans/phase-1/verification-report.md) | Báo cáo nghiệm thu & kiểm định chất lượng 100% Phase 1 | [100% PASSED] |
| **plans/phase-2/** | [`plans/phase-2/plan.md`](./plans/phase-2/plan.md) | Kế hoạch triển khai chi tiết Alert Engine & Zalo Notification | [HOÀN THÀNH 100%] |
| **plans/phase-2/** | [`plans/phase-2/verification-report.md`](./plans/phase-2/verification-report.md) | Báo cáo nghiệm thu & kiểm định chất lượng 100% Phase 2 | [100% PASSED] |

---

## 3. Lộ Trình Phát Triển (Roadmap)

```text
Phase 1  Core Price Tracking          [HOÀN THÀNH 100% - ĐÃ KIỂM ĐỊNH]
Phase 2  Alert Engine + Zalo UX       [HOÀN THÀNH 100% - ĐÃ KIỂM ĐỊNH]
Phase 3  Cross-platform Comparison    [Dự kiến]
Phase 4  Price Intelligence           [Dự kiến]
Phase 5  Discovery / Auto Hunt        [Dự kiến]
Phase 6  Advanced Consumer Product    [Dự kiến]
```
