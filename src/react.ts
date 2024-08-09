import * as React from 'react'
import type { Options } from '.'

export function usePalettez<T extends Options>(key = 'palettez') {
	const {
		themesAndOptions,
		getThemes,
		getResolvedThemes,
		setThemes,
		restore,
		sync,
		clear,
		subscribe,
	} = window.palettez.read<T>(key)

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
