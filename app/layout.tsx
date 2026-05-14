import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
})

export const metadata: Metadata = {
  title: 'Agenda Aqui | Ticy Martins',
  description: 'PMU, Estética e Cosmetologia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}