import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EduSense - Smart Study Planner",
  description: "AI-powered student productivity platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-[family-name:var(--font-poppins)]`}>
        <SearchProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SearchProvider>
      </body>
    </html>
  );
}