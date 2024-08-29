import {
	Links,
	Meta,
	Scripts,
	useActionData,
	useLoaderData,
} from '@remix-run/react'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@vercel/remix'
import { type ThemeConfig, getThemesAndOptions } from 'palettez'
import palettez from 'palettez/raw?raw'
import { createStoresScript } from '../multi-store-scripts'
import { ThemeSelect } from '../sync-theme-select'
import { ThemeWrapper } from '../sync-theme-wrapper'
import { getThemeSession1 } from '../theme.server'

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const themeSession = await getThemeSession1(request)

	const initialThemesByKey = themeStoreKeys.reduce((acc, key) => {
		acc[key] = themeSession.getTheme(key) || defaultTheme
		return acc
	}, {})

	return json({ initialThemesByKey })
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const themeSession = await getThemeSession1(request)
	const formData = await request.formData()

	const key = formData.get('key') as string

	const themes = {
		colorScheme: formData.get('colorScheme') as string,
		contrast: formData.get('contrast') as string,
	}

	themeSession.setTheme(key, themes)

	return json(
		{ initialThemesByKey: { [key]: themes } },
		{ headers: { 'Set-Cookie': await themeSession.commit() } },
	)
}

export default function Page() {
	const { initialThemesByKey: loaderIitialThemesByKey } =
		useLoaderData<typeof loader>()
	const { initialThemesByKey: actionInitialThemesByKey } =
		useActionData<typeof action>() || {}

	const initialThemesByKey = {
		...loaderIitialThemesByKey,
		...actionInitialThemesByKey,
	}

	const scriptArgs = JSON.stringify({ initialThemesByKey, config })
	const script = `${palettez}
(${createStoresScript.toString()})(${scriptArgs})`

	return (
		<html lang='en'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body>
				<script dangerouslySetInnerHTML={{ __html: script }} />
				<ThemeWrapper storeKey='app'>
					<main>
						<h1>Multi-store with server persistence</h1>
						<p>
							- User's preferred themes are persisted in cookies on the server
							and in memory on the client
							<br />- Theme selection is only saved upon form submission
							<br />- To avoid the flashing of wrong theme value, consider
							putting it in a dropdown menu, or rendering multiple sets and use
							CSS to show the correct one based on the theme wrapper's
							attributes
						</p>
						<form autoComplete='off' method='post'>
							<ThemeSelect storeKey='app' themesAndOptions={themesAndOptions} />
							<button type='submit'>Save</button>
						</form>
						<br />
						<p>These 2 sections read from the same theme store</p>
						<div style={{ display: 'flex', gap: 16 }}>
							<ThemeWrapper storeKey='section1'>
								<form autoComplete='off' method='post'>
									<ThemeSelect
										storeKey='section1'
										themesAndOptions={themesAndOptions}
									/>
									<button type='submit'>Save</button>
								</form>
							</ThemeWrapper>
							<ThemeWrapper storeKey='section1'>
								<form autoComplete='off' method='post'>
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
							<form autoComplete='off' method='post'>
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
