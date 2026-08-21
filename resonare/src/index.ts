import { DEFAULT_KEY } from './constants'
import {
	localStorageAdapter,
	type StorageAdapter,
	type StorageAdapterCreate,
} from './storage'

export * from './storage'

type ThemeValue = string | number | boolean

type ThemeOption<T extends ThemeValue = string> = {
	value: T
	media?: [string, T, T]
}

type ThemeConfig<T extends ThemeValue = string> =
	| {
			options: ReadonlyArray<T | ThemeOption<T>>
			defaultValue?: T
	  }
	| { defaultValue: T; options?: never }

export type ThemeStoreConfig = Record<
	string,
	ThemeConfig<string> | ThemeConfig<number> | ThemeConfig<boolean>
>

export type Themes<T extends ThemeStoreConfig> = {
	[K in keyof T]: T[K] extends { options: ReadonlyArray<infer U> }
		? U extends ThemeOption
			? U['value']
			: U
		: T[K] extends { defaultValue: infer U }
			? U extends string
				? string
				: U extends number
					? number
					: boolean
			: never
}

type ThemeKeysWithSystemOption<T extends ThemeStoreConfig> = {
	[K in keyof T]: T[K] extends { options: ReadonlyArray<infer U> }
		? U extends { media: ReadonlyArray<unknown> }
			? K
			: never
		: never
}[keyof T]

type NonSystemOptionValues<
	T extends ThemeStoreConfig,
	K extends keyof T,
> = T[K] extends { options: ReadonlyArray<infer U> }
	? U extends ThemeValue
		? U
		: U extends ThemeOption
			? U extends { media: [string, string, string] }
				? never
				: U['value']
			: never
	: never

type ResolvedSystemThemes<T extends ThemeStoreConfig> = {
	[K in ThemeKeysWithSystemOption<T>]: NonSystemOptionValues<T, K>
}

type SystemOptions = Record<
	string,
	{
		value: string
		mediaQuery: string
		pair: [string, string]
	}
>

type Snapshot<T extends ThemeStoreConfig> = {
	themes: Themes<T>
	resolvedThemes: Themes<T>
	resolvedSystemThemes: ResolvedSystemThemes<T>
}

type Listener<T extends ThemeStoreConfig> = (value: Snapshot<T>) => void

type PersistedSystemOptionPairs = Record<string, [string, string]>

type PersistedState<T extends ThemeStoreConfig> = {
	themes: Partial<Themes<T>>
	systemOptions: PersistedSystemOptionPairs
}

type ThemeStoreOptions<T extends ThemeStoreConfig> = {
	persisted?: Partial<PersistedState<T>>
	storage?: StorageAdapterCreate | null
}

type ThemeAndOptions<T extends ThemeStoreConfig> = Array<
	{
		[K in keyof T]: [
			K,
			Array<
				T[K] extends { options: ReadonlyArray<infer U> }
					? U extends ThemeOption
						? U['value']
						: U
					: never
			>,
		]
	}[keyof T]
>

export function getThemesAndOptions<T extends ThemeStoreConfig>(config: T) {
	return Object.entries(config).map(([themeKey, themeConfig]) => {
		return [
			themeKey,
			(themeConfig.options || []).map((option) =>
				typeof option === 'object' ? option.value : option,
			),
		]
	}) as ThemeAndOptions<T>
}

export function getDefaultThemes<T extends ThemeStoreConfig>(config: T) {
	return Object.fromEntries(
		Object.entries(config).map(([themeKey, themeConfig]) => {
			return [
				themeKey,
				themeConfig.defaultValue ??
					(typeof themeConfig.options[0] === 'object'
						? themeConfig.options[0].value
						: themeConfig.options[0]),
			]
		}),
	) as Themes<T>
}

class ThemeStore<T extends ThemeStoreConfig> {
	#currentThemes: Themes<T>

	#snapshot: Snapshot<T>

	#systemOptions: SystemOptions = {}

	#storage: StorageAdapter | null

	#mediaQueryCache: Record<string, MediaQueryList> = {}

	#listeners: Set<Listener<T>> = new Set<Listener<T>>()

	#abortController = new AbortController()

