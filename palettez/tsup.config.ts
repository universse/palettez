import { defineConfig } from 'tsup'
import { name as packageName } from './package.json'

export default defineConfig([
	{
		clean: true,
		dts: true,
		entry: {
			[packageName]: 'src/umd.ts',
		},
		globalName: packageName,
		format: ['iife'],
		outExtension() {
			return { js: '.min.js' }
		},
		minify: true,
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
		minify: true,
	},
	{
		clean: true,
		dts: true,
		entry: ['src/index.ts', 'src/react.ts'],
		format: ['esm', 'cjs'],
		minify: true,
	},
])
