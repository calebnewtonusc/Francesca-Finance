import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Francesca Finance",
  description: "Personal finance dashboard — tax-optimized wealth at 59.5",
  robots: "noindex, nofollow", // private single-user app
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
