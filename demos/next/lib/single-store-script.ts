export async function singleStoreScript({ key, config }) {
	const themeStore = window.palettez.createThemeStore({
		key,
		config,
	})

	await themeStore.restore()
	themeStore.sync()

	const resolvedThemes = themeStore.getResolvedThemes()
	document.documentElement.dataset.colorScheme = resolvedThemes.colorScheme
	document.documentElement.dataset.contrast = resolvedThemes.contrast
}
