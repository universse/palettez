import * as React from 'react'
import type { ThemeStore } from './lite'

/**
 * Subscribes a React component to a lite (light/dark/system) theme store.
 * @example
 * ```tsx
 * import { createThemeStore } from 'resonare/lite'
 * import { useResonare } from 'resonare/lite/react'
 *
 * const store = createThemeStore()
 *
 * export function ThemeToggle() {
 *   const { theme, resolvedTheme, systemTheme, setTheme } = useResonare(store)
 *
 *   // ...
 * }
 * ```
 */
export function useResonare(store: ThemeStore) {
	const { destroy, getSnapshot, restore, setTheme, subscribe, sync } = store

	const snapshot = React.useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot,
	)

	return { ...snapshot, destroy, restore, setTheme, subscribe, sync }
}
