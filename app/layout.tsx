import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "GreenDuty — Agri-Tech & Environmental Platform",
  description: "Uniting agriculture, technology, and environmental action for a sustainable future.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GreenDuty",
  },
};

/** Proper viewport for phones (notches/safe areas), tablets & laptops */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gd-deepest text-gd-text-primary font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
