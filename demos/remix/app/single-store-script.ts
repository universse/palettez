export async function singleStoreScript({ key, config }) {
	const themeStore = window.palettez.createThemeStore({
		key,
		config,
	})

	themeStore.subscribe((_, resolvedThemes) => {
		for (const [theme, optionKey] of Object.entries(resolvedThemes)) {
			document.documentElement.dataset[theme] = optionKey
		}
	})

	await themeStore.restore()
	themeStore.sync()

	const resolvedThemes = themeStore.getResolvedThemes()
	document.documentElement.dataset.colorScheme = resolvedThemes.colorScheme
	document.documentElement.dataset.contrast = resolvedThemes.contrast
}
