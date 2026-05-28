import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Neighborhood Cafe",
  description: "A public cafe-style board with posts and comments.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
