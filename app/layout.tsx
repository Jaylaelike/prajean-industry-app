import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prajeans - Thailand Environmental Complaints",
  description: "Citizens voice platform for environmental complaints in Thailand",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Add Longdo Map API key to window
              window.LONGDO_API_KEY = process.env.NEXT_PUBLIC_LONGDO_API_KEY || 'demo';
            `,
          }}
        />
      </body>
    </html>
  )
}
