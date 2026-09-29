import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PriceChangePillProps {
  changePercent: number; // e.g. -8.7, 4.2, 0
  className?: string;
  showIcon?: boolean;
  labelPrefix?: string;
}

export function PriceChangePill({
  changePercent,
  className = "",
  showIcon = true,
  labelPrefix = "",
}: PriceChangePillProps) {
  if (changePercent < 0) {
    const absVal = Math.abs(changePercent);
    return (
      <span
        aria-label={`Giá giảm ${absVal}%`}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        {showIcon && <TrendingDown className="w-3.5 h-3.5" />}
        <span>
          {labelPrefix}↓ {absVal}%
        </span>
      </span>
    );
  }

  if (changePercent > 0) {
    return (
      <span
        aria-label={`Giá tăng ${changePercent}%`}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        {showIcon && <TrendingUp className="w-3.5 h-3.5" />}
        <span>
          {labelPrefix}↑ {changePercent}%
        </span>
      </span>
    );
  }

  return (
    <span
      aria-label="Giá không đổi"
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
    >
      {showIcon && <Minus className="w-3.5 h-3.5 opacity-60" />}
      <span>{labelPrefix}0%</span>
    </span>
  );
}
