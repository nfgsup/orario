import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PWARegister } from "@/components/orario/pwa-register";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orario 3Ai · 26/27",
  description:
    "Orario scolastico della classe 3Ai per la stagione 2026/2027 — materia in corso, countdown, timeline, compiti, docenti e vacanze. PWA installabile.",
  keywords: [
    "orario scolastico",
    "3Ai",
    "26/27",
    "orario classe",
    "school timetable",
    "PWA",
  ],
  authors: [{ name: "3Ai" }],
  manifest: "/manifest.json",
  applicationName: "Orario 3Ai",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orario 3Ai",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Orario 3Ai · 26/27",
    description:
      "Orario scolastico 3Ai stagione 2026/2027 — PWA installabile, offline-ready.",
    type: "website",
    locale: "it_IT",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* PWA / iOS meta extra (non gestibili da Metadata API) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Orario 3Ai" />
        <meta name="application-name" content="Orario 3Ai" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${outfit.variable} ${jetbrains.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
