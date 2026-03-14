import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ReactNode } from 'react';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Video Production System',
  description: 'Automated video production management system',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${roboto.className} antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
