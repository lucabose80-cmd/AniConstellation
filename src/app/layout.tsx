import type { Metadata } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";

export const metadata: Metadata = {
  title: "AniConstellation",
  description: "Advanced Manga and Anime tracking PWA",
  manifest: "/manifest.json",
  themeColor: "#1C1B1F",
  viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
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
