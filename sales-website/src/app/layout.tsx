import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UNON Solutions - Modular Transportation Management SaaS',
  description: 'Transform your fleet operations with our flexible, subscription-based transportation management platform. Pay only for the modules you need.',
  keywords: 'transportation management, fleet management, dispatch software, SaaS, modular platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
