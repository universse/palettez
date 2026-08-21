import { DEFAULT_KEY } from './constants'

export type StorageAdapter = {
	get: () => string | null
	set: (value: string) => void
	broadcast?: (value: string) => void
	watch?: (cb: (value: string | null) => void) => () => void
}

export type StorageAdapterCreate = ({
	abortController,
}: {
	abortController: AbortController
}) => StorageAdapter

export type StorageAdapterCreator<Options> = (
	options: Options,
) => StorageAdapterCreate

export const localStorageAdapter: StorageAdapterCreator<{
	key: string
	type?: 'localStorage' | 'sessionStorage'
}> = ({ key, type = 'localStorage' }) => {
	return ({ abortController }) => {
		return {
			get: () => {
				return window[type].getItem(key)
			},

			set: (value) => {
				window[type].setItem(key, value)
			},

			watch: (cb) => {
				const controller = new AbortController()

				window.addEventListener(
					'storage',
					(e) => {
						if (e.storageArea !== window[type]) return

						if (e.key !== key) return

						cb(e.newValue)
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

export const memoryStorageAdapter: StorageAdapterCreator<{
	key: string
}> = ({ key }) => {
	return ({ abortController }) => {
		const storage = new Map<string, string>()

		const channel = new BroadcastChannel(DEFAULT_KEY)

		return {
			get: () => {
				return storage.get(key) ?? null
			},

			set: (value) => {
				storage.set(key, value)
			},

			broadcast: (value) => {
				channel.postMessage({ key, value })
			},

			watch: (cb) => {
				const controller = new AbortController()

				channel.addEventListener(
					'message',
					(e) => {
						if (e.data.key !== key) return

						cb(e.data.value)
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
