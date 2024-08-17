import util from 'node:util'
import bodyParser from 'body-parser'
import cookie from 'cookie'
import { getThemeAndOptions } from 'palettez'
import { createStoresScript } from '../../lib/multi-store-scripts'
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

const themeStoreKeys = ['app', 'section1', 'section2']

const themesAndOptions = getThemeAndOptions(config)

const defaultTheme = {
	colorScheme: 'system',
	contrast: 'standard',
}

export const getServerSideProps = async ({ req, res }) => {
	const initialThemesByKey = themeStoreKeys.reduce((acc, key) => {
		try {
			acc[key] = JSON.parse(req.cookies[key])
		} catch {
			acc[key] = defaultTheme
		}
		return acc
	}, {})

	if (req.method === 'POST') {
		const parseBody = util.promisify(bodyParser.urlencoded({ extended: false }))
		await parseBody(req, res)

		const key = req.body.key[0]

		initialThemesByKey[key] = {
			colorScheme: req.body.colorScheme,
			contrast: req.body.contrast,
		}

		res.setHeader(
			'Set-Cookie',
			cookie.serialize(key, JSON.stringify(initialThemesByKey[key]), {
				path: '/pages/multi-store-with-server-persistence',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 600,
			}),
		)
	}

	return { props: { initialThemesByKey } }
}

export default function Page({ initialThemesByKey }) {
	const scriptArgs = JSON.stringify({ initialThemesByKey, config })

	return (
		<>
			<script src='https://unpkg.com/palettez' />
			<script
				dangerouslySetInnerHTML={{
					__html: `(${createStoresScript.toString()})(${scriptArgs})`,
				}}
				suppressHydrationWarning // hydration mismatch because server and hydration stringify function differently
			/>
			<ThemeWrapper storeKey='app'>
				<main>
					<h1>Multi-store with server persistence</h1>
					<p>
						- User's preferred themes are persisted in cookies on the server and
						in memory on the client
						<br />- Theme selection is only saved upon form submission
					</p>
					<form method='post'>
						<ThemeSelect storeKey='app' themesAndOptions={themesAndOptions} />
						<button type='submit'>Save</button>
					</form>
					<br />
					<p>These 2 sections read from the same theme store</p>
					<div style={{ display: 'flex', gap: 16 }}>
						<ThemeWrapper storeKey='section1'>
							<form method='post'>
								<ThemeSelect
									storeKey='section1'
									themesAndOptions={themesAndOptions}
								/>
								<button type='submit'>Save</button>
							</form>
						</ThemeWrapper>
						<ThemeWrapper storeKey='section1'>
							<form method='post'>
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
						<form method='post'>
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
