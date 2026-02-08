import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/frontend/components/providers/providers";
import "@/frontend/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EstateFlow AI",
  description: "AI-powered real estate platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
