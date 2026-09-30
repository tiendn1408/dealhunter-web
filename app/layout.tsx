import "./globals.css";
import Navbar from "@/components/Navbar";
import { QueryProvider } from "@/components/QueryProvider";

export const metadata = {
  title: "DealHunter — Săn đúng giá trước khi mua",
  description:
    "Theo dõi giá sản phẩm bạn quan tâm và nhận thông báo khi có giá tốt từ Shopee, Lazada, TikTok Shop.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#F8FAF9] text-slate-900 antialiased">
        <QueryProvider>
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
