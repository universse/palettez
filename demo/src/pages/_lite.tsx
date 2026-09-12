import * as React from 'react'

import {
	createInlineThemeScript,
	createThemeStore,
	localStorageAdapter,
	type ThemeScriptParameter,
} from 'resonare/lite'
import { useResonare } from 'resonare/lite/react'

const PARAM = {
	key: 'demo-lite',
	handler: ({ resolvedTheme, systemTheme }) => {
		document.documentElement.dataset.theme = resolvedTheme
		document.documentElement.dataset.system = systemTheme

		const tags = [...document.querySelectorAll('meta[name="theme-color"]')]

		tags.forEach((tag) => {
			tag.setAttribute('content', resolvedTheme === 'light' ? '#fff' : '#000')
		})
	},
} as const satisfies ThemeScriptParameter

export const themeScript = createInlineThemeScript(PARAM)

const themeStore = createThemeStore({
	storage: localStorageAdapter({ key: PARAM.key }),
})

export function ThemeSelect() {
	const { theme, setTheme, subscribe, sync, restore } = useResonare(themeStore)

	React.useEffect(() => {
		const unsubscribe = subscribe(PARAM.handler)

		const stopSync = sync()

		restore()

		return () => {
			stopSync?.()

			unsubscribe()
		}
	}, [subscribe, restore, sync])

	const svgProps = {
		width: '24',
		height: '24',
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: '2',
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		'aria-hidden': 'true',
		focusable: 'false',
	}

	const sun = (
		<>
			<circle cx='12' cy='12' r='4' />
			<path d='M12 2v2' />
			<path d='M12 20v2' />
			<path d='m4.93 4.93 1.41 1.41' />
			<path d='m17.66 17.66 1.41 1.41' />
			<path d='M2 12h2' />
			<path d='M20 12h2' />
			<path d='m6.34 17.66-1.41 1.41' />
			<path d='m19.07 4.93-1.41 1.41' />
		</>
	)

	const moon = (
		<>
			<path d='M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401' />
		</>
	)

	return (
		<div className='theme-toggle'>
			<input
				type='radio'
				name='theme'
				id='system'
				value='system'
				checked={theme === 'system'}
				onChange={() => setTheme('system')}
			/>

			<label htmlFor='system'>
				<svg {...svgProps} data-system='light'>
					{sun}
				</svg>

				<svg {...svgProps} data-system='dark'>
					{moon}
				</svg>

				<span>System</span>
			</label>

			<input
				type='radio'
				name='theme'
				id='light'
				value='light'
				checked={theme === 'light'}
				onChange={() => setTheme('light')}
			/>

			<label htmlFor='light'>
				<svg {...svgProps}>{sun}</svg>

				<span>Light</span>
			</label>

			<input
				type='radio'
				name='theme'
				id='dark'
				value='dark'
				checked={theme === 'dark'}
				onChange={() => setTheme('dark')}
			/>

			<label htmlFor='dark'>
				<svg {...svgProps}>{moon}</svg>

				<span>Dark</span>
			</label>
		</div>
	)
}
