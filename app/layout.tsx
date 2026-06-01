import type { Metadata } from 'next'

import {
  Geist,
  Geist_Mono
} from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {

  title: 'Půjčovna strojů',

  description:
    'Profesionální systém půjčovny strojů',

  manifest: '/manifest.json',

  themeColor: '#000000',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Půjčovna'
  },

  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  return (

    <html
      lang="cs"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        h-full
        antialiased
      `}
    >

      <body className="min-h-full flex flex-col bg-gray-100">

        {children}

      </body>

    </html>
  )
}