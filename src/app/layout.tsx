import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";

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
    default: "AutoDoc 智驾医生 — AI 汽车预诊断",
    template: "%s | AutoDoc 智驾医生",
  },
  description:
    "AI 自助预诊断工具，多轮对话分析车辆故障，给出维修方案和参考价格，附带防被宰提醒，让您修车不踩坑。",
  keywords: [
    "汽车诊断",
    "AI修车",
    "车辆故障",
    "修车防被宰",
    "二手车评估",
    "OBD故障码",
    "维修报价",
  ],
  authors: [{ name: "AutoDoc Team" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "AutoDoc 智驾医生",
    title: "AutoDoc 智驾医生 — AI 汽车预诊断",
    description: "AI 自助预诊断工具，多轮对话分析车辆故障，让您修车不踩坑",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
