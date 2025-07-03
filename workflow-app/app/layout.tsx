import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '../styles/fullcalendar-daygrid.css';
import '../styles/fullcalendar-timegrid.css';


const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "WorkFlow App",
  description: "Transform your workflow and boost productivity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
