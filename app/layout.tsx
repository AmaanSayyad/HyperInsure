import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { StacksProvider } from '@/lib/stacks-provider'
import { Header } from '@/components/header'
import { FooterSection } from '@/components/footer-section'

export const metadata: Metadata = {
  title: 'HyperInsure - Trustless Bitcoin Transaction Insurance',
  description: 'Decentralized insurance for Bitcoin transaction delays using cryptographic proofs',
  generator: 'HyperInsure',
  keywords: ['Bitcoin', 'Insurance', 'DeFi', 'Stacks', 'Blockchain', 'Trustless'],
  authors: [{ name: 'HyperInsure Team' }],
  openGraph: {
    title: 'HyperInsure - Trustless Bitcoin Transaction Insurance',
    description: 'Decentralized insurance for Bitcoin transaction delays using cryptographic proofs',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body suppressHydrationWarning>
        <StacksProvider>
          <Header />
          {children}
          <FooterSection />
          <Analytics />
          <Toaster 
            position="top-center" 
            richColors 
            toastOptions={{
              className: 'glass border border-white/10',
              style: {
                background: 'hsl(var(--card) / 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--border))',
              }
            }}
          />
        </StacksProvider>
      </body>
    </html>
  )
}
