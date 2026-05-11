import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Master Dashboard",
  description: "Travel CMS Control Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
