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

- [Astro](https://palettez-astro-demo.vercel.app)
- [Next.js](https://palettez-nextjs-demo.vercel.app)
- [Remix](https://palettez-remix-demo.vercel.app)

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
  ;(async () => {
    const themeStore = window.palettez.createThemeStore({
      config: {
        colorScheme: [
          {
            value: 'system',
            media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
          },
          'light',
          'dark',
        ],
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
    colorScheme: [
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
      'light',
      'dark',
    ],
    contrast: [
      {
        value: 'system',
        media: [
          '(prefers-contrast: more) and (forced-colors: none)',
          'high',
          'standard',
        ],
      },
      'standard',
      'high',
    ],
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
const unsubscribe = themeStore.subscribe((themes, resolvedThemes) => { /* ... */ })
themeStore.destroy()
```
