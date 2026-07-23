import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lab.janpfrenger.com/silence-enforcer/"),
  title: "Noise Enforcement Officer",
  description:
    "An absurd local-only PWA that detects unacceptable silence and responds with a short synthesized noise citation.",
  applicationName: "Noise Enforcement Officer",
  manifest: "./manifest.webmanifest",
  icons: {
    icon: [
      { url: "./favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "./android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "./apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    title: "Noise Enforcement Officer",
    description:
      "Silence is prohibited. A local-only Slopathon experiment by Jan Pfrenger.",
    url: "https://lab.janpfrenger.com/silence-enforcer/",
    siteName: "Jan Pfrenger's Lab",
    images: [
      {
        url: "./og.png",
        width: 1731,
        height: 909,
        alt: "Noise Enforcement Officer — silence is prohibited",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noise Enforcement Officer",
    description:
      "Silence is prohibited. A local-only Slopathon experiment by Jan Pfrenger.",
    images: ["./og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0c0a",
  colorScheme: "dark",
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
