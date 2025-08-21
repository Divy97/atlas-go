import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Bungee, VT323 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const retroDisplay = Bungee({
  variable: "--font-retro",
  weight: "400",
  subsets: ["latin"],
});

const pixelFont = VT323({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas Go - Retro Geography Game",
  description: "Play the ultimate retro geography game! Name countries in a chain reaction challenge with 90s nostalgia.",
  keywords: "geography game, countries, atlas, retro game, 90s style, educational game",
  authors: [{ name: "Divy Parekh" }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Atlas Go - Retro Geography Game",
    description: "Play the ultimate retro geography game! Name countries in a chain reaction challenge.",
    type: "website",
    url: "https://atlas-go.vercel.app",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Atlas Go - Retro Geography Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas Go - Retro Geography Game",
    description: "Play the ultimate retro geography game! Name countries in a chain reaction challenge.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} ${retroDisplay.variable} ${pixelFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
