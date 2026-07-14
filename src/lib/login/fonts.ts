/**
 * Tipografía oficial The Lab (Brand House 2026) para /login y /login-denegado (The Lab).
 * IBM Plex Sans (lectura/números) + IBM Plex Mono (etiqueta técnica).
 * next/font descarga en build y sirve same-origin → compatible con el CSP
 * (no hay request a CDN en runtime). Druk no se puede servir: el display
 * usa la font stack condensed de sistema (--lab-font-display en globals.css).
 */
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

/** Clases de variables para el wrapper raíz de la vista (junto a `lab`). */
export const labFontVars = `${plexSans.variable} ${plexMono.variable}`;
