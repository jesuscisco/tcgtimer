import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FONT_VARIABLES } from "@/lib/fonts/catalog";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCG Timer",
  description: "Control de timers de torneos TCG",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${FONT_VARIABLES} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}