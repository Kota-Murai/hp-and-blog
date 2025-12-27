import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-emerald-600 focus:font-medium"
      >
        メインコンテンツへスキップ
      </a>
      <Header />
      <main id="main-content" className="flex-1 md:pb-[0px]">{children}</main>
      <Footer />
    </div>
  );
}
