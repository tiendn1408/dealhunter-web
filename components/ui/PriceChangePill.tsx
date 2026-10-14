import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface PriceChangePillProps {
  changePercent: number; // e.g. -8.7, 4.2, 0
  className?: string;
  /** kept for compatibility; the arrow carries the direction */
  showIcon?: boolean;
  labelPrefix?: string;
}

/** A drop is written in teal chalk, a rise in red marker, no change plainly. */
export function PriceChangePill({ changePercent, className = "", labelPrefix = "" }: PriceChangePillProps) {
  const base = `inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-bold ${className}`;
  if (changePercent < 0) {
    const absVal = Math.abs(changePercent);
    return (
      <span aria-label={`Giá giảm ${absVal}%`} className={`${base} bg-teal-200 text-pine-950`}>
        {labelPrefix}
        <ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />
        {absVal}%
      </span>
    );
  }
  if (changePercent > 0) {
    return (
      <span aria-label={`Giá tăng ${changePercent}%`} className={`${base} bg-[#FBE3E4] text-marker-deep`}>
        {labelPrefix}
        <ArrowUp className="h-3.5 w-3.5" strokeWidth={3} />
        {changePercent}%
      </span>
    );
  }
  return (
    <span aria-label="Giá không đổi" className={`${base} bg-pine-50 font-semibold text-pine-700`}>
      {labelPrefix}0%
    </span>
  );
}
