import { ThemeSelect } from './_theme-select'
import { ThemeStoreProvider } from './_theme-store-provider'
import { ThemeWrapper } from './_theme-wrapper'

export function Page({ configsByKey, initialThemesByKey, themesAndOptions }) {
	return (
		<ThemeStoreProvider
			initialThemesByKey={initialThemesByKey}
			configsByKey={configsByKey}
		>
			<ThemeWrapper storeKey='app'>
				<main>
					<h1>Multi-store with no hydration mismatch</h1>
					<p>
						- User's preferred themes are persisted in cookies on the server and
						in memory on the client
						<br />- No system theme option and no client-side persistence, hence
						no sync script required and no hydration mismatch
						<br />- Theme selection is only saved upon form submission
					</p>
					<form autoComplete='off' method='post'>
						<ThemeSelect storeKey='app' themesAndOptions={themesAndOptions} />
						<button type='submit'>Save</button>
					</form>
					<br />
					<p>These 2 sections read from the same theme store</p>
					<div style={{ display: 'flex', gap: 16 }}>
						<ThemeWrapper storeKey='section1'>
							<form autoComplete='off' method='post'>
								<ThemeSelect
									storeKey='section1'
									themesAndOptions={themesAndOptions}
								/>
								<button type='submit'>Save</button>
							</form>
						</ThemeWrapper>
						<ThemeWrapper storeKey='section1'>
							<form autoComplete='off' method='post'>
								<ThemeSelect
									storeKey='section1'
									themesAndOptions={themesAndOptions}
								/>
								<button type='submit'>Save</button>
							</form>
						</ThemeWrapper>
					</div>
					<br />
					<ThemeWrapper storeKey='section2'>
						<form autoComplete='off' method='post'>
							<ThemeSelect
								storeKey='section2'
								themesAndOptions={themesAndOptions}
							/>
							<button type='submit'>Save</button>
						</form>
					</ThemeWrapper>

					<br />
					<p>
						<b>Demo links</b>
					</p>
					<a href='/'>Basic usage &rarr;</a>
					<br />
					<a href='/multi-store-with-server-persistence'>
						Multi-store with server persistence &rarr;
					</a>
					<br />
					<a href='/no-hydration-mismatch'>
						Multi-store with no hydration mismatch &rarr;
					</a>
				</main>
			</ThemeWrapper>
		</ThemeStoreProvider>
	)
}
