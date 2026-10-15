"use client";

import { useState } from "react";
import { Package } from "lucide-react";

/**
 * The real product photo from the marketplace, on its own white tile with padding, so a red, yellow
 * or orange product never sets the page's colour. Falls back to a quiet icon when there is no photo
 * or it fails to load. A plain <img>: marketplace CDNs vary, so next/image would need every host listed.
 */
export function ProductImage({
  src,
  alt,
  size = 64,
  className = "",
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-pine-900/[0.07] ${className}`}
      style={{ width: size, height: size }}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <Package className="h-1/3 w-1/3 text-pine-300" strokeWidth={1.5} aria-hidden />
      )}
    </div>
  );
}
