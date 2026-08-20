import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "FarmPulse — Smart Farming Dashboard",
  description: "Soil, weather, crop suitability, pest risk and market intelligence per field zone.",
  openGraph: {
    title: "FarmPulse — Smart Farming Dashboard",
    description: "Soil, weather, crop suitability, pest risk and market intelligence per field zone.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        {/* Runs before paint so a stored/system light preference doesn't flash dark first. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("farmpulse.theme");if(!t){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
