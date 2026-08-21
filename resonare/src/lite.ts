import { DEFAULT_LITE_KEY } from './constants'
import {
	localStorageAdapter,
	type StorageAdapter,
	type StorageAdapterCreate,
} from './storage'

export * from './storage'

type Theme = 'system' | 'light' | 'dark'

type ResolvedTheme = 'light' | 'dark'

type Snapshot = {
	theme: Theme
	resolvedTheme: ResolvedTheme
	systemTheme: ResolvedTheme
}

type Listener = (value: Snapshot) => void

type ThemeStoreOptions = {
	persisted?: Theme
	storage?: StorageAdapterCreate | null
}

class ThemeStore {
	#theme: Theme

	#snapshot: Snapshot

	#storage: StorageAdapter | null

	#mediaQuery: MediaQueryList | undefined

	#listeners = new Set<Listener>()

	#abortController = new AbortController()

	constructor({
		persisted,
		storage = localStorageAdapter({ key: DEFAULT_LITE_KEY }),
	}: ThemeStoreOptions = {}) {
		this.#theme = persisted ?? 'system'

		this.#storage =
			storage?.({
				abortController: this.#abortController,
			}) ?? null

		this.#snapshot = this.#createSnapshot()
	}

	getTheme = (): Theme => {
		return this.#theme
	}

	getResolvedTheme = (): ResolvedTheme => {
		return this.#theme === 'system' ? this.#resolveSystemTheme() : this.#theme
	}

	getSystemTheme = (): ResolvedTheme => {
		return this.#resolveSystemTheme()
	}

	getSnapshot = (): Snapshot => {
		return this.#snapshot
	}

	setTheme = (theme: Theme | ((current: Theme) => Theme)): void => {
		this.#setThemeAndNotify(
			typeof theme === 'function' ? theme(this.#theme) : theme,
		)

		if (this.#storage) {
			this.#storage.set(this.#theme)
			this.#storage.broadcast?.(this.#theme)
		}
	}

	restore = (): void => {
		this.#setThemeAndNotify((this.#storage?.get() ?? 'system') as Theme)
	}

	subscribe = (callback: Listener): (() => void) => {
		this.#listeners.add(callback)

		return () => {
			this.#listeners.delete(callback)
		}
	}

	sync = (): (() => void) | undefined => {
		if (!this.#storage?.watch) return

		return this.#storage.watch((theme) => {
			this.#setThemeAndNotify((theme ?? 'system') as Theme)
		})
	}

	destroy = (): void => {
		this.#listeners.clear()
		this.#abortController.abort()
	}

	#createSnapshot = (): Snapshot => ({
		theme: this.#theme,
		resolvedTheme: this.getResolvedTheme(),
		systemTheme: this.getSystemTheme(),
	})

	#setThemeAndNotify = (theme: Theme): void => {
		this.#theme = theme
		this.#snapshot = this.#createSnapshot()

		for (const listener of this.#listeners) {
			listener(this.#snapshot)
		}
	}

	#resolveSystemTheme = (): ResolvedTheme => {
		if (typeof matchMedia === 'undefined') return 'light'

		if (!this.#mediaQuery) {
			this.#mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

			this.#mediaQuery.addEventListener(
				'change',
				() => {
					this.#setThemeAndNotify(this.#theme)
				},
				{ signal: this.#abortController.signal },
			)
		}

		return this.#mediaQuery.matches ? 'dark' : 'light'
	}
}

export type { ThemeStore }

export function createThemeStore(options: ThemeStoreOptions = {}): ThemeStore {
	return new ThemeStore(options)
}

const restoreScript = (key: string, handler: Listener) => {
	const theme = (localStorage.getItem(key) ?? 'system') as Theme
	const systemTheme = matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light'
	const resolvedTheme = theme === 'system' ? systemTheme : theme

	handler({ theme, resolvedTheme, systemTheme })
}

export type ThemeScriptParameter = {
	key?: string
	handler: Listener
}

export function createInlineThemeScript({
	key = DEFAULT_LITE_KEY,
	handler,
}: ThemeScriptParameter) {
	return `(${restoreScript})('${key}',${handler})`
}
