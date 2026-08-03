import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SearchPalette } from "@/components/search/search-palette";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { Trackers } from "@/components/analytics/trackers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ravi-intelligence.com"),
  title: {
    default: "Ravi Intelligence - Learn. Analyze. Grow.",
    template: "%s | Ravi Intelligence"
  },
  description: "India's most trusted learning platform for Analytics, AI, Accounting, Finance, Tech, and Career Development.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "./",
    types: {
      "application/rss+xml": "/feed.xml"
    }
  },
  openGraph: {
    title: "Ravi Intelligence",
    description: "Learn step-by-step databases, excel workbooks, and artificial intelligence prompts.",
    url: "https://ravi-intelligence.com",
    siteName: "Ravi Intelligence",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Ravi Intelligence",
    description: "Learn step-by-step databases, excel workbooks, and artificial intelligence prompts."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SearchPalette />
          <CookieConsent />
          <Trackers />
        </ThemeProvider>
      </body>
    </html>
  );
}
