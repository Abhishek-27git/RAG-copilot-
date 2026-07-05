import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "DD Copilot — AI Due Diligence Assistant",
  description:
    "Enterprise-grade AI Due Diligence Copilot. Upload deal documents and get answers grounded in your data, with source citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${geist.variable} font-sans`}>{children}</body>
    </html>
  );
}
