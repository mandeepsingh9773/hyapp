import type { Metadata } from "next";
import { StoreProvider } from "./StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HyApp Chat",
  description: "A WhatsApp-like chat application demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-[100dvh] flex-col overflow-hidden" style={{ height: "var(--app-height, 100dvh)" }}>
        <StoreProvider>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </StoreProvider>
      </body>
    </html>
  );
}
