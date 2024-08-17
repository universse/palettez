import { defineConfig } from 'tsup'
import { name as packageName } from './package.json'

export default defineConfig([
	{
		clean: true,
		entry: {
			[packageName]: 'src/umd.ts',
		},
		globalName: packageName,
		format: ['iife'],
		outExtension() {
			return { js: '.min.js' }
		},
		minify: !!process.env.CI,
	},
	{
		clean: true,
		entry: {
			[packageName]: 'src/umd.ts',
		},
		globalName: packageName,
		format: ['iife'],
		outExtension() {
			return { js: '.min.txt' }
		},
		minify: !!process.env.CI,
	},
	{
		clean: true,
		dts: true,
		entry: ['src/index.ts', 'src/react.ts'],
		format: ['esm', 'cjs'],
		minify: !!process.env.CI,
	},
])
