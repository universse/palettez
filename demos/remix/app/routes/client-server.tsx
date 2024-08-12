import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import {
	Links,
	Meta,
	Scripts,
	useActionData,
	useLoaderData,
} from '@remix-run/react'
import { ThemeSelect } from 'app/theme-select'
import { getThemeSession } from 'app/theme.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const themeSession = await getThemeSession(request)

	let themes: {
		colorScheme: string
		contrast: string
	}

	try {
		themes = themeSession.getTheme() || {
			colorScheme: 'system',
			contrast: 'standard',
		}
	} catch {
		themes = {
			colorScheme: 'system',
			contrast: 'standard',
		}
	}

	return json({ themes })
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const themeSession = await getThemeSession(request)
	const formData = await request.formData()

	const themes = {
		colorScheme: formData.get('colorScheme') as string,
		contrast: formData.get('contrast') as string,
	}

	themeSession.setTheme(themes)

	return json(
		{ themes },
		{ headers: { 'Set-Cookie': await themeSession.commit() } },
	)
}

export default function Page() {
	const { themes: loaderThemes } = useLoaderData<typeof loader>()
	const { themes: actionThemes } = useActionData<typeof action>() || {}
	const themes = actionThemes || loaderThemes

	return (
		<html
			lang='en'
			data-color-scheme={themes.colorScheme}
			data-contrast={themes.contrast}
		>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body>
				<main>
					<h1>Client only persistence</h1>
					<p>
						- User's preferred themes are persisted in cookies on the server and
						in memory on the client.
						<br />- Theme change can be previewed but is only saved upon form
						submission.
					</p>
					<form method='post'>
						<ThemeSelect persistedServerThemes={themes} />
						<button type='submit'>Save</button>
					</form>
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
