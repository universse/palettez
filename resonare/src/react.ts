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
		getSnapshot,
		restore,
		setThemes,
		subscribe,
		sync,
		toPersist,
		updateSystemOption,
	} = store

	const snapshot = React.useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot,
	)

	return {
		...snapshot,
		destroy,
		restore,
		setThemes,
		subscribe,
		sync,
		toPersist,
		updateSystemOption,
	}
}
