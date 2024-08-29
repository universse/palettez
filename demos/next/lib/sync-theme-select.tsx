'use client'
import { usePalettez } from 'palettez/react'

export function ThemeSelect({
	storeKey,
	themesAndOptions,
}: {
	storeKey: string
	themesAndOptions: Array<[string, Array<string>]>
}) {
	const { themes, setThemes } = usePalettez(() =>
		window.palettez.getThemeStore(storeKey),
	)

	return themesAndOptions.map(([theme, options]) => (
		<div key={theme}>
			<input type='hidden' name='key' value={storeKey} />
			<label htmlFor={theme}>{theme}</label>{' '}
			<select
				id={theme}
				name={theme}
				onChange={(e) => {
					setThemes({ [theme]: e.target.value })
				}}
				value={themes[theme]}
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</div>
	))
}
