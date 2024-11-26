import {
	Accordion,
	AccordionProps,
	Alert,
	Button,
	CardWrapper,
	Divider,
	Icon,
	Spacer,
	TextField,
} from '@bukuwarung/bwdl'
import { Dropdown } from 'antd'
import { useState } from 'react'
import { useEditor } from 'tldraw'

export function CustomTopPanel() {
	const editor = useEditor()

	const [searchKeyword, setSearchKeyword] = useState('')

	const renderTemplatesMenu = (_: React.ReactNode) => (
		<CardWrapper width="500px" padding="16px" className="custom-top-panel">
			<div className="w-full">
				<Spacer type="wrapper" direction="vertical" size={16}>
					<h3 className="font-roboto text-sm font-bold">Use existing templates</h3>
					<div className="grid grid-cols-2 gap-4">
						<Spacer type="wrapper" direction="vertical" size={16}>
							<h4 className="font-roboto text-sm">listing Page</h4>
						</Spacer>
						<Spacer type="wrapper" direction="vertical" size={16}>
							<h4 className="font-roboto text-sm">Detail Page</h4>
						</Spacer>
					</div>
				</Spacer>
			</div>
		</CardWrapper>
	)

	const renderComponentsMenu = (_: React.ReactNode) => (
		<CardWrapper width="500px" padding="16px" className="custom-top-panel">
			<div className="w-full">
				<Spacer type="wrapper" direction="vertical" size={16}>
					<TextField
						placeholder="Search components"
						value={searchKeyword}
						onChange={(value) => setSearchKeyword(value)}
						allowClear
					/>
					<Accordion
						items={components.filter((item) =>
							item.key.toString().toLowerCase().includes(searchKeyword.toLowerCase())
						)}
					/>
				</Spacer>
			</div>
		</CardWrapper>
	)

	return (
		<div
			className="mt-2 grid grid-cols-3 bg-white gap-2 custom-top-panel"
			style={{ cursor: 'pointer', zIndex: 100000, pointerEvents: 'all' }}
		>
			<Button type="outlined-secondary" icon="square-outline">
				Frame
			</Button>
			<Dropdown trigger={['click']} dropdownRender={renderTemplatesMenu} placement="bottomCenter">
				<Button type="outlined-secondary" icon="file-text-outline">
					Templates
				</Button>
			</Dropdown>
			<Dropdown trigger={['click']} dropdownRender={renderComponentsMenu} placement="bottomRight">
				<Button type="outlined-secondary" icon="box-outline">
					Components
				</Button>
			</Dropdown>
		</div>
	)
}

const components: AccordionProps['items'] = [
	{
		key: 'Accordion',
		label: 'Accordion',
		children: (
			<Accordion
				items={[
					{
						key: 'AccordionItem1',
						label: 'Accordion Item 1',
						children: <div>Accordion Item 1</div>,
					},
				]}
			/>
		),
	},
	{
		key: 'Alert',
		label: 'Alert',
		children: <Alert message="Alert" />,
	},
	{
		key: 'Button',
		label: 'Button',
		children: <Button type="filled">Button</Button>,
	},
	{
		key: 'Card Wrapper',
		label: 'Card Wrapper',
		children: (
			<CardWrapper width="200px" padding="16px">
				<div>Card Wrapper</div>
			</CardWrapper>
		),
	},
	{
		key: 'Divider',
		label: 'Divider',
		children: <Divider />,
	},
	{
		key: 'Icon',
		label: 'Icon',
		children: <Icon name="box-outline" />,
	},
]
