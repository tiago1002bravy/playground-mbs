import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playground - Teste de Agentes IA",
  description: "Playground para testar e melhorar prompts de agentes",
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

