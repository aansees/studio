import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import localFont from "next/font/local";
import LenisProvider from "@/components/lenis-provider";
import ClickSpark from "@/components/global/cursor-sparklin";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" });

const editorialNew = localFont({
  src: "./fonts/EditorialNew-Regular.otf",
  variable: "--font-editorial",
  display: "swap",
});

const greatVibes = localFont({
  src: "./fonts/GreatVibes-Regular.ttf",
  variable: "--font-great-vibes",
  display: "swap",
});

const mondwest = localFont({
  src: "./fonts/Mondwest-Regular.otf",
  variable: "--font-mondwest",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ANCS Studio",
    template: "%s | ANCS Studio",
  },
  description:
    "ANCS Studio is a digital agency building impressive websites, systems, Android apps, and interactive launches for ambitious teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // themeColor: META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={raleway.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${editorialNew.variable} ${greatVibes.variable} ${mondwest.variable} antialiased`}
      >
        
          <LenisProvider>
            {children}
            <ClickSpark />
          </LenisProvider>
        <Toaster />
      </body>
    </html>
  );
}
