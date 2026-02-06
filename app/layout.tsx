import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { CartWishlistSync } from "@/components/providers/CartWishlistSync";
import { FirstVisitLoginModal } from "@/components/auth/FirstVisitLoginModal";
import { AuthRequiredProvider } from "@/components/providers/AuthRequiredProvider";

const jost = Jost({ 
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adorne - Premium Jewelry Collection",
  description:
    "Discover our exquisite collection of fine jewelry including rings, necklaces, earrings, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} ${jost.className} font-sans`}>
        <AuthRequiredProvider>
          <CartWishlistSync />
          <FirstVisitLoginModal />
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthRequiredProvider>
      </body>
    </html>
  );
}
