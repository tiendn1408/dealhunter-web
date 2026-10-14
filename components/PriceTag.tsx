import React from "react";

/**
 * The one shape of the whole site: the logo's price tag, a card with its top-left corner cut.
 * Every price DealHunter shows sits on one. A superseded price is struck through, the current one is
 * set large in tabular figures.
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
    <div className={`tag-shape relative h-full px-6 pb-6 pt-7 ${ground} ${className}`}>{children}</div>
  );
}

/** A superseded price, struck through. */
export function StruckPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-semibold tabular-nums line-through decoration-marker decoration-2 opacity-70 ${className}`}>
      {children}
    </span>
  );
}

/** The current price, set large. */
export function WrittenPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-extrabold leading-none tracking-[-0.03em] tabular-nums ${className}`}>{children}</span>;
}
