import { type MetaFunction, Outlet } from '@remix-run/react'
import type * as React from 'react'
import './style.css'

export const meta: MetaFunction = () => {
	return [{ title: 'Palettez Remix Demo' }]
}

export function Layout({ children }: { children: React.ReactNode }) {
	return children
}

export default function App() {
	return <Outlet />
}
