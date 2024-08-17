import react from '@astrojs/react'
import vercel from '@astrojs/vercel/serverless'
import { defineConfig } from 'astro/config'

export default defineConfig({
	adapter: vercel(),
	integrations: [react()],
	output: 'hybrid',
})
