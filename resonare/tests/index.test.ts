// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createThemeStore,
	getThemesAndOptions,
	type ThemeStoreConfig,
} from '../dist'
import { mockStorage, setSystemColorScheme } from './utils'

const CONFIG = {
	colorScheme: {
		options: [
			{
				value: 'system',
				media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
			},
			'light',
			'light-modern',
			'dark',
			'dark-modern',
		],
	},
	contrast: {
		options: ['standard', 'high'],
	},
	sidebar: { defaultValue: 200 },
} as const satisfies ThemeStoreConfig

const OPTIONS = {
	storage: () => mockStorage,
} as const

describe('getThemesAndOptions', () => {
	it('should return the themes and options', () => {
		const themesAndOptions = getThemesAndOptions(CONFIG)

		expect(themesAndOptions).toEqual([
			[
				'colorScheme',
				['system', 'light', 'light-modern', 'dark', 'dark-modern'],
			],
			['contrast', ['standard', 'high']],
			['sidebar', []],
		])
	})
})

describe('ThemeStore', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		setSystemColorScheme('light')
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('should create a ThemeStore instance', () => {
		const themeStore = createThemeStore(CONFIG, OPTIONS)

		expect(themeStore).toBeDefined()
	})

	it('should get default themes', () => {
		const themeStore = createThemeStore(CONFIG, OPTIONS)

		expect(themeStore.getThemes()).toEqual({
			colorScheme: 'system',
			contrast: 'standard',
			sidebar: 200,
		})

		expect(themeStore.getResolvedThemes()).toEqual({
			colorScheme: 'light',
			contrast: 'standard',
			sidebar: 200,
		})

		expect(themeStore.getSnapshot()).toEqual({
			themes: {
				colorScheme: 'system',
				contrast: 'standard',
				sidebar: 200,
			},
			resolvedThemes: {
				colorScheme: 'light',
				contrast: 'standard',
				sidebar: 200,
			},
			resolvedSystemThemes: {
				colorScheme: 'light',
			},
		})
	})

	it('should set themes', () => {
		const themeStore = createThemeStore(CONFIG, OPTIONS)

		themeStore.setThemes({
			colorScheme: 'dark',
			contrast: 'high',
			sidebar: 300,
		})

		expect(themeStore.getThemes()).toEqual({
			colorScheme: 'dark',
			contrast: 'high',
			sidebar: 300,
		})

		expect(themeStore.getSnapshot()).toEqual({
			themes: {
				colorScheme: 'dark',
				contrast: 'high',
				sidebar: 300,
			},
			resolvedThemes: {
				colorScheme: 'dark',
				contrast: 'high',
				sidebar: 300,
			},
			resolvedSystemThemes: {
				colorScheme: 'light',
			},
		})

		expect(mockStorage.set).toHaveBeenCalledWith(
			JSON.stringify(themeStore.toPersist()),
		)
	})

	it('should respond to OS preferences', () => {
		setSystemColorScheme('dark')

		const themeStore = createThemeStore(CONFIG, OPTIONS)

		expect(themeStore.getResolvedThemes()).toEqual({
			colorScheme: 'dark',
			contrast: 'standard',
			sidebar: 200,
		})

		expect(themeStore.getSnapshot()).toEqual({
			themes: {
				colorScheme: 'system',
				contrast: 'standard',
				sidebar: 200,
			},
			resolvedThemes: {
				colorScheme: 'dark',
				contrast: 'standard',
				sidebar: 200,
			},
			resolvedSystemThemes: {
				colorScheme: 'dark',
			},
		})

		themeStore.updateSystemOption('colorScheme', [
			'dark-modern',
			'light-modern',
		])

		expect(themeStore.getResolvedThemes()).toEqual({
			colorScheme: 'dark-modern',
			contrast: 'standard',
			sidebar: 200,
		})

		expect(themeStore.getSnapshot()).toEqual({
			themes: {
				colorScheme: 'system',
				contrast: 'standard',
				sidebar: 200,
			},
			resolvedThemes: {
				colorScheme: 'dark-modern',
				contrast: 'standard',
				sidebar: 200,
			},
			resolvedSystemThemes: {
				colorScheme: 'dark-modern',
			},
		})

		expect(mockStorage.set).toHaveBeenCalledWith(
			JSON.stringify({
				themes: {
					colorScheme: 'system',
					contrast: 'standard',
					sidebar: 200,
				},
				systemOptions: {
					colorScheme: ['dark-modern', 'light-modern'],
				},
			}),
		)
	})

	it('should restore from persisted state', () => {
		setSystemColorScheme('dark')

		const themeStore = createThemeStore(CONFIG, {
			...OPTIONS,
			persisted: {
				themes: {
					colorScheme: 'system',
					contrast: 'high',
					sidebar: 300,
				},
				systemOptions: {
					colorScheme: ['dark-modern', 'light-modern'],
				},
			},
		})

		expect(themeStore.getThemes()).toEqual({
			colorScheme: 'system',
			contrast: 'high',
			sidebar: 300,
		})

		expect(themeStore.getResolvedThemes()).toEqual({
			colorScheme: 'dark-modern',
			contrast: 'high',
			sidebar: 300,
		})
	})

	it('should restore from storage', () => {
		setSystemColorScheme('dark')

		mockStorage.get.mockReturnValue(
			JSON.stringify({
				themes: {
					colorScheme: 'system',
					contrast: 'high',
					sidebar: 300,
				},
				systemOptions: {
					colorScheme: ['dark-modern', 'light-modern'],
				},
			}),
		)

		const themeStore = createThemeStore(CONFIG, OPTIONS)

		themeStore.restore()

		expect(themeStore.getThemes()).toEqual({
			colorScheme: 'system',
			contrast: 'high',
			sidebar: 300,
		})

		expect(themeStore.getResolvedThemes()).toEqual({
			colorScheme: 'dark-modern',
			contrast: 'high',
			sidebar: 300,
		})
	})

	it('should do nothing when restoring from empty storage', () => {
		mockStorage.get.mockReturnValue(null)

		const themeStore = createThemeStore(CONFIG, OPTIONS)

		themeStore.setThemes({ colorScheme: 'light' })

		themeStore.restore()

		expect(themeStore.getThemes()).toEqual({
			colorScheme: 'light',
			contrast: 'standard',
			sidebar: 200,
		})
	})

	it('should subscribe and unsubscribe to theme changes', () => {
		const themeStore = createThemeStore(CONFIG, OPTIONS)

		const mockListener = vi.fn()

		const unsubscribe = themeStore.subscribe(mockListener)

		themeStore.setThemes({ contrast: 'high' })

		unsubscribe()

		themeStore.setThemes({ contrast: 'standard' })

		expect(mockListener).toHaveBeenNthCalledWith(1, {
			themes: { colorScheme: 'system', contrast: 'high', sidebar: 200 },
			resolvedThemes: { colorScheme: 'light', contrast: 'high', sidebar: 200 },
			resolvedSystemThemes: { colorScheme: 'light' },
		})

		expect(mockListener).toHaveBeenCalledTimes(1)
	})

	it('should resolve system option even when it is not selected', () => {
		setSystemColorScheme('dark')

		const themeStore = createThemeStore(CONFIG, OPTIONS)

		themeStore.setThemes({ colorScheme: 'light' })

		expect(themeStore.getResolvedSystemThemes()).toEqual({
			colorScheme: 'dark',
		})

		themeStore.updateSystemOption('colorScheme', [
			'dark-modern',
			'light-modern',
		])

		expect(themeStore.getResolvedSystemThemes()).toEqual({
			colorScheme: 'dark-modern',
		})
	})
})
