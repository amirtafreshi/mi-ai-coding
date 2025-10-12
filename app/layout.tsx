import type { Metadata } from 'next'
import { RefineProvider } from '@/providers/refine-provider'
import { ErrorSuppression } from '@/components/ErrorSuppression'
import './globals.css'

export const metadata: Metadata = {
  title: 'MI AI Coding Platform',
  description: 'Production-ready AI Coding Platform with dual VNC displays, file management, and real-time agent activity logging',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        <style dangerouslySetInnerHTML={{__html: `
          html, body {
            overflow-x: hidden;
            width: 100vw;
            position: relative;
          }
          @media (max-width: 1024px) {
            html {
              font-size: 14px;
            }
          }
          @media (max-width: 768px) {
            html {
              font-size: 13px;
            }
          }
        `}} />
      </head>
      <body className="antialiased">
        <ErrorSuppression />
        <RefineProvider>{children}</RefineProvider>
      </body>
    </html>
  )
}
