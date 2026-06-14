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

const APP_NAME = "FretDrill";
const APP_DESCRIPTION = "Interactive guitar fretboard practice tool with CAGED positions, scale patterns, tab notation, and exercise generation. Master the neck, one pattern at a time.";
const APP_URL = "https://fretdrill.app";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Guitar Fretboard Practice & Exercise Generator`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "guitar", "fretboard", "scales", "CAGED", "pentatonic",
    "guitar exercises", "music theory", "guitar practice",
    "tab notation", "guitar fretboard diagram", "scale patterns",
  ],
  authors: [{ name: "FretDrill" }],
  creator: "FretDrill",
  publisher: "FretDrill",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Guitar Fretboard Practice & Exercise Generator`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/guitar-icon.png",
        width: 1024,
        height: 1024,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Guitar Fretboard Practice & Exercise Generator`,
    description: APP_DESCRIPTION,
    images: ["/guitar-icon.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/guitar-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  category: "music",
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
