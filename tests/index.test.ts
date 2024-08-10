// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Options, type Storage, create, read } from '../src'

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

const mockStorage: Storage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	watch: vi.fn(),
}

const mockOptions: Options = {
	key: 'palettez',
	config: mockConfig,
	getStorage: () => mockStorage,
}

describe('ThemeManager', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		setSystemColorScheme('light')
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('should create a ThemeManager instance', () => {
		const themeManager = create(mockOptions)
		expect(themeManager).toBeDefined()
	})

	it('should get default themes', () => {
		const themeManager = create(mockOptions)
		const themes = themeManager.getThemes()
		expect(themes).toEqual({ colorScheme: 'system', contrast: 'standard' })
		const resolvedThemes = themeManager.getResolvedThemes()
		expect(resolvedThemes).toEqual({
			colorScheme: 'light',
			contrast: 'standard',
		})
	})

	it('should set themes', async () => {
		const themeManager = create(mockOptions)
		await themeManager.setThemes({ colorScheme: 'dark', contrast: 'high' })
		const themes = themeManager.getThemes()
		expect(themes).toEqual({ colorScheme: 'dark', contrast: 'high' })
		expect(mockStorage.setItem).toHaveBeenCalledWith('palettez', {
			colorScheme: 'dark',
			contrast: 'high',
		})
	})

	it('should respond to media query changes', async () => {
		const themeManager = create(mockOptions)
		setSystemColorScheme('dark')
		const resolvedThemes = themeManager.getResolvedThemes()
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
		const themeManager = create(mockOptions)
		await themeManager.restore()
		const themes = themeManager.getThemes()
		expect(themes).toEqual({ colorScheme: 'dark', contrast: 'high' })
	})

	it('should clear themes', async () => {
		const themeManager = create(mockOptions)
		await themeManager.setThemes({ colorScheme: 'dark', contrast: 'high' })
		await themeManager.clear()
		const themes = themeManager.getThemes()
		expect(themes).toEqual({ colorScheme: 'system', contrast: 'standard' })
		expect(mockStorage.removeItem).toHaveBeenCalledWith('palettez')
	})

	it('should subscribe to theme changes', async () => {
		const themeManager = create(mockOptions)
		const mockListener = vi.fn()
		themeManager.subscribe(mockListener)
		await themeManager.setThemes({ contrast: 'high' })
		expect(mockListener).toHaveBeenCalledWith(
			{ colorScheme: 'system', contrast: 'high' },
			{ colorScheme: 'light', contrast: 'high' },
		)
	})
})

describe('create and read functions', () => {
	it('should create and read a ThemeManager instance', () => {
		const createdManager = create(mockOptions)
		const readManager = read('palettez')
		expect(readManager).toBe(createdManager)
	})

	it('should throw an error when reading a non-existent ThemeManager', () => {
		expect(() => read('non-existent')).toThrow()
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
