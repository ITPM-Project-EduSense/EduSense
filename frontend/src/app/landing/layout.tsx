import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduSense - Smart Student Productivity Platform",
  description: "AI-powered student productivity and campus engagement platform by EduSense Team",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ marginLeft: 0 }}>
      {children}
    </div>
  );
}