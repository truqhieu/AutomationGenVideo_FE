import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Video Production System',
  description: 'Automated video production management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
