import { Button } from '@bukuwarung/bwdl'
import { useDialogs } from 'tldraw'
import { useMakeReal } from '../hooks/useMakeReal'
import { SettingsDialog } from './SettingsDialog'

export const maxDuration = 120

export function MakeRealButton() {
	const { addDialog } = useDialogs()

	const makeReal = useMakeReal()

	const deployPage = () => {
		console.log('deploy page')
	}

	return (
		<div
			style={{ display: 'flex', zIndex: 100000, pointerEvents: 'all' }}
			className="p-2 gap-2 items-center"
		>
			<Button
				type="outlined-secondary"
				onClick={() =>
					addDialog({
						id: 'api keys',
						component: SettingsDialog,
					})
				}
				icon="settings-outline"
			></Button>

			<Button type="outlined-primary" onClick={makeReal} icon="cloud-lightning-outline"></Button>

			<Button type="outlined-primary" onClick={deployPage} icon="upload-outline"></Button>
		</div>
	)
}
