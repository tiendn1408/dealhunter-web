"use client";

import { usePathname } from "next/navigation";

/**
 * The home page is a full-bleed board; working pages sit in the standard reading container.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>;
  }
  return <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10 pb-24 md:pb-10">{children}</main>;
}
