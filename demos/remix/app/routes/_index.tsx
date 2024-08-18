import { Links, Meta, Scripts } from '@remix-run/react'
import { getThemesAndOptions } from 'palettez'
import palettez from 'palettez/raw?raw'
import { singleStoreScript } from '../single-store-script'
import { ThemeSelect } from '../sync-theme-select'
import { ThemeWrapper } from '../sync-theme-wrapper'

const config = {
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

const themesAndOptions = getThemesAndOptions(config)

const storeKey = 'app'

const scriptArgs = JSON.stringify({ key: storeKey, config })

const script = `${palettez}
(${singleStoreScript.toString()})(${scriptArgs})`

export default function Page() {
	return (
		<html lang='en'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
				<script dangerouslySetInnerHTML={{ __html: script }} />
			</head>
			<body>
				<ThemeWrapper storeKey={storeKey}>
					<main>
						<h1>Basic usage</h1>
						<p>
							- User's preferred themes are persisted in localStorage
							<br />- Theme change are synced with other windows and tabs via
							storage event
							<br />- To avoid the flashing of wrong theme value, consider
							putting it in a dropdown menu, or rendering multiple sets and use
							CSS to show the correct one based on the theme wrapper's
							attributes
						</p>
						<ThemeSelect
							storeKey={storeKey}
							themesAndOptions={themesAndOptions}
						/>

						<br />
						<p>
							<b>Demo links</b>
						</p>
						<a href='/'>Basic usage &rarr;</a>
						<br />
						<a href='/multi-store-with-server-persistence'>
							Multi-store with server persistence &rarr;
						</a>
						<br />
						<a href='/no-hydration-mismatch'>
							Multi-store with no hydration mismatch &rarr;
						</a>
					</main>
				</ThemeWrapper>
				<Scripts />
			</body>
		</html>
	)
}
