import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { fetchComptes, fetchNavOrder } from "@/lib/comptes";
import { getActiveCompteId, setActiveCompteId, DEFAULT_COMPTE_ID } from "@/lib/active-compte";
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let comptes: Awaited<ReturnType<typeof fetchComptes>> = [];
  let activeCompteId = DEFAULT_COMPTE_ID;
  let navOrder: string[] = [];

  try {
    [comptes, navOrder] = await Promise.all([fetchComptes(), fetchNavOrder()]);
    activeCompteId = await getActiveCompteId();

    // Vérifier que le compte actif existe toujours — persister la correction dans le cookie
    if (comptes.length > 0 && !comptes.find((c) => c.id === activeCompteId)) {
      activeCompteId = comptes[0].id;
      await setActiveCompteId(activeCompteId);
    }
  } catch {
    // Supabase may not be configured during build
  }

  return (
    <html lang="fr">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background`}
      >
        <Navbar comptes={comptes} activeCompteId={activeCompteId} navOrder={navOrder} />
        {/* Décalage du contenu à droite du sidebar sur desktop, padding bas sur mobile */}
        <div className="md:ml-56 pb-20 md:pb-0">
          {children}
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
