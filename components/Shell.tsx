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
  return <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10 lg:py-10">{children}</main>;
}
