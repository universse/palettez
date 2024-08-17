import { name as packageName } from '../package.json'
import {
	type StorageAdapter,
	type StorageAdapterCreate,
	type StorageAdapterCreator,
	localStorageAdapter,
	memoryStorageAdapter,
	sessionStorageAdapter,
} from './storage'

export {
	createThemeStore,
	getThemeStore,
	localStorageAdapter,
	sessionStorageAdapter,
	memoryStorageAdapter,
	getThemeAndOptions,
	type ThemeConfig,
	type ThemeStoreOptions,
	type ThemeStore,
	type StorageAdapterCreator,
	// type Themes,
}

type ThemeOption = {
	value: string
	isDefault?: boolean
	media?: { query: string; ifMatch: string; ifNotMatch: string }
}

type ThemeConfig = Record<
	string,
	{
		label: string
		options: Record<string, ThemeOption>
	}
>

type Themes<T extends ThemeConfig> = { [K in keyof T]: keyof T[K]['options'] }

type Listener<T extends ThemeConfig> = (
	updatedThemes: Themes<T>,
	resolvedThemes: Themes<T>,
) => void

type ThemeStoreOptions = {
	key?: string
	config: ThemeConfig
	initialThemes?: Record<string, string>
	storage?: StorageAdapterCreate
}

const isClient = !!(
	typeof window !== 'undefined' &&
	typeof window.document !== 'undefined' &&
	typeof window.document.createElement !== 'undefined'
)

const DEFAULT_OPTIONS = {
	key: packageName,
	storage: localStorageAdapter(),
}

function getThemeAndOptions(config: ThemeConfig) {
	return Object.entries(config).reduce<
		Array<{
			key: string
			label: string
			options: Array<{ key: string; value: string }>
		}>
	>((acc, [theme, themeConfig]) => {
		acc.push({
			key: theme,
			label: themeConfig.label,
			options: Object.entries(themeConfig.options).map(
				([optionKey, { value }]) => ({
					key: optionKey,
					value,
				}),
			),
		})

		return acc
	}, [])
}

class ThemeStore<T extends ThemeStoreOptions['config']> {
	#options: Required<ThemeStoreOptions>
	#storage: StorageAdapter

	#defaultThemes: Themes<T>
	#currentThemes: Themes<T>
	#resolvedOptionsByTheme: Record<string, Record<string, string>>

	#listeners: Set<Listener<T>> = new Set<Listener<T>>()
	#abortController = new AbortController()

	constructor(options: ThemeStoreOptions) {
		const { config } = options

		this.#defaultThemes = Object.fromEntries(
			Object.entries(config).map(([theme, themeConfig]) => {
				const entries = Object.entries(themeConfig.options)

				const defaultOption =
					entries.find(([, option]) => option.isDefault) || entries[0]

				return [theme, defaultOption![0]]
			}),
		) as Themes<T>

