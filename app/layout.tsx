import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marín & Asociados",
  description: "Sistema contable — Soluciones contables que generan valor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
