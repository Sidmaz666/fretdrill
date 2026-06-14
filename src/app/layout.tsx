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
  title: "ScaleForge — Exercise Generator",
  description: "Procedural exercise generator with scale patterns, tab notation, and practice tools. Master the neck, one pattern at a time.",
  keywords: ["exercises", "scales", "pentatonic", "fretboard", "tabs", "CAGED", "music theory", "practice"],
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