		this.#options = {
			...DEFAULT_OPTIONS,
			...options,
			initialThemes: options.initialThemes || {},
		}

		this.#storage = this.#options.storage({
			abortController: this.#abortController,
		})

		this.#currentThemes = {
			...this.#defaultThemes,
			...this.#options.initialThemes,
		}

		this.#resolvedOptionsByTheme = Object.fromEntries(
			Object.keys(config).map((theme) => [theme, {}]),
		)
	}

	getThemes = (): Themes<T> => {
		return this.#currentThemes
	}

	getResolvedThemes = (): Themes<T> => {
		return this.#resolveThemes()
	}

	setThemes = async (themes: Partial<Themes<T>>): Promise<void> => {
		this.#setThemeAndNotify({ ...this.#currentThemes, ...themes })

		// this.#storage.broadcast?.(this.#options.key, this.#currentThemes)

		await this.#storage.setItem(this.#options.key, this.#currentThemes)
	}

	restore = async (): Promise<void> => {
		const persistedThemes = await this.#storage.getItem(this.#options.key)

		this.#setThemeAndNotify(
			(persistedThemes as Themes<T>) || this.#defaultThemes,
		)

		// this.#storage.broadcast?.(this.#options.key, this.#currentThemes)
	}

	// clear = async (): Promise<void> => {
	// 	this.#setThemeAndNotify({ ...this.#defaultThemes })

	// 	this.#storage.broadcast?.(this.#options.key, this.#currentThemes)

	// 	await this.#storage.removeItem(this.#options.key)
	// }

	subscribe = (callback: Listener<T>): (() => void) => {
		this.#listeners.add(callback)

		return () => {
			this.#listeners.delete(callback)

			if (this.#listeners.size === 0) {
				this.#destroy()
			}
		}
	}

	sync = (): (() => void) => {
		if (!this.#storage.watch) {
			throw new Error(
				`[${packageName}] No watch method was provided for storage.`,
			)
		}

		return this.#storage.watch((key, persistedThemes) => {
			if (key !== this.#options.key) return

			this.#setThemeAndNotify(
				(persistedThemes as Themes<T>) || this.#defaultThemes,
			)
		})
	}

	#setThemeAndNotify = (theme: Themes<T>): void => {
		this.#currentThemes = theme
		const resolvedThemes = this.#resolveThemes()
		this.#notify(resolvedThemes)
	}

	#resolveThemes = (): Themes<T> => {
		return Object.fromEntries(
			Object.entries(this.#currentThemes).map(([theme, optionKey]) => {
				const option = this.#options.config[theme]!.options[optionKey]!

				const resolved = this.#resolveThemeOption({
					theme,
					option: { key: optionKey, ...option },
				})

				return [theme, resolved]
			}),
		) as Themes<T>
	}

	#resolveThemeOption = ({
		theme,
		option,
	}: {
		theme: string
		option: ThemeOption & { key: string }
	}): string => {
		if (!option.media) return option.key

		if (!isClient) {
			console.warn(
				`[${packageName}] Option with key "media" cannot be resolved in server environment.`,
			)
			return option.key
		}

		if (!this.#resolvedOptionsByTheme[theme]![option.key]) {
			const {
				media: { query, ifMatch, ifNotMatch },
			} = option

			const mq = window.matchMedia(query)

			this.#resolvedOptionsByTheme[theme]![option.key] = mq.matches
				? ifMatch
				: ifNotMatch

			mq.addEventListener(
				'change',
				(e) => {
					this.#resolvedOptionsByTheme[theme]![option.key] = e.matches
						? ifMatch
						: ifNotMatch

					if (this.#currentThemes[theme] === option.key) {
						this.#setThemeAndNotify({ ...this.#currentThemes })
					}
				},
				{ signal: this.#abortController.signal },
			)
		}

		return this.#resolvedOptionsByTheme[theme]![option.key]!
	}

	#notify = (resolvedThemes: Themes<T>): void => {
		for (const listener of this.#listeners) {
			listener(this.#currentThemes, resolvedThemes)
		}
	}

	#destroy = (): void => {
		this.#abortController.abort()
		registry.delete(this.#options.key)
	}
}

const registry = new Map<string, ThemeStore<ThemeConfig>>()

function createThemeStore<T extends ThemeStoreOptions>(
	options: T,
): ThemeStore<T['config']> {
	const storeKey = options.key || DEFAULT_OPTIONS.key
	const themeStore = new ThemeStore<T['config']>(options)
	registry.set(storeKey, themeStore)
	return themeStore
}

function getThemeStore<T extends ThemeStoreOptions>(
	key: string,
): ThemeStore<T['config']> {
	const storeKey = key || DEFAULT_OPTIONS.key
	if (!registry.has(storeKey)) {
		throw new Error(
			`[${packageName}] Theme store with key '${storeKey}' could not be found. Please run \`createThemeStore\` with key '${storeKey}' first.`,
		)
	}
	return registry.get(storeKey)!
}
