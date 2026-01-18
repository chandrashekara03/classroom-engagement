import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Classroom Engagement Platform",
  description: "Real-time classroom engagement platform",
};

import { NavigationProvider } from "@/lib/navigation-context";
import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 min-h-screen`}
      >
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </body>
    </html>
  );
}
