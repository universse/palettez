import { name as packageName } from '../package.json'
import {
	type Storage,
	localStorageAdapter,
	memoryStorageAdapter,
} from './storage'

export {
	create,
	read,
	memoryStorageAdapter,
	localStorageAdapter,
	type Options,
	type Storage,
	type Themes,
	type ThemeManager,
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

type Options = {
	key?: string
	config: ThemeConfig
	initialThemes?: Record<string, string>
	storageAdapter?: () => Storage
}

const isClient =
	typeof window !== 'undefined' &&
	typeof window.document !== 'undefined' &&
	typeof window.document.createElement !== 'undefined'

const DEFAULT_OPTIONS = {
	key: packageName,
	storageAdapter: localStorageAdapter(),
}

export function getThemeAndOptions(config: ThemeConfig) {
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

class ThemeManager<T extends Options['config']> {
	themesAndOptions: Array<{
		key: string
		label: string
		options: Array<{ key: string; value: string }>
	}>

	#options: Required<Options>
	#storage: Storage

	#defaultThemes: Themes<T>
	#currentThemes: Themes<T>
	#resolvedOptionsByTheme: Record<string, Record<string, string>>

	#listeners: Set<Listener<T>> = new Set<Listener<T>>()

	constructor(options: Options) {
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
		this.#storage = this.#options.storageAdapter()

		this.themesAndOptions = getThemeAndOptions(config)

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
		this.#currentThemes = { ...this.#currentThemes, ...themes }

		const resolvedThemes = this.#resolveThemes()

		this.#notify(resolvedThemes)

		// this.#storage.broadcast?.(this.#options.key, this.#currentThemes)

		await this.#storage.setItem(this.#options.key, this.#currentThemes)
	}

	restore = async (): Promise<void> => {
		const persistedThemes = await this.#storage.getItem(this.#options.key)

		this.#currentThemes = (persistedThemes as Themes<T>) || this.#defaultThemes

		const resolvedThemes = this.#resolveThemes()

		this.#notify(resolvedThemes)

		// this.#storage.broadcast?.(this.#options.key, this.#currentThemes)
	}

	clear = async (): Promise<void> => {
		this.#currentThemes = { ...this.#defaultThemes }

		const resolvedThemes = this.#resolveThemes()

		this.#notify(resolvedThemes)

		// this.#storage.broadcast?.(this.#options.key, this.#currentThemes)

		await this.#storage.removeItem(this.#options.key)
	}

	subscribe: (callback: Listener<T>) => () => void = (callback) => {
		this.#listeners.add(callback)

		return () => {
			this.#listeners.delete(callback)
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

			this.#currentThemes =
				(persistedThemes as Themes<T>) || this.#defaultThemes

			const resolvedThemes = this.#resolveThemes()

			this.#notify(resolvedThemes)
		})
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

			mq.addEventListener('change', (e) => {
				this.#resolvedOptionsByTheme[theme]![option.key] = e.matches
					? ifMatch
					: ifNotMatch

				if (this.#currentThemes[theme] === option.key) {
					const resolvedThemes = this.#resolveThemes()

					this.#notify(resolvedThemes)
				}
			})
		}

		return this.#resolvedOptionsByTheme[theme]![option.key]!
	}

	#notify = (resolvedThemes: Themes<T>): void => {
		for (const listener of this.#listeners) {
			listener(this.#currentThemes, resolvedThemes)
		}
	}
}

const registry = new Map<string, ThemeManager<Options['config']>>()

function create<T extends Options>(options: T) {
	const themeManager = new ThemeManager<T['config']>(options)
	registry.set(options.key || DEFAULT_OPTIONS.key, themeManager)
	return themeManager
}

function read<T extends Options>(key: string = packageName) {
	const themeManager = registry.get(key)
	if (!themeManager) {
		throw new Error(
			`[${packageName}] Theme manager with key '${key}' could not be found. Please run \`create\` with key '${key}' first.`,
		)
	}
	return themeManager as ThemeManager<T['config']>
}
