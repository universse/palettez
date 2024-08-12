import type { Metadata, Viewport } from 'next'
import '../style.css'

export const metadata: Metadata = {
	title: 'Demo with Next',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return children
}
