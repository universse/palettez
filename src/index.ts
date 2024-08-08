import { name as packageName } from '../package.json'

type Themes<T> = { [K in keyof T]: keyof T[K] }
type Listener<T> = (updatedThemes: Themes<T>, resolvedThemes: Themes<T>) => void

export type Config = Record<
	string,
	{
		label: string
		options: Record<
			string,
			{
				value: string
				isDefault?: boolean
				media?: { query: string; ifMatch: string; ifNotMatch: string }
			}
		>
	}
>

type Options = { key: string }

const DEFAULT_OPTIONS: Options = {
	key: packageName,
}

class ThemeManager<T extends Config> {
	themesAndOptions: Array<{
		key: string
		label: string
		options: Array<{ key: string; value: string }>
	}>

	#config: T
	#options: Options

	#defaultThemes: Themes<T>
	#currentThemes: Themes<T>
	#resolvedOptionsByTheme: Record<string, Record<string, string>>

	#listeners: Set<Listener<T>> = new Set<Listener<T>>()

	constructor(config: T, options: Options = DEFAULT_OPTIONS) {
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

		this.#config = config

		this.#options = options

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

	setThemes = (themes: Partial<Themes<T>>): void => {
		this.#currentThemes = { ...this.#currentThemes, ...themes }

		const resolvedThemes = this.#resolveThemes()

		this.#applyThemes(resolvedThemes)

		window.localStorage.setItem(
			this.#options.key,
			JSON.stringify(this.#currentThemes),
		)

		this.#notify(resolvedThemes)
	}

	restorePersistedThemes = (): void => {
		const persistedThemes = JSON.parse(
			window.localStorage.getItem(this.#options.key) || 'null',
		)

		this.#currentThemes = persistedThemes || this.#defaultThemes

		const resolvedThemes = this.#resolveThemes()

		this.#applyThemes(resolvedThemes)
	}

	subscribe: (callback: Listener<T>) => () => void = (callback) => {
		this.#listeners.add(callback)

		return () => {
			this.#listeners.delete(callback)
		}
	}

	sync = (): (() => void) => {
		const controller = new AbortController()

		window.addEventListener(
			'storage',
			(e) => {
				if (e.key !== this.#options.key) return

				const persistedThemes = JSON.parse(e.newValue || 'null')

				this.#currentThemes = persistedThemes || this.#defaultThemes

				const resolvedThemes = this.#resolveThemes()

				this.#applyThemes(resolvedThemes)

				this.#notify(resolvedThemes)
			},
			{ signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	}

	#resolveThemes = (): Themes<T> => {
		// @ts-expect-error TODO
		return Object.fromEntries(
			Object.entries(this.#currentThemes).map(([theme, optionKey]) => {
				const option = this.#config[theme]!.options[optionKey]!

				const resolved = option.media
					? this.#resolveOption({
							theme,
							// @ts-expect-error TODO
							option: { key: optionKey, ...option },
						})
					: optionKey

				return [theme, resolved]
			}),
		)
	}

	#applyThemes = (themes: Themes<T>): void => {
		Object.entries(themes).forEach(([theme, optionKey]) => {
			document.documentElement.dataset[theme] = optionKey
		})
	}

	#resolveOption = ({
		theme,
		option,
	}: {
		theme: string
		option: {
			key: string
			value: string
			media: { query: string; ifMatch: string; ifNotMatch: string }
		}
	}): string => {
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

					this.#applyThemes(resolvedThemes)

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

const registry = new Map<string, ThemeManager<Config>>()

export function create(config: Config, options: Options = DEFAULT_OPTIONS) {
	const themeManager = new ThemeManager(config, options)
	registry.set(options.key, themeManager)
	return themeManager
}

export function read(key: string = DEFAULT_OPTIONS.key) {
	const themeManager = registry.get(key)
	if (!themeManager) {
		throw new Error(
			`[palettez] Theme manager with key '${key}' could not be found. Please run \`create\` with key '${key}' first.`,
		)
	}
	return themeManager
}
