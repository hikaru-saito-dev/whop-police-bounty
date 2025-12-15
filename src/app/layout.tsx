import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry";
import { AccessProvider } from "@/components/AccessProvider";
import "./globals.css";
import "./fonts.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whop Bounty - Report Scammers",
  description: "Report scammers and help keep the community safe",
  icons: {
    icon: '/whop-assets/favicons/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeRegistry>
          <AccessProvider>
            {children}
          </AccessProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
