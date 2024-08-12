import { createCookieSessionStorage } from '@remix-run/node'

const themeStorage = createCookieSessionStorage({
	cookie: {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
	},
})

async function getThemeSession(request: Request) {
	const session = await themeStorage.getSession(request.headers.get('Cookie'))
	return {
		getTheme: () => {
			return session.get('theme')
		},
		setTheme: (theme: Record<string, string>) => session.set('theme', theme),
		commit: () => themeStorage.commitSession(session),
	}
}

export { getThemeSession }
