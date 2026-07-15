import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionActivity } from "@/features/auth/session-activity";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Atlas",
  description: "All About Kitchens & Bathrooms file pipeline prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = window.localStorage.getItem("atlas-theme") || "dark";
                document.documentElement.classList.toggle("dark", theme !== "light");
              } catch (_) {
                document.documentElement.classList.add("dark");
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionActivity />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
