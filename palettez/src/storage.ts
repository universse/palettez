import { name as packageName } from '../package.json'

export {
	localStorageAdapter,
	sessionStorageAdapter,
	memoryStorageAdapter,
	type StorageAdapter,
	type StorageAdapterCreate,
	type StorageAdapterCreator,
}

type StorageAdapter = {
	getItem: (key: string) => object | null | Promise<object | null>
	setItem: (key: string, value: object) => void | Promise<void>
	// removeItem: (key: string) => void | Promise<void>
	broadcast?: (key: string, value: object) => void
	watch?: (cb: (key: string | null, value: object) => void) => () => void
}

type StorageAdapterCreate = ({
	abortController,
}: { abortController: AbortController }) => StorageAdapter

type StorageAdapterCreator<Options> = (
	options?: Options,
) => StorageAdapterCreate

const localStorageAdapter: StorageAdapterCreator<never> = () => {
	return ({ abortController }) => {
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

			// removeItem: (key: string) => {
			// 	window.localStorage.removeItem(key)
			// },

			watch: (cb) => {
				const controller = new AbortController()

				window.addEventListener(
					'storage',
					(e) => {
						if (e.storageArea !== localStorage) return
						const persistedThemes = JSON.parse(e.newValue || 'null')
						cb(e.key, persistedThemes)
					},
					{
						signal: AbortSignal.any([
							abortController.signal,
							controller.signal,
						]),
					},
				)

				return () => {
					controller.abort()
				}
			},
		}
	}
}

const sessionStorageAdapter: StorageAdapterCreator<never> = () => {
	return ({ abortController }) => {
		return {
			getItem: (key: string) => {
				try {
					return JSON.parse(window.sessionStorage.getItem(key) || 'null')
				} catch {
					return null
				}
			},

			setItem: (key: string, value: object) => {
				window.sessionStorage.setItem(key, JSON.stringify(value))
			},

			// removeItem: (key: string) => {
			// 	window.sessionStorage.removeItem(key)
			// },

			watch: (cb) => {
				const controller = new AbortController()

				window.addEventListener(
					'storage',
					(e) => {
						if (e.storageArea !== sessionStorage) return
						const persistedThemes = JSON.parse(e.newValue || 'null')
						cb(e.key, persistedThemes)
					},
					{
						signal: AbortSignal.any([
							abortController.signal,
							controller.signal,
						]),
					},
				)

				return () => {
					controller.abort()
				}
			},
		}
	}
}

const memoryStorageAdapter: StorageAdapterCreator<never> = () => {
	return ({ abortController }) => {
		const storage = new Map<string, object>()
		const channel = new BroadcastChannel(packageName)

		return {
			getItem: (key: string) => {
				return storage.get(key) || null
			},

			setItem: (key: string, value: object) => {
				storage.set(key, value)
			},

			// removeItem: (key: string) => {
			// 	storage.delete(key)
			// },

			broadcast: (key: string, value: object) => {
				channel.postMessage({ key, themes: value })
			},

			watch: (cb) => {
				const controller = new AbortController()

				channel.addEventListener(
					'message',
					(e) => {
						cb(e.data.key, e.data.themes)
					},
					{
						signal: AbortSignal.any([
							abortController.signal,
							controller.signal,
						]),
					},
				)

				return () => {
					controller.abort()
				}
			},
		}
	}
}
