// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThemeStore, getThemeStore } from '../src'

const mockConfig = {
	colorScheme: {
		label: 'Color scheme',
		options: {
			system: {
				value: 'System',
				isDefault: true,
				media: {
					query: '(prefers-color-scheme: dark)',
					ifMatch: 'dark',
					ifNotMatch: 'light',
				},
			},
			light: { value: 'Light' },
			dark: { value: 'Dark' },
		},
	},
	contrast: {
		label: 'Contrast',
		options: {
			standard: { value: 'Standard', isDefault: true },
			high: { value: 'High' },
		},
	},
}

const mockStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	// removeItem: vi.fn(),
	watch: vi.fn(),
} as const

const mockOptions = {
	key: 'palettez',
	config: mockConfig,
	storage: () => mockStorage,
} as const

describe('ThemeStore', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		setSystemColorScheme('light')
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('should create a ThemeStore instance', () => {
		const themeStore = createThemeStore(mockOptions)
		expect(themeStore).toBeDefined()
	})

	it('should get default themes', () => {
		const themeStore = createThemeStore(mockOptions)
		const themes = themeStore.getThemes()
		expect(themes).toEqual({ colorScheme: 'system', contrast: 'standard' })
		const resolvedThemes = themeStore.getResolvedThemes()
		expect(resolvedThemes).toEqual({
			colorScheme: 'light',
			contrast: 'standard',
		})
	})

	it('should set themes', async () => {
		const themeStore = createThemeStore(mockOptions)
		themeStore.setThemes({ colorScheme: 'dark', contrast: 'high' })
		const themes = themeStore.getThemes()
		expect(themes).toEqual({ colorScheme: 'dark', contrast: 'high' })
		expect(mockStorage.setItem).toHaveBeenCalledWith('palettez', {
			colorScheme: 'dark',
			contrast: 'high',
		})
	})

	it('should respond to media query changes', async () => {
		const themeStore = createThemeStore(mockOptions)
		setSystemColorScheme('dark')
		const resolvedThemes = themeStore.getResolvedThemes()
		expect(resolvedThemes).toEqual({
			colorScheme: 'dark',
			contrast: 'standard',
		})
	})

	it('should restore themes from storage', async () => {
		mockStorage.getItem.mockResolvedValue({
			colorScheme: 'dark',
			contrast: 'high',
		})
		const themeStore = createThemeStore(mockOptions)
		await themeStore.restore()
		const themes = themeStore.getThemes()
		expect(themes).toEqual({ colorScheme: 'dark', contrast: 'high' })
	})

	// it('should clear themes', async () => {
	// 	const themeStore = createThemeStore(mockOptions)
	// 	themeStore.setThemes({ colorScheme: 'dark', contrast: 'high' })
	// 	themeStore.clear()
	// 	const themes = themeStore.getThemes()
	// 	expect(themes).toEqual({ colorScheme: 'system', contrast: 'standard' })
	// 	expect(mockStorage.removeItem).toHaveBeenCalledWith('palettez')
	// })

	it('should subscribe to theme changes', async () => {
		const themeStore = createThemeStore(mockOptions)
		const mockListener = vi.fn()
		themeStore.subscribe(mockListener)
		await themeStore.setThemes({ contrast: 'high' })
		expect(mockListener).toHaveBeenCalledWith(
			{ colorScheme: 'system', contrast: 'high' },
			{ colorScheme: 'light', contrast: 'high' },
		)
	})

	it('should destroy', async () => {
		const themeStore = createThemeStore(mockOptions)
		const mockListener = vi.fn()
		const unsubscribe = themeStore.subscribe(mockListener)
		unsubscribe()

		themeStore.setThemes({ contrast: 'high' })
		expect(mockListener).not.toHaveBeenCalled()

		setSystemColorScheme('dark')
		const resolvedThemes = themeStore.getResolvedThemes()
		expect(resolvedThemes).toEqual({
			colorScheme: 'light',
			contrast: 'high',
		})

		expect(() => getThemeStore(mockOptions.key)).toThrow()
	})
})

describe('create and read functions', () => {
	it('should create and read a ThemeStore instance', () => {
		const createdStore = createThemeStore(mockOptions)
		const store = getThemeStore('palettez')
		expect(store).toBe(createdStore)
	})

	it('should throw an error when reading a non-existent ThemeStore', () => {
		expect(() => getThemeStore('non-existent')).toThrow()
	})
})

function setSystemColorScheme(colorScheme: 'light' | 'dark') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: colorScheme === 'dark',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	})
}
