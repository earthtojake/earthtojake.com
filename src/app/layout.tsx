import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClientShell } from "./ClientShell";
import "../styles.css";

export const metadata: Metadata = {
  title: "earthtojake.com",
  icons: {
    icon: "/favicon.png",
  },
};

const googleFontsUrl =
  "https://fonts.googleapis.com/css2?family=Barriecito&family=Bree+Serif&family=DynaPuff&family=Fira+Sans&family=Freckle+Face&family=Geo&family=Inconsolata&family=Indie+Flower&family=Inter&family=Lora&family=Merienda&family=Merriweather&family=Mountains+of+Christmas&family=Nunito+Sans&family=Oswald&family=PT+Serif&family=Patrick+Hand&family=Poppins&family=Quantico&family=Reenie+Beanie&family=Roboto+Slab&family=VT323&display=swap&text=jake";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={googleFontsUrl} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
        />
      </head>
      <body>
        <Analytics />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