	constructor(
		config: T,
		{
			persisted = {},
			storage = localStorageAdapter({ key: DEFAULT_KEY }),
		}: ThemeStoreOptions<T> = {},
	) {
		this.#currentThemes = { ...getDefaultThemes(config), ...persisted.themes }

		this.#systemOptions = Object.fromEntries(
			Object.entries(config).flatMap(([themeKey, themeConfig]) => {
				const systemOption = (themeConfig.options || []).find(
					(option): option is Required<ThemeOption> =>
						typeof option === 'object' && !!option.media,
				)

				if (!systemOption) return []

				const {
					value,
					media: [mediaQuery, optionWhenMatched, optionWhenNotMatched],
				} = systemOption

				return [
					[
						themeKey,
						{
							value,
							mediaQuery,
							pair: persisted.systemOptions?.[themeKey] ?? [
								optionWhenMatched,
								optionWhenNotMatched,
							],
						},
					],
				]
			}),
		)

		this.#storage =
			storage?.({
				abortController: this.#abortController,
			}) ?? null

		this.#snapshot = this.#createSnapshot()
	}

	getThemes = (): Themes<T> => {
		return this.#currentThemes
	}

	getResolvedThemes = (): Themes<T> => {
		return Object.fromEntries(
			Object.entries(this.#currentThemes).map(([themeKey, optionKey]) => {
				const systemOption = this.#systemOptions[themeKey]

				return [
					themeKey,
					systemOption && optionKey === systemOption.value
						? this.#resolveSystemOption(themeKey)
						: optionKey,
				]
			}),
		) as Themes<T>
	}

	getResolvedSystemThemes = (): ResolvedSystemThemes<T> => {
		return Object.fromEntries(
			Object.keys(this.#systemOptions).map((themeKey) => [
				themeKey,
				this.#resolveSystemOption(themeKey),
			]),
		) as ResolvedSystemThemes<T>
	}

	getSnapshot = (): Snapshot<T> => {
		return this.#snapshot
	}

	setThemes = (
		themes:
			| Partial<Themes<T>>
			| ((currentThemes: Themes<T>) => Partial<Themes<T>>),
	): void => {
		const updatedThemes =
			typeof themes === 'function' ? themes(this.#currentThemes) : themes

		this.#setThemesAndNotify(updatedThemes)

		if (this.#storage) {
			const stored = JSON.stringify(this.toPersist())

			this.#storage.set(stored)

			this.#storage.broadcast?.(stored)
		}
	}

	updateSystemOption = <K extends ThemeKeysWithSystemOption<T>>(
		themeKey: K,
		pair: [NonSystemOptionValues<T, K>, NonSystemOptionValues<T, K>],
	): void => {
		this.#systemOptions[themeKey]!.pair = pair

		this.setThemes({})
	}

	toPersist = (): PersistedState<T> => {
		return {
			themes: this.#currentThemes,
			systemOptions: Object.fromEntries(
				Object.entries(this.#systemOptions).map(([themeKey, { pair }]) => [
					themeKey,
					pair,
				]),
			),
		}
	}

	restore = (): void => {
		const stored = this.#storage?.get()

		if (!stored) {
			this.#setThemesAndNotify()
			return
		}

		const persisted = JSON.parse(stored) as PersistedState<T>

		this.#applyPersistedSystemOptions(persisted.systemOptions)

		this.#setThemesAndNotify(persisted.themes)
	}

	subscribe = (callback: Listener<T>): (() => void) => {
		this.#listeners.add(callback)

		return () => this.#listeners.delete(callback)
	}

	sync = (): (() => void) | undefined => {
		if (!this.#storage?.watch) return

		return this.#storage.watch((stored) => {
			if (!stored) return

			const persisted = JSON.parse(stored) as PersistedState<T>

			this.#applyPersistedSystemOptions(persisted.systemOptions)

			this.#setThemesAndNotify(persisted.themes)
		})
	}

	destroy = (): void => {
		this.#listeners.clear()
		this.#abortController.abort()
	}

	#applyPersistedSystemOptions = (
		systemOptions: PersistedSystemOptionPairs = {},
	): void => {
		Object.entries(systemOptions).forEach(([themeKey, pair]) => {
			if (!pair || !this.#systemOptions[themeKey]) return

			this.#systemOptions[themeKey].pair = pair
		})
	}

	#createSnapshot = (): Snapshot<T> => ({
		themes: this.#currentThemes,
		resolvedThemes: this.getResolvedThemes(),
		resolvedSystemThemes: this.getResolvedSystemThemes(),
	})

	#setThemesAndNotify = (themes?: Partial<Themes<T>>): void => {
		this.#currentThemes = { ...this.#currentThemes, ...themes }

		this.#snapshot = this.#createSnapshot()

		for (const listener of this.#listeners) {
			listener(this.#snapshot)
		}
	}

	#resolveSystemOption = (themeKey: string): string => {
		const { value, mediaQuery, pair } = this.#systemOptions[themeKey]!

		if (typeof matchMedia === 'undefined') return value

		if (!this.#mediaQueryCache[mediaQuery]) {
			this.#mediaQueryCache[mediaQuery] = window.matchMedia(mediaQuery)

			this.#mediaQueryCache[mediaQuery].addEventListener(
				'change',
				() => {
					this.#setThemesAndNotify()
				},
				{ signal: this.#abortController.signal },
			)
		}

		return this.#mediaQueryCache[mediaQuery].matches ? pair[0] : pair[1]
	}
}

