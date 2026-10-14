import "./globals.css";
import { Be_Vietnam_Pro, Shantell_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Shell } from "@/components/Shell";
import { QueryProvider } from "@/components/QueryProvider";
import { LanguageProvider } from "@/lib/i18n";

// Designed for Vietnamese: every diacritic is drawn properly at every weight
const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-sans",
});

// Marker lettering of the market price board: board headlines and prices only
const marker = Shantell_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "800"],
  display: "swap",
  variable: "--font-marker",
});

export const metadata = {
  title: "DealHunter — Săn đúng giá trước khi mua",
  description:
    "Dán link Shopee, Lazada, TikTok Shop để xem giá thật, lịch sử giá và nhận báo khi giá giảm.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${sans.variable} ${marker.variable}`}>
      <body className="flex min-h-svh flex-col bg-paper text-pine-900 antialiased">
        <QueryProvider>
          <LanguageProvider>
            <Navbar />
            <Shell>{children}</Shell>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
