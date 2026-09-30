import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clube da Meia-Noite",
  description: "Um clube de leitura gamificado, cooperativo e feito para dois.",
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
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