export type { ThemeStore }

export function createThemeStore<T extends ThemeStoreConfig>(
	config: T,
	options: ThemeStoreOptions<T> = {},
): ThemeStore<T> {
	return new ThemeStore<T>(config, options)
}

const restoreScript = <T extends ThemeValue>(
	params: Array<
		[string, Array<[string, T] | [string, T, T, string, T, T]>, Listener<any>]
	>,
) => {
	params.forEach(([key, flattenedConfig, handler]) => {
		const persisted = JSON.parse(localStorage.getItem(key) || '{}')

		handler(
			flattenedConfig.reduce<{
				themes: Record<string, ThemeValue>
				resolvedThemes: Record<string, ThemeValue>
				resolvedSystemThemes: Record<string, ThemeValue>
			}>(
				(
					acc,
					[
						themeKey,
						initial,
						systemOptionValue,
						mediaQuery,
						optionWhenMatched,
						optionWhenNotMatched,
					],
				) => {
					const currentValue = persisted.themes?.[themeKey] ?? initial

					acc.resolvedThemes[themeKey] = acc.themes[themeKey] = currentValue

					if (mediaQuery != null) {
						const pair = persisted.systemOptions?.[themeKey] ?? [
							optionWhenMatched!,
							optionWhenNotMatched!,
						]

						const systemTheme = matchMedia(mediaQuery).matches
							? pair[0]
							: pair[1]

						acc.resolvedSystemThemes[themeKey] = systemTheme

						if (currentValue === systemOptionValue) {
							acc.resolvedThemes[themeKey] = systemTheme
						}
					}

					return acc
				},
				{ themes: {}, resolvedThemes: {}, resolvedSystemThemes: {} },
			),
		)
	})
}

export type ThemeScriptParameter = {
	/** `localStorage` key; defaults to the 'resonare'. */
	key?: string
	config: ThemeStoreConfig
	handler: Listener<any>
}

export function createInlineThemeScript(
	themeScriptParameters: ThemeScriptParameter | Array<ThemeScriptParameter>,
) {
	const serializedArgs = (
		Array.isArray(themeScriptParameters)
			? themeScriptParameters
			: [themeScriptParameters]
	).map(({ key = DEFAULT_KEY, config, handler }) => {
		const flattenedConfig = Object.entries(config).map(
			([themeKey, { options, defaultValue }]) => {
				const firstOption = options?.[0]

				const resolvedInitialValue =
					defaultValue ??
					(typeof firstOption === 'object' ? firstOption.value : firstOption!)

				const systemOption = options?.find(
					(option): option is Required<ThemeOption> =>
						typeof option === 'object' && !!option.media,
				)

				if (systemOption) {
					const { value, media } = systemOption

					return [themeKey, resolvedInitialValue, value, ...media]
				}

				return [themeKey, resolvedInitialValue]
			},
		)

		return `['${key}',${JSON.stringify(flattenedConfig)},${handler}]`
	})

	return `(${restoreScript})([${serializedArgs}])`
}
