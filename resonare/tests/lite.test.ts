// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThemeStore } from '../dist/lite'
import { mockStorage, setSystemColorScheme } from './utils'

const OPTIONS = {
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
		const themeStore = createThemeStore(OPTIONS)

		expect(themeStore).toBeDefined()
	})

	it('should default to system and resolve against the OS', () => {
		const themeStore = createThemeStore(OPTIONS)

		expect(themeStore.getTheme()).toBe('system')
		expect(themeStore.getResolvedTheme()).toBe('light')
		expect(themeStore.getSystemTheme()).toBe('light')
	})

	it('should set theme', () => {
		const themeStore = createThemeStore(OPTIONS)

		themeStore.setTheme('dark')

		expect(themeStore.getTheme()).toBe('dark')
		expect(themeStore.getResolvedTheme()).toBe('dark')
		expect(mockStorage.set).toHaveBeenCalledWith('dark')
		expect(mockStorage.broadcast).toHaveBeenCalledWith('dark')

		themeStore.setTheme((current) => (current === 'light' ? 'dark' : 'light'))

		expect(themeStore.getTheme()).toBe('light')
	})

	it('should respond to OS preferences', () => {
		setSystemColorScheme('dark')

		const themeStore = createThemeStore(OPTIONS)

		expect(themeStore.getResolvedTheme()).toBe('dark')
		expect(themeStore.getSystemTheme()).toBe('dark')
	})

	it('should restore from persisted state', () => {
		setSystemColorScheme('dark')

		const themeStore = createThemeStore({
			...OPTIONS,
			persisted: 'light',
		})

		expect(themeStore.getTheme()).toBe('light')
		expect(themeStore.getResolvedTheme()).toBe('light')
		expect(themeStore.getSystemTheme()).toBe('dark')
	})

	it('should restore from storage', () => {
		setSystemColorScheme('dark')

		mockStorage.get.mockReturnValue('light')

		const themeStore = createThemeStore(OPTIONS)

		themeStore.restore()

		expect(themeStore.getTheme()).toBe('light')
		expect(themeStore.getResolvedTheme()).toBe('light')
	})

	it('should do nothing when restoring from empty storage', () => {
		mockStorage.get.mockReturnValue(null)

		const themeStore = createThemeStore(OPTIONS)

		themeStore.setTheme('light')

		themeStore.restore()

		expect(themeStore.getTheme()).toBe('light')
	})

	it('should subscribe and unsubscribe to theme changes', () => {
		const themeStore = createThemeStore(OPTIONS)

		const mockListener = vi.fn()

		const unsubscribe = themeStore.subscribe(mockListener)

		themeStore.setTheme('dark')

		unsubscribe()

		themeStore.setTheme('light')

		expect(mockListener).toHaveBeenNthCalledWith(1, {
			theme: 'dark',
			resolvedTheme: 'dark',
			systemTheme: 'light',
		})

		expect(mockListener).toHaveBeenCalledTimes(1)
	})

	it('should resolve the system theme even when it is not selected', () => {
		setSystemColorScheme('dark')

		const themeStore = createThemeStore(OPTIONS)

		themeStore.setTheme('light')

		expect(themeStore.getSystemTheme()).toBe('dark')
	})
})
