import type { MetaFunction } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import './style.css'

export const meta: MetaFunction = () => {
	return [{ title: 'Demo with Remix' }]
}

export function Layout({ children }: { children: React.ReactNode }) {
	return children
}

export default function App() {
	return <Outlet />
}
