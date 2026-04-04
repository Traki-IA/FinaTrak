import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinaTrak",
  description: "Suivi financier personnel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinaTrak",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background`}
      >
        {children}

        {/* Overlay paysage — bloque l'affichage sur téléphones en landscape */}
        <div className="landscape-lock" aria-hidden="true">
          <div className="landscape-lock-icon" />
          <p>Tournez votre appareil en portrait</p>
        </div>

        <Toaster
          position="bottom-center"
          swipeDirections={["bottom", "left", "right"]}
          toastOptions={{
            style: {
              background: "var(--bg-toast)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text)",
            },
          }}
        />
      </body>
    </html>
  );
}
