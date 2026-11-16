import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/shell";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const latin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduFlow Agent | وكيل متابعة الواجبات",
  description:
    "A homework follow-up agent for private schools and training centers in the UAE and Saudi Arabia. It plans the day, scores risk, and drafts messages for the teacher to approve.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${arabic.variable} ${latin.variable} h-full antialiased`}>
      <body className="min-h-full bg-sand text-ink">
        <Script id="eduflow-locale" strategy="beforeInteractive">
          {`try{var l=localStorage.getItem("eduflow-locale");if(l==="en"){document.documentElement.lang="en";document.documentElement.dir="ltr";}}catch(e){}`}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
