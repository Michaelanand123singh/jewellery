/**
 * Admin routes layout
 * Admin dashboard pages
 */

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

