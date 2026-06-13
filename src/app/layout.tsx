import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FretBoard Forge — Guitar Exercise Generator",
  description: "Procedural guitar exercise generator with fretboard diagrams, scale patterns, and tab notation. Inspired by Ricky's Guitar teaching method.",
  keywords: ["guitar", "exercises", "scales", "pentatonic", "fretboard", "tabs", "CAGED", "music theory"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f5f0e8] text-[#2c2c2c]`}
        style={{ backgroundColor: '#f5f0e8' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
