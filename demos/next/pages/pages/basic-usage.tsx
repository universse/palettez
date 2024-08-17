import { getThemeAndOptions } from 'palettez'
import { singleStoreScript } from '../../lib/single-store-script'
import { ThemeSelect } from '../../lib/sync-theme-select'
import { ThemeWrapper } from '../../lib/sync-theme-wrapper'

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

const themesAndOptions = getThemeAndOptions(config)

const storeKey = 'app'

const scriptArgs = JSON.stringify({ key: storeKey, config })

export default function Page() {
	return (
		<>
			<script src='https://unpkg.com/palettez' />
			<ThemeWrapper storeKey={storeKey}>
				<script
					dangerouslySetInnerHTML={{
						__html: `(${singleStoreScript.toString()})(${scriptArgs})`,
					}}
				/>
				<main>
					<h1>Basic usage</h1>
					<p>
						- User's preferred themes are persisted in localStorage
						<br />- Theme change are synced with other windows and tabs via
						storage event
					</p>
					<ThemeSelect
						storeKey={storeKey}
						themesAndOptions={themesAndOptions}
					/>

					<br />
					<p>
						<b>Demo links</b>
					</p>
					<p>App Router</p>
					<a href='/'>Basic usage &rarr;</a>
					<br />
					<a href='/multi-store-with-server-persistence'>
						Multi-store with server persistence &rarr;
					</a>
					<br />
					<a href='/no-hydration-mismatch'>
						Multi-store with no hydration mismatch &rarr;
					</a>

					<br />
					<p>Pages Router</p>
					<a href='/pages/basic-usage'>Basic usage &rarr;</a>
					<br />
					<a href='/pages/multi-store-with-server-persistence'>
						Multi-store with server persistence &rarr;
					</a>
					<br />
					<a href='/pages/no-hydration-mismatch'>
						Multi-store with no hydration mismatch &rarr;
					</a>
				</main>
			</ThemeWrapper>
		</>
	)
}
