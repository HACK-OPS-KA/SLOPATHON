import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Screamy Bird — Vocal Flight System",
  description:
    "A gloriously unnecessary voice-controlled arcade game. Scream above the line to make the bird flap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
