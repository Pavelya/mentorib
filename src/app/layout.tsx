import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { buildRootMetadata } from "@/lib/seo/metadata/defaults";
import "@/styles/globals.css";

const sans = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ui-sans",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ui-mono",
  weight: ["400", "500"],
});

const serif = Instrument_Serif({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ui-serif",
  weight: ["400"],
});

export const metadata: Metadata = buildRootMetadata();

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${sans.variable} ${serif.variable} ${mono.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}
