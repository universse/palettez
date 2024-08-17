import * as React from 'react'
import type { ThemeStore, ThemeStoreOptions } from '.'

function noop() {}
const emptyObject = {}

const emptyStore = {
	getThemes: () => emptyObject,
	getResolvedThemes: () => emptyObject,
	setThemes: noop,
	restore: noop,
	sync: noop,
	// clear: noop,
	subscribe: () => noop,
}

export function usePalettez<T extends ThemeStoreOptions['config']>(
	getStore: () => ThemeStore<T>,
	{ initOnMount = false } = {},
) {
	const [isMounted, setIsMounted] = React.useState(initOnMount)

	React.useEffect(() => {
		setIsMounted(true)
	}, [])

	const {
		getThemes,
		getResolvedThemes,
		setThemes,
		restore,
		sync,
		// clear,
		subscribe,
	} = isMounted ? getStore() : (emptyStore as unknown as ThemeStore<T>)

	const themes = React.useSyncExternalStore(
		React.useCallback((callback) => subscribe(callback), [subscribe]),
		getThemes,
		getThemes,
	)

	return {
		themes,
		resolvedThemes: getResolvedThemes(),
		setThemes,
		restore,
		sync,
		// clear,
		subscribe,
	}
}
