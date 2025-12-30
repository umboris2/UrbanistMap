import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Urbanist Map',
  description: 'Track your favorite cities and locations on an interactive map',
  manifest: '/manifest.json',
  themeColor: '#4CAF50',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Urbanist Map',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4CAF50" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Urbanist Map" />
        <style>{`
          * {
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}>
        {children}
      </body>
    </html>
  );
}

