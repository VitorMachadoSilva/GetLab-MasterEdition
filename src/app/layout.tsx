import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProviderWrapper } from '@/components/SessionProvider';
import { ToastManager } from '@/components/ToastManager';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema de Reservas - FMPSC',
  description: 'Sistema de gestão de reservas de salas e laboratórios',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <ToastManager />
          <Navbar />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#fff',
                color: '#1a5490',
                border: '2px solid #1a5490',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: '500',
              },
              success: {
                duration: 5000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
            containerStyle={{
              zIndex: 9999,
            }}
          />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
