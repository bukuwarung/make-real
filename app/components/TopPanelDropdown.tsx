import { CardWrapper } from '@bukuwarung/bwdl'
import { Dropdown, DropdownProps } from 'antd'

export function TopPanelDropdown(props: DropdownProps) {
	return (
		<Dropdown
			{...props}
			dropdownRender={(menu) =>
				props.dropdownRender ? (
					<CardWrapper width="500px" padding="0" className="custom-top-panel select-none">
						<div className="w-full h-full max-h-[400px] overflow-hidden flex flex-col">
							{props.dropdownRender(menu)}
						</div>
					</CardWrapper>
				) : undefined
			}
		/>
	)
}
