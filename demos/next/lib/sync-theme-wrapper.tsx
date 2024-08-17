'use client'
import { usePalettez } from 'palettez/react'
import type * as React from 'react'
import { updateDomScript } from './multi-store-scripts'

export function ThemeWrapper({
	storeKey,
	children,
}: {
	storeKey: string
	children: React.ReactNode
}) {
	const { resolvedThemes } = usePalettez(() =>
		window.palettez.getThemeStore(storeKey),
	)

	// resolvedThemes is unknown on the server since it requires the browser to handle options that respect system settings
	// theme attributes are set as the theme wrapper becomes available in the DOM
	// on initial render, theme attributes are set by sync script so there is hydration mismatch
	// on subsequent renders, theme attributes are set by store state
	// usePalettez hook will force a re-render

	return (
		<div
			className='theme'
			data-palettez={storeKey}
			data-color-scheme={resolvedThemes.colorScheme}
			data-contrast={resolvedThemes.contrast}
			// suppressHydrationWarning
		>
			<script
				dangerouslySetInnerHTML={{
					__html: `(${updateDomScript.toString()})()`,
				}}
			/>
			{children}
		</div>
	)
}
