import type { Metadata, Viewport } from 'next'
import '../style.css'
import type * as React from 'react'

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
	return (
		<html lang='en'>
			<body>{children}</body>
		</html>
	)
}
