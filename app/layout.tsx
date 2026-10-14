import "./globals.css";
import { Be_Vietnam_Pro } from "next/font/google";
import Navbar from "@/components/Navbar";
import { QueryProvider } from "@/components/QueryProvider";
import { LanguageProvider } from "@/lib/i18n";

// Designed for Vietnamese: every diacritic is drawn properly at every weight
const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata = {
  title: "DealHunter — Săn đúng giá trước khi mua",
  description:
    "Theo dõi giá sản phẩm bạn quan tâm và nhận thông báo khi có giá tốt từ Shopee, Lazada, TikTok Shop.",
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
    <html lang="vi" className={sans.variable}>
      <body className="min-h-screen flex flex-col bg-[#F6F8F7] text-slate-900 antialiased">
        <QueryProvider>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
              {children}
            </main>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
