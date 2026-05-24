import type { Metadata } from "next";
import { Raleway, Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Fuentes institucionales (handoff/DESIGN_TOKENS.json):
 * - Raleway: toda la UI.
 * - Oswald: números display.
 * - JetBrains Mono: sellos y ejes de gráficos.
 * Cargadas con next/font/google y expuestas como variables CSS.
 */
const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-raleway",
  display: "swap",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-oswald",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gato Dumas — Centro de Seguimiento Digital",
  description: "Pauta digital · Meta Ads · CookMinds para Instituto Gato Dumas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      data-mode="interno"
      data-theme="light"
      data-density="comfortable"
      className={`${raleway.variable} ${oswald.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
