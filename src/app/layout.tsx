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
  title: "AgentCraft - A2A 技能交易与创新平台",
  description: "基于美帝奇效应的跨域技能组合系统，让 AI Agent 通过买卖技能、租赁能力、跨域组合产生新技能",
};

import { Toaster } from 'sonner'
import { DigitalTwinPanel } from '@/components/digital-twin-panel'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <DigitalTwinPanel />
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
