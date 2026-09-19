import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "MJLI Student Attendance CRM | Super Admin & Teacher Portal",
  description:
    "Clean, minimalist, production-grade CRM for student attendance, teacher tracking, and interview/visa management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAFC] text-slate-800 min-h-screen antialiased selection:bg-[#F26622]/20 selection:text-[#F26622]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
