import { Links, Meta, Scripts } from '@remix-run/react'
import palettez from 'palettez/raw?raw'
import * as React from 'react'
import { ClientThemeSelect } from '../client-theme-select'

export default function Page() {
	const [isMounted, setIsMounted] = React.useState(false)

	React.useEffect(() => {
		setIsMounted(true)
	}, [])

	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
				<script
					dangerouslySetInnerHTML={{
						__html: `${palettez}
;(async () => {
	const p = window.palettez.create({
		config: {
			colorScheme: {
				label: 'Color scheme',
				options: {
					system: {
						value: 'System',
						isDefault: true,
						media: {
							query: '(prefers-color-scheme: dark)',
							ifMatch: 'dark',
							ifNotMatch: 'light',
						},
					},
					light: { value: 'Light' },
					dark: { value: 'Dark' },
				},
			},
			contrast: {
				label: 'Contrast',
				options: {
					standard: { value: 'Standard', isDefault: true },
					high: { value: 'High' },
				},
			},
		}
	})

	p.subscribe((_, resolvedThemes) => {
		for (const [theme, optionKey] of Object.entries(resolvedThemes)) {
			document.documentElement.dataset[theme] = optionKey
		}
	})

	await p.restore()

	p.sync()
})()`,
					}}
				/>
			</head>
			<body>
				<main>
					<h1>Client only persistence</h1>
					<p>
						- User's preferred themes are persisted in localStorage.
						<br />- Theme change are synced with other windows and tabs via
						storage event.
					</p>
					{isMounted && <ClientThemeSelect />}
					<br />
					<a href='/'>Client only persistence &rarr;</a>
					<br />
					<a href='/client-server'>Client & server persistence &rarr;</a>
				</main>
				<Scripts />
			</body>
		</html>
	)
}
