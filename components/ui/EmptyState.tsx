import React from "react";
import Link from "next/link";
import { Radar, ArrowRight, Sparkles } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onSampleClick?: (url: string) => void;
}

export function EmptyState({
  title = "Chưa có sản phẩm nào được theo dõi",
  description = "Dán đường link từ Shopee, Lazada, hoặc TikTok Shop để bắt đầu ghi nhận lịch sử biến động giá.",
  actionText = "Dán link theo dõi ngay",
  actionHref = "/",
  onSampleClick,
}: EmptyStateProps) {
  const sampleProducts = [
    {
      name: "Tai nghe Sony WH-1000XM6",
      url: "https://mock.dealhunter.vn/product/sony-wh-1000xm6",
      platform: "Shopee",
    },
    {
      name: "MacBook Pro 14 M3 18GB",
      url: "https://mock.dealhunter.vn/product/macbook-pro-m3",
      platform: "Lazada",
    },
    {
      name: "iPhone 16 Pro Max 256GB",
      url: "https://mock.dealhunter.vn/product/iphone-16-pro-max",
      platform: "TikTok",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
      <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
        <Radar className="w-8 h-8 animate-pulse text-indigo-600" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow"
      >
        <span>{actionText}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hoặc thử nhanh với sản phẩm mẫu:</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {sampleProducts.map((sample) => (
            <Link
              key={sample.name}
              href={`/?sample=${encodeURIComponent(sample.url)}`}
              onClick={() => onSampleClick && onSampleClick(sample.url)}
              className="text-xs px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl transition-colors border border-slate-200/80 font-medium"
            >
              {sample.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
