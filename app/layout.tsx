import type { Metadata } from 'next'
import { Syne, Space_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '700', '800'], display: 'swap' })
const spaceMono = Space_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '700'], display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Analisador de E-commerce — Diagnóstico Gratuito',
  description: 'Descubra o que está travando as vendas do seu e-commerce. Análise gratuita em 30 segundos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${spaceMono.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
