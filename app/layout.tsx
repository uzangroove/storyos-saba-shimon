import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryOS – סבא שמעון",
  description: "מרכז הפעלה דיגיטלי לשעות סיפור ופעילויות לילדים.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
