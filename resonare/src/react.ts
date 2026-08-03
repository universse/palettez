import * as React from 'react'
import type { ThemeStore, ThemeStoreConfig } from '.'

/**
 * Subscribes a React component to a theme store.
 * @example
 * ```tsx
 * export function ThemeToggle() {
 *   const { themes, resolvedThemes, resolvedSystemThemes, setThemes } = useResonare(store)
 *
 *   // ...
 * }
 * ```
 */
export function useResonare<T extends ThemeStoreConfig>(store: ThemeStore<T>) {
	const {
		destroy,
		getResolvedThemes,
		getResolvedSystemThemes,
		getThemes,
		restore,
		setThemes,
		subscribe,
		sync,
		toPersist,
		updateSystemOption,
	} = store

	const themes = React.useSyncExternalStore(subscribe, getThemes, getThemes)

	return {
		themes,
		// @ts-expect-error - workaround for React compiler as getResolvedThemes is not called again without 'themes' dependency
		resolvedThemes: getResolvedThemes(themes),
		// @ts-expect-error - workaround for React compiler as getResolvedSystemThemes is not called again without 'themes' dependency
		resolvedSystemThemes: getResolvedSystemThemes(themes),
		destroy,
		restore,
		setThemes,
		subscribe,
		sync,
		toPersist,
		updateSystemOption,
	}
}
