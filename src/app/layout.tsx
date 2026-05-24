import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gato Dumas — Centro de Seguimiento Digital",
  description:
    "Dashboard de pauta digital (Meta Ads) · CookMinds · Fase 1. Diseño base provisional.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
