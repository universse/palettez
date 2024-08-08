import * as React from 'react'

export function usePalettez(key = 'palettez') {
	const {
		themesAndOptions,
		getThemes,
		getResolvedThemes,
		setThemes,
		restorePersistedThemes,
		subscribe,
		sync,
		// @ts-expect-error TODO
	} = window.palettez.read(key)

	const themes = React.useSyncExternalStore(
		React.useCallback((callback) => subscribe(callback), [key]),
		() => getThemes(),
		() => null,
	)

	return {
		themesAndOptions,
		themes,
		getResolvedThemes,
		setThemes,
		restorePersistedThemes,
		subscribe,
		sync,
	}
}
