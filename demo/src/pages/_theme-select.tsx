import { usePalettez } from 'palettez/react'

export function ThemeSelect() {
	const { themesAndOptions, themes, setThemes } = usePalettez('palettez')

	return themesAndOptions.map((theme) => (
		<div key={theme.key}>
			<label htmlFor={theme.key}>{theme.label}</label>
			<select
				id={theme.key}
				name={theme.key}
				onChange={(e) => {
					setThemes({ [theme.key]: e.target.value })
				}}
				value={themes[theme.key]}
			>
				{theme.options.map((option) => (
					<option key={option.key} value={option.key}>
						{option.value}
					</option>
				))}
			</select>
		</div>
	))
}
