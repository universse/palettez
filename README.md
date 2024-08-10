# Palettez

A flexible and powerful theme management library for JavaScript applications

## Features

- Manage parallel themes with multiple options, for eg:
  - Color scheme: light, dark, system
  - Contrast preference: standard, high
  - Spacing: compact, comfortable, spacious
- Persist theme selection to client or server storage
- No theme flicker on page load
- Dynamically change themes based on system settings
- Sync theme selection across tabs and windows

## Demo

- Client-side persistence with localStorage and server-side persistence with cookies

  [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/universse/palettez/tree/main/demo?title=Palettez%20Demo&file=src%2Fpages%2Findex.astro,src%2Fpages%2Fssr.astro)

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

For client-side persistence (eg. localStorage), it's recommended to initialize Palettez in a synchronous script to avoid theme flicker on page load. If your project's bundler supports importing static asset as string, you can inline the minified version of Palettez to reduce the number of HTTP requests. Check out the demo for example usage with Astro and Vite.

```html
<script src="https://unpkg.com/palettez"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/palettez"></script>

<script>
  ;(() => {
    const themeManager = window.palettez.create({
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

    themeManager.subscribe((_, resolvedThemes) => {
      Object.entries(resolvedThemes).forEach(([theme, optionKey]) => {
        document.documentElement.dataset[theme] = optionKey
      })
    })

    await themeManager.restore()
    themeManager.sync()
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

### `create`

```ts
import { create } from 'palettez'

const themeManager = create({
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
  getStorage: () => {
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

      // optional, useful for syncing theme selection across tabs and windows
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
  }
})
```

### `read`

```ts
import { read } from 'palettez'

const themeManager = read('palettez')
```

### Methods

```ts
themeManager.getThemes() // { colorScheme: 'system', contrast: 'standard' }
themeManager.getResolvedThemes() // { colorScheme: 'light', contrast: 'standard' }
themeManager.setThemes({ contrast: 'high' })
themeManager.restore() // restore persisted theme selection
themeManager.sync() // useful for syncing theme selection across tabs and windows
themeManager.clear() // clear persisted theme selection
themeManager.subscribe((themes, resolvedThemes) => { /* ... */ })
```

## React Integration

Ensure that you have called `create` before `usePalettez`. Since Palettez is initialized in a synchronous script, `usePalettez` should only be used in a client-only component.

```tsx
import { usePalettez } from 'palettez/react'

export function ThemeSelect() {
  const { 
    themesAndOptions,
    themes,
    setThemes,
    
    getResolvedThemes,
    restore,
    sync,
    clear,
    subscribe,
  } = usePalettez('palettez')

  return themesAndOptions.map((theme) => (
    <div key={theme.key}>
      <label htmlFor={theme.key}>{theme.label}</label>
      <select
        id={theme.key}
        name={theme.key}
        onChange={(e) => {
          setThemes({ [theme.key]: e.target.value })
        }}
        value={themes[theme.key]}
      >
        {theme.options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.value}
          </option>
        ))}
      </select>
    </div>
  ))
}
```
