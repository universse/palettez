export function createStoresScript({ initialThemesByKey, config }) {
	for (const key of Object.keys(initialThemesByKey)) {
		window.palettez.createThemeStore({
			key,
			config,
			initialThemes: initialThemesByKey[key],
			storage: window.palettez.memoryStorageAdapter(), // store state in memory instead of localStorage
		})
	}
}

export function updateDomScript() {
	const wrapper = [...document.querySelectorAll('.theme[data-palettez]')].at(-1)
	const key = wrapper.dataset.palettez
	const resolvedThemes = window.palettez.getThemeStore(key).getResolvedThemes()
	wrapper.dataset.colorScheme = resolvedThemes.colorScheme
	wrapper.dataset.contrast = resolvedThemes.contrast
}
