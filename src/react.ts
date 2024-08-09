import * as React from 'react'
import type { Options } from '.'
import { name as packageName } from '../package.json'

export function usePalettez<T extends Options>(key = packageName) {
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
