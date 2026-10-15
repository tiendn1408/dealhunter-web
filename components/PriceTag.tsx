import React from "react";

/**
 * The price card used across the site: a white core with a large concentric radius and soft depth.
 * A superseded price is struck through, the current one is set large in tabular figures.
 */
export function PriceTag({
  children,
  className = "",
  tone = "white",
}: {
  children: React.ReactNode;
  className?: string;
  /** white on light grounds, pine on dark grounds, muted for paused items */
  tone?: "white" | "pine" | "muted";
}) {
  const ground =
    tone === "pine" ? "bg-pine-900 text-chalk" : tone === "muted" ? "bg-pine-50 text-pine-800" : "bg-white text-pine-900";
  return (
    <div className={`relative h-full rounded-[1.5rem] p-6 shadow-soft ring-1 ring-pine-900/[0.05] ${ground} ${className}`}>
      {children}
    </div>
  );
}

/** A superseded price, struck through. */
export function StruckPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-semibold tabular-nums line-through decoration-marker decoration-2 opacity-60 ${className}`}>
      {children}
    </span>
  );
}

/** The current price, set large. */
export function WrittenPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-extrabold leading-none tracking-[-0.03em] tabular-nums ${className}`}>{children}</span>;
}
