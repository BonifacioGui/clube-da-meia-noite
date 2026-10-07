import type { Metadata, Viewport } from "next";
import { PwaController } from "@/components/pwa/pwa-controller";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clube da Meia-Noite",
  description: "Um clube de leitura gamificado, cooperativo e feito para dois.",
  applicationName: "Clube da Meia-Noite",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meia-Noite",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03060c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}<PwaController /></body>
    </html>
  );
}
