'use client'

import { useValue } from "tldraw"

export default function Page() {
	const config = useValue('config', () => {}, [])
	return <></>
}
