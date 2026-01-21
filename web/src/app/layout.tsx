import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme";
import { ResponsiveContainer, MIN_SUPPORTED_WIDTH } from "../components/layout";

export const metadata: Metadata = {
  title: "Claude's Notes",
  description: "Visual interface for Claude Code planning capabilities",
};

export const viewport: Viewport = {
  width: MIN_SUPPORTED_WIDTH,
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-auto">
        <ThemeProvider>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </ThemeProvider>
      </body>
    </html>
  );
}
