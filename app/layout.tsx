import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import Navbar from "@/components/navbar";
import { BlockchainProvider } from "@/lib/blockchain/BlockchainContext";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Werity",
  description: "A decentralized social media platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <html className="dark" lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-theme-background`}
      >
        <BlockchainProvider>
          <Providers>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar />
              <div className="w-full overflow-auto">
                <Navbar />
                <main>{children}</main>
              </div>
            </SidebarProvider>
          </Providers>
        </BlockchainProvider>
      </body>
    </html>
  );
}
