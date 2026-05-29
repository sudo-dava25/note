import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catatan Pribadi',
  description: 'Ruang pribadimu untuk mencatat segala hal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
