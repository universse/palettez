export async function singleStoreScript({ key, config }) {
	const themeStore = window.palettez.createThemeStore({
		key,
		config,
	})

	await themeStore.restore()
	themeStore.sync()
}
