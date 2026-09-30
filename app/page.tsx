"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackProduct } from "@/lib/api";
import { useTrackings } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { detectPlatform, formatVND } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  X,
  Target,
  Bookmark,
  Sparkles,
  TrendingDown,
  ShoppingBag,
} from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { data: userTrackings = [] } = useTrackings();
  const [showInputModal, setShowInputModal] = useState(false);

  // Success state matching Screen 4
  const [successData, setSuccessData] = useState<{
    id: string;
    productSourceId: string;
    url: string;
  } | null>(null);

  // Check URL query parameters
  useEffect(() => {
    const urlParam = searchParams.get("url") || searchParams.get("sample");
    if (urlParam) {
      setUrl(urlParam);
      setShowInputModal(true);
    }
  }, [searchParams]);

  const detected = url.trim() ? detectPlatform(url) : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setLoadingStep(0);
    setError(null);

    const timer1 = setTimeout(() => setLoadingStep(1), 500);
    const timer2 = setTimeout(() => setLoadingStep(2), 1000);

    try {
      const res = await trackProduct(cleanUrl);
      qc.invalidateQueries({ queryKey: ["trackings"] });
      setSuccessData({
        id: res.id,
        productSourceId: res.product_source_id,
        url: cleanUrl,
      });
      setShowInputModal(false);
    } catch (err: any) {
      setError(err.message || "Không thể theo dõi sản phẩm. Vui lòng kiểm tra lại link.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
    }
  };

  const sampleLinks = [
    {
      title: "Tai nghe Sony WH-1000XM6",
      url: "https://mock.dealhunter.vn/product/sony-wh-1000xm6",
      platform: "shopee",
      sub: "Tai nghe chống ồn cao cấp",
      price: 6190000,
      oldPrice: 7090000,
      drop: "-12,7%",
    },
    {
      title: "Ổ cứng SSD Samsung 2TB 990 Pro",
      url: "https://mock.dealhunter.vn/product/samsung-ssd-2tb",
      platform: "lazada",
      sub: "PCIe 4.0 NVMe siêu tốc",
      price: 2790000,
      oldPrice: 3340000,
      drop: "-16,4%",
    },
    {
      title: "Điện thoại iPhone 16 Pro Max 256GB",
      url: "https://mock.dealhunter.vn/product/iphone-16-pro-max",
      platform: "tiktok",
      sub: "Titan Tự Nhiên - Chính hãng VN/A",
      price: 31990000,
      oldPrice: 34990000,
      drop: "-8,5%",
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-8 max-w-6xl mx-auto">
      {/* 1. HERO SECTION matching web-dashboard.png & mobile.png */}
      {!successData ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-pine-50/70 via-white to-white border border-pine-100/80 p-6 sm:p-10 lg:p-14 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tagline Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pine-100/90 text-pine-900 border border-pine-200/80 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-pine-800" />
                <span>Săn đúng giá. Mua đúng lúc.</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl font-black text-pine-900 tracking-tight leading-tight">
                  DealHunter
                </h1>
                <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-lg">
                  Theo dõi giá sản phẩm bạn quan tâm và nhận thông báo khi có giá tốt.
                </p>
              </div>

              {/* Main Paste Input Box matching mockup */}
              <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-sm space-y-2">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1 flex items-center">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="url"
                      required
                      value={url}
                      disabled={loading}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Dán link sản phẩm (Shopee, Lazada, TikTok Shop...)"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl focus:outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="px-6 py-3 bg-pine-900 hover:bg-pine-950 active:bg-black disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 shrink-0"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <span>Theo dõi giá</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Step feedback when analyzing */}
                {loading && (
                  <div className="pt-2 px-2 text-[11px] text-slate-600 space-y-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-emerald-600">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 8.5 6.5 12 13 4" />
                        </svg>
                      </span>
                      <span>Nhận diện nền tảng ({detected?.name || "Hệ thống"})</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      {loadingStep >= 1 ? (
                        <span className="text-emerald-600">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 8.5 6.5 12 13 4" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block w-3 h-3 border-2 border-pine-800 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className={loadingStep >= 1 ? "text-slate-700" : "text-pine-900 font-bold"}>
                        Đọc thông tin sản phẩm & giá hiện tại...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      {loadingStep >= 2 ? (
                        <span className="text-emerald-600">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 8.5 6.5 12 13 4" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-slate-300">●</span>
                      )}
                      <span className={loadingStep >= 2 ? "text-pine-900 font-bold" : "text-slate-400"}>
                        Lập lịch theo dõi tự động định kỳ...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-action: "Hoặc: Tìm sản phẩm bạn muốn mua" */}
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <span>Hoặc:</span>
                <button
                  type="button"
                  onClick={() => setShowInputModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-all shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chọn link sản phẩm mẫu</span>
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Graphic: Floating Signature Card matching web-dashboard.png */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Curved annotation text */}
              <div className="hidden lg:block absolute -top-8 right-6 text-pine-800 font-bold text-xs tracking-wide">
                <span className="block transform rotate-6">Không bỏ lỡ</span>
                <span className="block transform rotate-6 text-sm text-pine-900">deal tốt!</span>
                <svg className="w-8 h-8 text-pine-700 mt-1 ml-4" viewBox="0 0 40 40" fill="none">
                  <path d="M10 5 C 25 15, 30 25, 20 35" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="17,35 24,35 20,38" fill="currentColor" />
                </svg>
              </div>

              {/* Card visual from mockup */}
              <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl relative z-10 transition-transform hover:-translate-y-1 duration-300">
                {/* Badge top right */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    Minh họa
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <TrendingDown className="w-3 h-3" />
                    Vừa giảm
                  </span>
                </div>

                {/* Headphone image mockup */}
                <div className="w-full h-36 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                  <svg className="w-20 h-20 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                </div>

                {/* Product Title */}
                <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                  Sony WH-1000XM6
                </h3>
                <p className="text-[11px] text-slate-400 line-through mb-1">
                  7.090.000đ
                </p>

                {/* Price & Drop */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-pine-900">
                    6.190.000đ
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                    Giảm 12,7%
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  Giá thấp nhất 90 ngày: 6.050.000đ
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCREEN 4: SUCCESS CONFIRMATION matching mobile.png Screen 4 */
        <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6 animate-fadeIn">
          {/* Green checkmark circle */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-pine-900 mb-1">
              Đã thêm sản phẩm
            </h2>
            <p className="text-xs text-slate-500">
              Sản phẩm đã được ghi nhận vào danh sách theo dõi của bạn
            </p>
          </div>

          {/* Product Preview Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <PlatformBadge platformOrUrl={successData.url} />
              <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {successData.url}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Sản phẩm theo dõi mới
              </h3>
              <p className="text-xs text-slate-500">
                Chu kỳ quét tự động mỗi 30 phút
              </p>
            </div>
          </div>

          {/* Notice banner */}
          <div className="bg-pine-50/80 border border-pine-100 rounded-xl p-3 text-xs text-pine-900 leading-relaxed text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-pine-700 mt-0.5 shrink-0" />
            <span>
              DealHunter sẽ theo dõi giá sản phẩm này và thông báo cho bạn khi có biến động hoặc đạt giá mục tiêu.
            </span>
          </div>

          {/* CTAs matching Screen 4 */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/tracking/${successData.productSourceId || successData.id}`)}
              className="w-full py-3 bg-pine-900 hover:bg-pine-950 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-all"
            >
              Xem sản phẩm
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setUrl("");
              }}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      )}

      {/* 2. SECTION: CÁCH DEALHUNTER HOẠT ĐỘNG matching web-dashboard.png & mobile.png */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-pine-900 tracking-tight">
          Cách DealHunter hoạt động
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* 3 Step Cards (left 8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-full bg-pine-50 border border-pine-200 text-pine-900 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Dán link sản phẩm
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sao chép link từ Shopee, Lazada, TikTok Shop hoặc nhập từ khóa cần mua.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-full bg-pine-50 border border-pine-200 text-pine-900 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Kiểm tra & theo dõi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống tự động phân tích giá thực tế và lưu trữ lịch sử biến động định kỳ.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-full bg-pine-50 border border-pine-200 text-pine-900 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Nhận thông báo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Khi giá giảm hoặc chạm mức giá mục tiêu bạn mong muốn, bạn sẽ nhận được thông báo.
              </p>
            </div>
          </div>

          {/* Right Highlight Box: "Bạn hoàn toàn chủ động" */}
          <div className="lg:col-span-4 bg-gradient-to-br from-pine-50/80 to-emerald-50/40 border border-pine-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-pine-900 text-white flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-pine-900 text-sm">
                Bạn hoàn toàn chủ động
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Đặt giá mục tiêu, xem biểu đồ lịch sử giá và tự quyết định thời điểm mua phù hợp nhất.
              </p>
            </div>

            <Link
              href="/tracking"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pine-900 hover:text-pine-950 mt-4 group"
            >
              <span>Xem sản phẩm đã theo dõi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. SECTION: NỀN TẢNG ĐƯỢC HỖ TRỢ matching web-dashboard.png */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Nền tảng được hỗ trợ
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>An toàn · Nhanh chóng · Chính xác</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs border border-orange-200">
              S
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">Shopee</span>
              <span className="text-[11px] text-slate-400 block">Hỗ trợ đầy đủ</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-200">
              L
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">Lazada</span>
              <span className="text-[11px] text-slate-400 block">Hỗ trợ đầy đủ</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
              T
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">TikTok Shop</span>
              <span className="text-[11px] text-slate-400 block">Hỗ trợ đầy đủ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECTION: BẠN CÓ THỂ BẮT ĐẦU BẰNG CÁCH... matching web-dashboard.png */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Bạn có thể bắt đầu bằng cách...
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sampleLinks.map((sample) => (
            <button
              key={sample.title}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                setShowInputModal(true);
              }}
              className="bg-white border border-slate-200/90 hover:border-pine-300 rounded-2xl p-4 text-left transition-all hover:shadow-xs group space-y-2"
            >
              <div className="flex items-center justify-between">
                <PlatformBadge platformOrUrl={sample.platform} />
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {sample.drop}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-pine-900 transition-colors line-clamp-1">
                {sample.title}
              </h3>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-black text-slate-900">
                  {formatVND(sample.price)}
                </span>
                <span className="text-[11px] font-medium text-pine-900 flex items-center gap-1 group-hover:underline">
                  Thử ngay
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SCREEN 3: DÁN LINK SẢN PHẨM MODAL matching Screen 3 in mobile.png */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp relative">
            <button
              type="button"
              onClick={() => setShowInputModal(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-pine-900">
                Dán link sản phẩm
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hỗ trợ link từ Shopee, Lazada, TikTok Shop
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://shopee.vn/product/..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 pr-10"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full py-3 bg-pine-900 hover:bg-pine-950 disabled:opacity-50 text-white font-semibold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <span>Tiếp tục</span>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Hoặc chọn nền tảng mẫu:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {sampleLinks.map((s) => (
                  <button
                    key={s.platform}
                    type="button"
                    onClick={() => setUrl(s.url)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-pine-800 text-center transition-all bg-slate-50 hover:bg-pine-50"
                  >
                    <span className="text-xs font-bold text-slate-800 block capitalize">
                      {s.platform}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-14 text-center text-slate-400 text-xs">
          Đang tải giao diện...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
