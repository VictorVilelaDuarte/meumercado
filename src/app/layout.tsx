import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "800"], variable: "--fonte-display" });
const texto = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fonte-texto" });

export const metadata: Metadata = {
  title: "meumercado",
  description: "Preços reais dos mercados de São José dos Campos, escaneados pelos seus amigos.",
};

export const viewport: Viewport = {
  themeColor: "#0e0c14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${texto.variable}`}>
      <body className="min-h-dvh bg-fundo text-texto">
        <div className="mx-auto min-h-dvh w-full max-w-md">{children}</div>
      </body>
    </html>
  );
}
