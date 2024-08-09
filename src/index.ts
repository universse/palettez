import { name as packageName } from '../package.json'

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

export type Storage = {
	getItem: (key: string) => object | Promise<object>
	setItem: (key: string, value: object) => void | Promise<void>
	removeItem: (key: string) => void | Promise<void>
	watch?: (cb: (key: string | null, value: object) => void) => () => void
}

type ThemeOption = {
	value: string
	isDefault?: boolean
	media?: { query: string; ifMatch: string; ifNotMatch: string }
}

export type Options = {
	key?: string
	config: ThemeConfig
	getStorage?: () => Storage
}

const isClient =
	typeof window !== 'undefined' &&
	typeof window.document !== 'undefined' &&
	typeof window.document.createElement !== 'undefined'

const DEFAULT_OPTIONS = {
	key: packageName,
	getStorage: (): Storage => {
		return {
			getItem: (key: string) => {
				try {
					return JSON.parse(window.localStorage.getItem(key) || 'null')
				} catch {
					return null
				}
			},

			setItem: (key: string, value: object) => {
				window.localStorage.setItem(key, JSON.stringify(value))
			},

			removeItem: (key: string) => {
				window.localStorage.removeItem(key)
			},

			watch: (cb) => {
				const controller = new AbortController()

				window.addEventListener(
					'storage',
					(e) => {
						const persistedThemes = JSON.parse(e.newValue || 'null')
						cb(e.key, persistedThemes)
					},
					{ signal: controller.signal },
				)

				return () => {
					controller.abort()
				}
			},
		}
	},
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
		this.#options = { ...DEFAULT_OPTIONS, ...options }
		this.#storage = this.#options.getStorage()

		const { config } = this.#options

		this.themesAndOptions = Object.entries(config).reduce<
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

		this.#defaultThemes = Object.fromEntries(
			Object.entries(config).map(([theme, themeConfig]) => {
				const entries = Object.entries(themeConfig.options)

				const defaultOption =
					entries.find(([, option]) => option.isDefault) || entries[0]

				return [theme, defaultOption![0]]
			}),
		) as Themes<T>

		this.#currentThemes = { ...this.#defaultThemes }

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

		await this.#storage.setItem(this.#options.key, this.#currentThemes)
	}

	restore = async (): Promise<void> => {
		const persistedThemes = await this.#storage.getItem(this.#options.key)

		this.#currentThemes = (persistedThemes as Themes<T>) || this.#defaultThemes

		const resolvedThemes = this.#resolveThemes()

		this.#notify(resolvedThemes)
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

	clear = async (): Promise<void> => {
		this.#currentThemes = { ...this.#defaultThemes }

		const resolvedThemes = this.#resolveThemes()

		this.#notify(resolvedThemes)

		await this.#storage.removeItem(this.#options.key)
	}

	subscribe: (callback: Listener<T>) => () => void = (callback) => {
		this.#listeners.add(callback)

		return () => {
			this.#listeners.delete(callback)
		}
	}

	#resolveThemes = (): Themes<T> => {
		// @ts-expect-error TODO
		return Object.fromEntries(
			Object.entries(this.#currentThemes).map(([theme, optionKey]) => {
				const option = this.#options.config[theme]!.options[optionKey]!

				const resolved = this.#resolveThemeOption({
					theme,
					option: { key: optionKey, ...option },
				})

				return [theme, resolved]
			}),
		)
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
		this.#listeners.forEach((listener) =>
			listener(this.#currentThemes, resolvedThemes),
		)
	}
}

const registry = new Map<string, ThemeManager<Options['config']>>()

export function create<T extends Options>(options: T) {
	const themeManager = new ThemeManager<T['config']>(options)
	registry.set(options.key || DEFAULT_OPTIONS.key, themeManager)
	return themeManager
}

export function read<T extends Options>(key: string = packageName) {
	const themeManager = registry.get(key)
	if (!themeManager) {
		throw new Error(
			`[${packageName}] Theme manager with key '${key}' could not be found. Please run \`create\` with key '${key}' first.`,
		)
	}
	return themeManager as ThemeManager<T['config']>
}
