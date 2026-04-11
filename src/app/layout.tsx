import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallPWA from "@/components/InstallPWA";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "I Love Chinese - Apprends le Mandarin",
  description: "Application d'apprentissage du mandarin avec flashcards, SRS, et prof IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "I Love Chinese",
  },
};

export const viewport: Viewport = {
  themeColor: "#131F24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col pb-20">
        <InstallPWA />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
