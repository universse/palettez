import * as React from 'react'

declare global {
	interface Window {
		palettez: typeof import('.')
	}
}

export function usePalettez(key = 'palettez') {
	const {
		themesAndOptions,
		getThemes,
		getResolvedThemes,
		setThemes,
		restore,
		sync,
		clear,
		subscribe,
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
		restore,
		sync,
		clear,
		subscribe,
	}
}
