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
import { getThemeAndOptions } from 'palettez'
import { ThemeSelect } from '../theme-select'
import { ThemeStoreProvider } from '../theme-store-provider'
import { ThemeWrapper } from '../theme-wrapper'
import { getThemeSession2 } from '../theme.server'

const config = {
	colorScheme: {
		label: 'Color scheme',
		options: {
			// system: {
			// 	value: 'System',
			// 	isDefault: true,
			// 	media: {
			// 		query: '(prefers-color-scheme: dark)',
			// 		ifMatch: 'dark',
			// 		ifNotMatch: 'light',
			// 	},
			// },
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

const configsByKey = {
	app: config,
	section1: config,
	section2: config,
}

const themeStoreKeys = Object.keys(configsByKey)

const themesAndOptions = getThemeAndOptions(config)

const defaultTheme = {
	colorScheme: 'light',
	contrast: 'standard',
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const themeSession = await getThemeSession2(request)

	const initialThemesByKey = themeStoreKeys.reduce((acc, key) => {
		acc[key] = themeSession.getTheme(key) || defaultTheme
		return acc
	}, {})

	return json({ initialThemesByKey })
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const themeSession = await getThemeSession2(request)
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

	return (
		<html lang='en'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body>
				<ThemeStoreProvider
					initialThemesByKey={initialThemesByKey}
					configsByKey={configsByKey}
				>
					<ThemeWrapper storeKey='app'>
						<main>
							<h1>Multi-store with no hydration mismatch</h1>
							<p>
								- User's preferred themes are persisted in cookies on the server
								and in memory on the client
								<br />- No system theme option and no client-side persistence,
								hence no sync script required and no hydration mismatch
								<br />- Theme selection is only saved upon form submission
							</p>
							<form autoComplete='off' method='post'>
								<ThemeSelect
									storeKey='app'
									themesAndOptions={themesAndOptions}
								/>
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
				</ThemeStoreProvider>
				<Scripts />
			</body>
		</html>
	)
}
