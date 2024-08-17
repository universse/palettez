# Palettez

A flexible theme management library for JavaScript applications

## Features

- Manage multi-dimensional themes with multiple options, for eg:
  - Color scheme: light, dark, system
  - Contrast preference: standard, high
  - Spacing: compact, comfortable, spacious
- Framework-agnostic
- No theme flicker on page load
- Dynamically update themes based on system settings
- Multiple sections with independent theme selection
- Sync theme selection across tabs and windows
- Customizable data persistence; use localStorage by default

## Demos

- Astro

  [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/universse/palettez/tree/main/demos/astro?title=Palettez%20Demo%20with%20Astro&file=src%2Fpages%2Findex.astro,src%2Fpages%2Fclient-server.astro)

- Remix

  [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/universse/palettez/tree/main/demos/remix?title=Palettez%20Demo%20with%20Remix&file=app%2Froutes%2F_index.tsx,app%2Froutes%2Fclient-server.tsx)

- Next.js

  [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/universse/palettez/tree/main/demos/next?title=Palettez%20Demo%20with%20Next.js&file=app%2Fpage.tsx,app%2Fclient-server%2Fpage.tsx,pages%2Fpages%2Fclient-only.tsx,pages%2Fpages%2Fclient-server.tsx)

## Installation

To install:

```bash
npm i palettez
# or
yarn add palettez
# or
pnpm add palettez
```

## Basic Usage

It's recommended to initialize Palettez in a synchronous script to avoid theme flicker on page load. If your project's bundler supports importing static asset as string, you can inline the minified version of Palettez to reduce the number of HTTP requests. Check out the Astro/Remix demo for example of this pattern with Vite.

```html
<script src="https://unpkg.com/palettez"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/palettez"></script>

<script>
  ;(() => {
    const themeStore = window.palettez.createThemeStore({
      config: {
        colorScheme: {
          label: 'Color scheme',
          options: {
            system: {
              value: 'System',
              isDefault: true,
              media: {
                query: '(prefers-color-scheme: dark)',
                ifMatch: 'dark',
                ifNotMatch: 'light',
              },
            },
            light: { value: 'Light' },
            dark: { value: 'Dark' },
          },
        },
      },
    })

    themeStore.subscribe((_, resolvedThemes) => {
      for (const [theme, optionKey] of Object.entries(resolvedThemes)) {
        document.documentElement.dataset[theme] = optionKey
      }
    })

    await themeStore.restore()
    themeStore.sync()
  })()
</script>
```

If you are using TypeScript, add `palettez/global` to `compilerOptions.types` in `tsconfig.json`.

```json
{
  "compilerOptions": {
    "types": ["palettez/global"]
  }
}
```

## API

### `createThemeStore`

```ts
import { createThemeStore } from 'palettez'

const themeStore = createThemeStore({
  // optional, default 'palettez'
  // should be unique, also used as storage key
  key: 'palettez',

  // required, specify theme and options
  config: {
    colorScheme: {
      label: 'Color scheme',
      options: {
        system: {
          value: 'System',
          isDefault: true,

          // only supported client-side
          media: {
            query: '(prefers-color-scheme: dark)',
            ifMatch: 'dark',
            ifNotMatch: 'light',
          },
        },
       light: { value: 'Light' },
       dark: { value: 'Dark' },
      },
    },

    contrast: {
      label: 'Contrast',
      options: {
        system: {
          value: 'System',
          isDefault: true,
          media: {
            query: '(prefers-contrast: more) and (forced-colors: none)',
            ifMatch: 'more',
            ifNotMatch: 'standard',
          },
        },
        standard: { value: 'Standard' },
        high: { value: 'High' },
      },
    },
  },

  // optional, specify your own storage solution. localStorage is used by default.
  storage: ({ abortController }: { abortController?: AbortController }) => {
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

			watch: (cb) => {
				const controller = new AbortController()

				window.addEventListener(
					'storage',
					(e) => {
						const persistedThemes = JSON.parse(e.newValue || 'null')
						cb(e.key, persistedThemes)
					},
					{
						signal: abortController
							? AbortSignal.any([abortController.signal, controller.signal])
							: controller.signal,
					},
				)

				return () => {
					controller.abort()
				}
			},
		}
	}
})
```

### `getThemeStore`

```ts
import { getThemeStore } from 'palettez'

const themeStore = getThemeStore('palettez')
```

### ThemeStore's Properties & Methods

```ts
themeStore.getThemes() // { colorScheme: 'system', contrast: 'standard' }
themeStore.getResolvedThemes() // { colorScheme: 'light', contrast: 'standard' }
themeStore.setThemes({ contrast: 'high' })
await themeStore.restore() // restore persisted theme selection
themeStore.sync() // useful for syncing theme selection across tabs and windows
themeStore.subscribe((themes, resolvedThemes) => { /* ... */ }) // return unsubscribe function
```
