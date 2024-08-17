import { createCookieSessionStorage } from '@vercel/remix'

const themeStorage1 = createCookieSessionStorage({
	cookie: {
		path: '/multi-store-with-server-persistence',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: 600,
	},
})

const themeStorage2 = createCookieSessionStorage({
	cookie: {
		path: '/no-hydration-mismatch',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: 600,
	},
})

async function getThemeSession1(request: Request) {
	const session = await themeStorage1.getSession(request.headers.get('Cookie'))
	return {
		getTheme: (key: string) => {
			return session.get(key)
		},
		setTheme: (key: string, theme: Record<string, string>) =>
			session.set(key, theme),
		commit: () => themeStorage1.commitSession(session),
	}
}

async function getThemeSession2(request: Request) {
	const session = await themeStorage2.getSession(request.headers.get('Cookie'))
	return {
		getTheme: (key: string) => {
			return session.get(key)
		},
		setTheme: (key: string, theme: Record<string, string>) =>
			session.set(key, theme),
		commit: () => themeStorage2.commitSession(session),
	}
}

export { getThemeSession1, getThemeSession2 }
