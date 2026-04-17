import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "@/styles/globals.css";

const sans = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Mentor IB",
    template: "%s | Mentor IB",
  },
  description:
    "Mentor IB is a matching-first IB tutoring product built as one ecosystem for students and tutors.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${sans.variable} ${mono.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}
