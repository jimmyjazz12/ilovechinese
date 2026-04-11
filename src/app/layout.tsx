import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I Love Chinese - Apprends le Mandarin",
  description: "Application d'apprentissage du mandarin avec flashcards, SRS, et prof IA",
  manifest: "/manifest.json",
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
      </head>
      <body className="min-h-full flex flex-col pb-20">{children}</body>
    </html>
  );
}
