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
  title: "CHRIST Student Session",
  description: "CHRIST Classroom Engagement Platform - Student Session",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        <div className="max-w-md mx-auto min-h-screen flex flex-col">
          <header className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-sm md:text-base text-slate-900 truncate pr-2">CHRIST Classroom Engagement - Student Session</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500" title="Connected"></div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
