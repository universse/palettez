import * as React from 'react'
import type { Options, ThemeManager, Themes } from '.'

export function usePalettez<T extends Options['config']>(
	themeManager: ThemeManager<T>,
	persistedServerThemes: Record<string, string> | null = null,
) {
	const {
		themesAndOptions,
		getThemes,
		getResolvedThemes,
		setThemes,
		restore,
		sync,
		clear,
		subscribe,
	} = themeManager

	const themes = React.useSyncExternalStore(
		React.useCallback((callback) => subscribe(callback), []),
		() => getThemes(),
		() => persistedServerThemes as Themes<T>,
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
