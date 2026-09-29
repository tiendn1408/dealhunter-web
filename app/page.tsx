"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackProduct } from "@/lib/api";
import { detectPlatform } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LineChart,
  Clock,
  BellRing,
  RotateCcw,
} from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0, 1, 2
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    id: string;
    productSourceId: string;
    url: string;
  } | null>(null);

  // Check if sample url passed in query string
  useEffect(() => {
    const sample = searchParams.get("sample");
    if (sample) {
      setUrl(sample);
    }
  }, [searchParams]);

  // Detected platform as user types
  const detected = url.trim() ? detectPlatform(url) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setSuccessData(null);

    // Step-by-step interactive simulated stages for better perceived UX
    const timer1 = setTimeout(() => setLoadingStep(1), 600);
    const timer2 = setTimeout(() => setLoadingStep(2), 1200);

    try {
      const res = await trackProduct(cleanUrl);
      setSuccessData({
        id: res.id,
        productSourceId: res.product_source_id,
        url: cleanUrl,
      });
    } catch (err: any) {
      setError(
        err.message || "Không thể theo dõi sản phẩm. Vui lòng kiểm tra lại đường link."
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
    }
  };

  const sampleLinks = [
    {
      title: "Sony WH-1000XM6",
      url: "https://mock.dealhunter.vn/product/sony-wh-1000xm6",
      platform: "Shopee",
    },
    {
      title: "MacBook Pro M3 18GB",
      url: "https://mock.dealhunter.vn/product/macbook-pro-m3",
      platform: "Lazada",
    },
    {
      title: "iPhone 16 Pro Max 256GB",
      url: "https://mock.dealhunter.vn/product/iphone-16-pro-max",
      platform: "TikTok",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-14">
      {/* Top Banner Tag */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50/80 border border-indigo-100/90 text-indigo-700 rounded-full text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Theo dõi giá thông minh · Minh bạch lịch sử sàn</span>
        </div>
      </div>

      {/* Main Headline */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Săn giá trước khi{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
            xuống tiền
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Dán đường link sản phẩm để tự động lưu lại lịch sử giá, phát hiện bẫy giảm giá ảo và chờ thời điểm mua tốt nhất.
        </p>
      </div>

      {/* Track Product Box or Success Card */}
      {!successData ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-lg shadow-slate-100 mb-8 transition-all">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-4 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="url"
                required
                disabled={loading}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán link Shopee, Lazada, TikTok Shop..."
                className="w-full pl-12 pr-28 py-3.5 text-sm sm:text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 border border-transparent text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white transition-all font-normal"
              />
              {detected && (
                <div className="absolute right-3 hidden sm:block">
                  <PlatformBadge platformOrUrl={detected.id} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold rounded-2xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 min-w-[150px]"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Theo dõi giá</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Step-by-step progress feedback while loading */}
          {loading && (
            <div className="mt-4 pt-4 border-t border-slate-100 px-3 py-2 text-xs text-slate-600 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-emerald-600">✓</span>
                <span>Nhận diện sàn thương mại điện tử ({detected?.name || "Hệ thống"})</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                {loadingStep >= 1 ? (
                  <span className="text-emerald-600">✓</span>
                ) : (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span className={loadingStep >= 1 ? "text-slate-800" : "text-indigo-600 font-semibold"}>
                  Đọc thông tin sản phẩm & giá hiện tại...
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                {loadingStep >= 2 ? (
                  <span className="text-emerald-600">✓</span>
                ) : (
                  <span className="text-slate-300">●</span>
                )}
                <span className={loadingStep >= 2 ? "text-indigo-600 font-semibold" : "text-slate-400"}>
                  Lập lịch theo dõi tự động định kỳ...
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Không thể theo dõi sản phẩm</p>
                <p className="text-rose-600/90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Success Card (Consumer-first Next Action) */
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-lg shadow-emerald-50 mb-8 animate-fadeIn text-center">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Đã thêm vào danh sách theo dõi!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Hệ thống đã ghi nhận sản phẩm và lập lịch kiểm tra biến động giá tự động mỗi 30 phút.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => router.push(`/tracking/${successData.productSourceId}`)}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Xem biểu đồ & lịch sử giá ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setUrl("");
              }}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Theo dõi sản phẩm khác</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Test Sample Links */}
      <div className="text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hoặc thử nhanh với các link sản phẩm mẫu:</span>
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {sampleLinks.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                setUrl(item.url);
                setError(null);
              }}
              className="text-xs px-3.5 py-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-medium rounded-xl transition-all border border-slate-200 shadow-xs flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3 Core Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-200">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <LineChart className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Minh bạch lịch sử giá</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Xem biểu đồ giá thực tế qua thời gian, biết rõ người bán có đang tăng giá rồi gắn nhãn sale ảo hay không.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Tự động quét định kỳ</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Worker chạy ngầm liên tục mỗi 30 phút để bắt trọn từng đợt flash sale hoặc mã giảm giá mới nhất.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <BellRing className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Sẵn sàng cảnh báo Zalo</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kiến trúc sẵn sàng liên kết Zalo ZNS để tự động bắn tin nhắn ngay khi giá giảm chạm ngưỡng bạn mong muốn.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-14 text-center text-slate-400 text-sm">
          Đang tải giao diện...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
