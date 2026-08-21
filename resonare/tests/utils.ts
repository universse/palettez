import { vi } from 'vitest'

export const mockStorage = {
	get: vi.fn(),
	set: vi.fn(),
	broadcast: vi.fn(),
	watch: vi.fn(),
}

export function setSystemColorScheme(colorScheme: 'light' | 'dark') {
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
