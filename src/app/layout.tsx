import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";

export const metadata: Metadata = {
  title: "AniConstellation",
  description: "Advanced Manga and Anime tracking PWA",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1C1B1F",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
