import React from "react";

/**
 * The signature of the whole site: the logo's price tag (cut corner, punched hole) in kraft
 * cardboard, pinned with a red tack. Superseded prices are struck in red marker, the current one
 * is written in marker. Every price DealHunter shows is written on one of these.
 */
export function PriceTag({
  children,
  className = "",
  tilt = 0,
  pinned = true,
  tone = "kraft",
}: {
  children: React.ReactNode;
  className?: string;
  /** degrees */
  tilt?: number;
  pinned?: boolean;
  tone?: "kraft" | "chalk";
}) {
  const ground = tone === "kraft" ? "bg-kraft text-kraft-ink" : "bg-white text-pine-900";
  return (
    <div className={`relative ${className}`} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      <div className={`tag-shape relative h-full px-6 pb-6 pt-9 ${ground}`}>
        {/* the punched hole of the logo's tag */}
        <span aria-hidden className="absolute left-[40px] top-3 h-3 w-3 rounded-full bg-pine-950/80" />
        {children}
      </div>
      {pinned && <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-marker" />}
    </div>
  );
}

/** A superseded price, struck through in red marker. */
export function StruckPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`marker-strike font-marker font-semibold opacity-70 ${className}`}>{children}</span>;
}

/** The current price, written in marker. */
export function WrittenPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-marker font-extrabold leading-none tracking-tight ${className}`}>{children}</span>;
}
