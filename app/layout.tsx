import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "fmovies",
  description: "Catalogue filmes, deixe a sua nota e veja recomendações.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${outfit.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[70] opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.92 0.02 85) 0.6px, transparent 0.6px)",
            backgroundSize: "3px 3px",
          }}
        />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
