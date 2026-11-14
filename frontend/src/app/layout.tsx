import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "AutoSocial Studio - Hệ Thống Tự Động Hóa Mạng Xã Hội Y Tế",
  description:
    "Dashboard quản trị tự động hóa sản xuất nội dung mạng xã hội với n8n, Ollama AI và NestJS API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="autosocial-theme">
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
