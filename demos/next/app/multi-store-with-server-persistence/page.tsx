import { cookies } from 'next/headers'
import { type ThemeConfig, getThemesAndOptions } from 'palettez'
import { createStoresScript } from '../../lib/multi-store-scripts'
import { ThemeSelect } from '../../lib/sync-theme-select'
import { ThemeWrapper } from '../../lib/sync-theme-wrapper'

const config = {
	colorScheme: [
		{
			value: 'system',
			media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
		},
		'light',
		'dark',
	],
	contrast: ['standard', 'high'],
} as const satisfies ThemeConfig

const themeStoreKeys = ['app', 'section1', 'section2']

const themesAndOptions = getThemesAndOptions(config)

const defaultTheme = {
	colorScheme: 'system',
	contrast: 'standard',
}

export default async function Page() {
	const initialThemesByKey = themeStoreKeys.reduce((acc, key) => {
		try {
			acc[key] = JSON.parse(cookies().get(key)?.value!)
		} catch {
			acc[key] = defaultTheme
		}
		return acc
	}, {})

	const scriptArgs = JSON.stringify({ initialThemesByKey, config })

	async function updateTheme(formData: FormData) {
		'use server'

		cookies().set(
			formData.get('key') as string,
			JSON.stringify({
				colorScheme: formData.get('colorScheme') as string,
				contrast: formData.get('contrast') as string,
			}),
			{
				path: '/multi-store-with-server-persistence',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 600,
			},
		)
	}

	const script = `(${createStoresScript.toString()})(${scriptArgs})`

	return (
		<>
			<script src='https://unpkg.com/palettez' />
			<script dangerouslySetInnerHTML={{ __html: script }} />
			<ThemeWrapper storeKey='app'>
				<main>
					<h1>Multi-store with server persistence</h1>
					<p>
						- User's preferred themes are persisted in cookies on the server and
						in memory on the client
						<br />- Theme selection is only saved upon form submission
						<br />- To avoid the flashing of wrong theme value, consider putting
						it in a dropdown menu, or rendering multiple sets and use CSS to
						show the correct one based on the theme wrapper's attributes
					</p>
					<form autoComplete='off' action={updateTheme}>
						<ThemeSelect storeKey='app' themesAndOptions={themesAndOptions} />
						<button type='submit'>Save</button>
					</form>
					<br />
					<p>These 2 sections read from the same theme store</p>
					<div style={{ display: 'flex', gap: 16 }}>
						<ThemeWrapper storeKey='section1'>
							<form autoComplete='off' action={updateTheme}>
								<ThemeSelect
									storeKey='section1'
									themesAndOptions={themesAndOptions}
								/>
								<button type='submit'>Save</button>
							</form>
						</ThemeWrapper>
						<ThemeWrapper storeKey='section1'>
							<form autoComplete='off' action={updateTheme}>
								<ThemeSelect
									storeKey='section1'
									themesAndOptions={themesAndOptions}
								/>
								<button type='submit'>Save</button>
							</form>
						</ThemeWrapper>
					</div>
					<br />
					<ThemeWrapper storeKey='section2'>
						<form autoComplete='off' action={updateTheme}>
							<ThemeSelect
								storeKey='section2'
								themesAndOptions={themesAndOptions}
							/>
							<button type='submit'>Save</button>
						</form>
					</ThemeWrapper>

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
