import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "Moyo Culture Congo | Digitalisation Musique, Billetterie & Arts",
  description: "Plateforme digitale tout-en-un pour les artistes musiciens, peintres de Poto-Poto, promoteurs et fans au Congo-Brazzaville. Distribution internationale, billetterie QR Code, galerie d'art et paiements MTN MoMo & Airtel Money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <div className="flex flex-1">
              <DashboardSidebar />
              <main className="flex-1 w-full min-w-0">
                {children}
              </main>
            </div>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
