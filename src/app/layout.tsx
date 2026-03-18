import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bootle Social Studio",
  description: "AI-powered social media publishing for Bootle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
