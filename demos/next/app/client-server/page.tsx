import { cookies } from 'next/headers'

import { ThemeSelect } from '../../theme-select'

export default async function Page() {
	let themes: {
		colorScheme: string
		contrast: string
	}

	try {
		themes = JSON.parse(cookies().get('palettez')?.value || 'null') || {
			colorScheme: 'system',
			contrast: 'standard',
		}
	} catch {
		themes = {
			colorScheme: 'system',
			contrast: 'standard',
		}
	}

	async function updateTheme(formData: FormData) {
		'use server'

		cookies().set(
			'palettez',
			JSON.stringify({
				colorScheme: formData.get('colorScheme') as string,
				contrast: formData.get('contrast') as string,
			}),
			{
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
			},
		)
	}

	return (
		<html
			lang='en'
			data-color-scheme={themes.colorScheme}
			data-contrast={themes.contrast}
		>
			<body>
				<main>
					<h1>Client & server persistence</h1>
					<p>
						- User's preferred themes are persisted in cookies on the server and
						in memory on the client.
						<br />- Theme change can be previewed but is only saved upon form
						submission.
					</p>
					<form action={updateTheme}>
						<ThemeSelect persistedServerThemes={themes} />
						<button type='submit'>Save</button>
					</form>
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
			</body>
		</html>
	)
}
