import { cookies } from 'next/headers'
import { type ThemeConfig, getThemesAndOptions } from 'palettez'
import { ThemeSelect } from '../../lib/theme-select'
import { ThemeStoreProvider } from '../../lib/theme-store-provider'
import { ThemeWrapper } from '../../lib/theme-wrapper'

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

const configsByKey = {
	app: config,
	section1: config,
	section2: config,
}

const themeStoreKeys = Object.keys(configsByKey)

const themesAndOptions = getThemesAndOptions(config)

const defaultTheme = {
	colorScheme: 'light',
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

	async function updateTheme(formData: FormData) {
		'use server'

		const key = formData.get('key') as string
		const themes = {
			colorScheme: formData.get('colorScheme') as string,
			contrast: formData.get('contrast') as string,
		}

		cookies().set(key, JSON.stringify(themes), {
			path: '/no-hydration-mismatch',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 600,
		})
	}

	return (
		<ThemeStoreProvider
			initialThemesByKey={initialThemesByKey}
			configsByKey={configsByKey}
		>
			<ThemeWrapper storeKey='app'>
				<main>
					<h1>Multi-store with no hydration mismatch</h1>
					<p>
						- User's preferred themes are persisted in cookies on the server and
						in memory on the client
						<br />- No system theme option and no client-side persistence, hence
						no sync script required and no hydration mismatch
						<br />- Theme selection is only saved upon form submission
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
		</ThemeStoreProvider>
	)
}
