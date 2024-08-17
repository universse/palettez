import { usePalettez } from 'palettez/react'
import { useThemeStoreContext } from './_theme-store-provider'

export function ThemeSelect({
	storeKey,
	themesAndOptions,
}: {
	storeKey: string
	themesAndOptions: Array<{
		key: string
		label: string
		options: Array<{ key: string; value: string }>
	}>
}) {
	const stores = useThemeStoreContext()

	const { themes, setThemes } = usePalettez(() => stores[storeKey], {
		initOnMount: true,
	})

	return themesAndOptions.map((theme) => (
		<div key={theme.key}>
			<input type='hidden' name='key' value={storeKey} />
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
