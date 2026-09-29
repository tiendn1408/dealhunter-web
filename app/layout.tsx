import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Deal Hunter — Săn Deal & Lịch Sử Giá",
  description: "Theo dõi giá sản phẩm xuyên sàn TMĐT Shopee, Lazada, TikTok Shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
