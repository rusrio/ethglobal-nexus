import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "ETHGlobal Hackathon - Get Your Ticket",
  description: "Join the world's premier Ethereum hackathon. Buy your ticket with USDC across any chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 min-h-screen">
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
