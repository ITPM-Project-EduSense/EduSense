import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "EduSense - Smart Study Planner",
  description: "AI-powered student productivity and campus engagement platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} font-[family-name:var(--font-dm-sans)]`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[260px] min-h-screen">
            <Topbar />
            <div className="px-8 py-7 max-w-[1360px]">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}