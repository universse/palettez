import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../style.css'

export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<title>Palettez Next.js Pages Router Demo</title>
				<meta name='viewport' content='width=device-width, initial-scale=1' />
			</Head>
			<Component {...pageProps} />
		</>
	)
}
