'use client'
import { usePalettez } from 'palettez/react'
import type * as React from 'react'
import { useThemeStoreContext } from './theme-store-provider'

export function ThemeWrapper({
	storeKey,
	children,
}: {
	storeKey: string
	children: React.ReactNode
}) {
	const stores = useThemeStoreContext()
	const { resolvedThemes } = usePalettez(() => stores[storeKey], {
		initOnMount: true,
	})

	return (
		<div
			className='theme'
			data-color-scheme={resolvedThemes.colorScheme}
			data-contrast={resolvedThemes.contrast}
		>
			{children}
		</div>
	)
}
