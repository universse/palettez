import util from 'node:util'
import bodyParser from 'body-parser'
import cookie from 'cookie'
import type { GetServerSideProps } from 'next'
import { ThemeSelect } from '../../theme-select'

const parseBody = util.promisify(bodyParser.urlencoded({ extended: false }))

export const getServerSideProps = (async ({ req, res }) => {
	let themes: {
		colorScheme: string
		contrast: string
	}

	try {
		themes = JSON.parse(req.cookies.palettez || 'null') || {
			colorScheme: 'system',
			contrast: 'standard',
		}
	} catch {
		themes = {
			colorScheme: 'system',
			contrast: 'standard',
		}
	}

	if (req.method === 'POST') {
		await parseBody(req, res)

		themes = req.body

		res.setHeader(
			'Set-Cookie',
			cookie.serialize('palettez', JSON.stringify(themes), {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
			}),
		)
	}

	return { props: { themes } }
}) satisfies GetServerSideProps<{ themes: Record<string, string> }>

export default function Page({ themes }: { themes: Record<string, string> }) {
	return (
		<main
			className='theme'
			data-color-scheme={themes.colorScheme}
			data-contrast={themes.contrast}
		>
			<h1>Client & server persistence</h1>
			<p>
				- User's preferred themes are persisted in cookies on the server and in
				memory on the client.
				<br />- Theme change can be previewed but is only saved upon form
				submission.
			</p>
			<form method='post'>
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
	)
}
