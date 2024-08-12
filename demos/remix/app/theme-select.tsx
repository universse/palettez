import { create, memoryStorageAdapter } from 'palettez'
import { usePalettez } from 'palettez/react'
import * as React from 'react'

export function ThemeSelect({
	persistedServerThemes,
}: { persistedServerThemes: Record<string, string> }) {
	const [themeManager] = React.useState(() =>
		create({
			config: {
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
			},
			initialThemes: persistedServerThemes,
			storage: memoryStorageAdapter(),
		}),
	)

	const { themesAndOptions, themes, setThemes, subscribe, sync } = usePalettez(
		themeManager,
		persistedServerThemes,
	)

	React.useEffect(() => {
		const unsubscribe = subscribe((_, resolvedThemes) => {
			for (const [theme, optionKey] of Object.entries(resolvedThemes)) {
				;(
					(document.querySelector('.theme') as
						| HTMLElementTagNameMap['main']
						| null) || document.documentElement
				).dataset[theme] = optionKey
			}
		})

		return () => {
			unsubscribe()
		}
	}, [subscribe])

	return themesAndOptions.map((theme) => (
		<div key={theme.key}>
			<label htmlFor={theme.key}>{theme.label}</label>{' '}
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
