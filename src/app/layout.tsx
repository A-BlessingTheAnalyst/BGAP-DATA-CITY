import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BGAP Data City — 3D Analytics Adventure',
  description:
    'Walk around a stylized 3D metropolis, investigate real business data, run SQL in a browser workstation, and solve open-world analytics missions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bgap-dark text-bgap-text min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
