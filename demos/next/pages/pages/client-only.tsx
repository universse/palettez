import Head from 'next/head'
import * as React from 'react'
import { ClientThemeSelect } from '../../client-theme-select'

export default function Page() {
	const [isMounted, setIsMounted] = React.useState(false)

	React.useEffect(() => {
		setIsMounted(true)
	}, [])

	return (
		<>
			<Head>
				<script src='https://unpkg.com/palettez' />
				<script
					dangerouslySetInnerHTML={{
						__html: `;(async () => {
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
			</Head>
			<main>
				<h1>Client only persistence</h1>
				<p>
					- User's preferred themes are persisted in localStorage.
					<br />- Theme change are synced with other windows and tabs via
					storage event.
				</p>
				{isMounted && <ClientThemeSelect />}
				<p>
					<b>App Router</b>
				</p>
				<a href='/'>Client only persistence &rarr;</a>
				<br />
				<a href='/client-server'>Client & server persistence &rarr;</a>
				<br />
				<p>
					<b>Pages Router</b>
				</p>
				<a href='/pages/client-only'>Client only persistence &rarr;</a>
				<br />
				<a href='/pages/client-server'>Client & server persistence &rarr;</a>
			</main>
		</>
	)
}
