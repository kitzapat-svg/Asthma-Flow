import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider"; // 1. Import เข้ามา
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asthma Flow - ระบบจัดการข้อมูลผู้ป่วยหอบหืด",
  description: "ระบบจัดการข้อมูลผู้ป่วยโรคหอบหืดแบบครบวงจร ติดตาม PEFR ประเมินเทคนิคการใช้ยาพ่น และวิเคราะห์แนวโน้มสุขภาพ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. ครอบ AuthProvider ไว้ชั้นนอกสุด (หรือใน body) */}
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
