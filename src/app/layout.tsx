import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ClerkEnabled } from "@/features/auth/sign-out-button";
import { isDevAuthBypassActive } from "@/services/auth/dev-bypass";
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
  const clerkEnabled = !isDevAuthBypassActive();
  const page = (
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
        <ClerkEnabled value={clerkEnabled}>{children}</ClerkEnabled>
        <Toaster />
      </body>
    </html>
  );

  // The dev bypass runs without Clerk keys, so it skips the provider.
  return clerkEnabled ? <ClerkProvider>{page}</ClerkProvider> : page;
}
