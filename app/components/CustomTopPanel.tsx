import {
	Accordion,
	Alert,
	Button,
	CardWrapper,
	Checkbox,
	DatePicker,
	DateRangePicker,
	Divider,
	Icon,
	Pagination,
	Radio,
	Select,
	Spacer,
	Switch,
	Table,
	Tabs,
	Tag,
	TextArea,
	TextField,
	Typography,
} from '@bukuwarung/bwdl'
import { COLORS } from '@bukuwarung/bwdl/constants'
import { Fragment, useState } from 'react'
import { useEditor } from 'tldraw'
import { TopPanelDropdown } from './TopPanelDropdown'

export function CustomTopPanel() {
	const editor = useEditor()
	const [selectedComponent, setSelectedComponent] = useState<string>()

	const [searchKeyword, setSearchKeyword] = useState('')
	const [isDragging, setIsDragging] = useState(false)

	const filteredComponents = components.filter(
		(component) =>
			component.label.toLowerCase().includes(searchKeyword.toLowerCase()) ||
			component.category.toLowerCase().includes(searchKeyword.toLowerCase())
	)

	const groupedComponents = filteredComponents.reduce(
		(acc, component) => {
			acc[component.category] = acc[component.category] || []
			acc[component.category].push(component)
			return acc
		},
		{} as Record<string, typeof components>
	)

	const renderTemplatesMenu = (_: React.ReactNode) => (
		<>
			<Typography fontWeight="fontWeightStrong" className="text-sm p-4">
				Use existing templates
			</Typography>
			<Divider />
			<div className="grid grid-cols-2 gap-4 p-4">
				<Spacer type="wrapper" direction="vertical" size={16}>
					<Typography className="text-sm">listing Page</Typography>
				</Spacer>
				<Spacer type="wrapper" direction="vertical" size={16}>
					<Typography className="text-sm">Detail Page</Typography>
				</Spacer>
			</div>
		</>
	)

	const renderComponentsMenu = (_: React.ReactNode) =>
		selectedComponent ? (
			<>
				<div className="flex items-center gap-2 p-4">
					<Icon
						name="arrow-left-outline"
						size="sm"
						onClick={() => setSelectedComponent(undefined)}
					/>
					<Typography className="font-roboto">
						{components.find((component) => component.key === selectedComponent).label}
					</Typography>
					<div className="flex-grow"></div>
					<div
						draggable
						className="rounded-md"
						onDragStart={(e) => {
							setIsDragging(true)
							e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'web-editor-component', key: selectedComponent }))
						}}
						onDragEnd={(e) => {
							setIsDragging(false)
							e.preventDefault()
						}}
					>
						<Button type="outlined-primary" icon="mouse-pointer-outline" size='small' iconProps={{
							size: 'xs'
						}}>
							{isDragging ? 'Put me here?' : 'Drag to Use'}
						</Button>
					</div>
				</div>
				<Divider />
				<div className="p-4 overflow-y-auto flex-grow">
					<Spacer type="wrapper" direction="vertical" size={16}>
						{components.find((component) => component.key === selectedComponent)?.children}
					</Spacer>
				</div>
			</>
		) : (
			<>
				<div className="p-4">
					<TextField
						placeholder="Search components"
						value={searchKeyword}
						onChange={(value) => setSearchKeyword(value)}
						allowClear
					/>
				</div>
				<Divider />
				<div className="grid grid-cols-1 gap-2 p-4 flex-grow overflow-y-auto">
					{filteredComponents.length === 0 && (
						<Typography className="text-center">No components found</Typography>
					)}
					<Spacer type="wrapper" direction="vertical" size={12}>
						{Object.entries(groupedComponents).map(([category, components]) => (
							<Spacer key={category} type="wrapper" direction="vertical" size={8}>
								<Typography className="font-bold" color={COLORS.neutral['gray-600']}>
									{category}
								</Typography>
								<Divider dashed />
								<Spacer type="wrapper" direction="vertical" size={2}>
									{components.map((component) => (
										<Fragment key={component.key}>
											<div
												role="button"
												className="cursor-pointer flex items-center justify-between p-1.5 pl-2 hover:bg-neutral-100 rounded-md"
												onClick={() => setSelectedComponent(component.key)}
											>
												<Typography className="text-sm font-medium">{component.label}</Typography>
												<Icon name="arrow-right-outline" size="xs" />
											</div>
										</Fragment>
									))}
								</Spacer>
							</Spacer>
						))}
					</Spacer>
				</div>
			</>
		)

	return (
		<div
			className="mt-2 grid grid-cols-3 gap-2 custom-top-panel"
			style={{ cursor: 'pointer', zIndex: 100000, pointerEvents: 'all' }}
		>
			<Button
				type="outlined-secondary"
				icon="square-outline"
				onClick={() => editor.createShape({ type: 'web-editor-frame' })}
			>
				Frame
			</Button>
			<TopPanelDropdown trigger={['click']} dropdownRender={renderTemplatesMenu} placement="bottom">
				<Button type="outlined-secondary" icon="file-text-outline">
					Templates
				</Button>
			</TopPanelDropdown>
			<TopPanelDropdown
				trigger={['click']}
				dropdownRender={renderComponentsMenu}
				placement="bottomRight"
			>
				<Button type="outlined-secondary" icon="box-outline">
					Components
				</Button>
			</TopPanelDropdown>
		</div>
	)
}

const components = [
	{
		key: 'Accordion',
		category: 'Data Display',
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
		category: 'Feedback',
		label: 'Alert',
		children: <Alert message="Alert" />,
	},
	{
		key: 'Button',
		category: 'General',
		label: 'Button',
		children: <Button type="filled">Button</Button>,
	},
	{
		key: 'Card Wrapper',
		category: 'General',
		label: 'Card Wrapper',
		children: (
			<CardWrapper width="200px" padding="16px">
				<div>Card Wrapper</div>
			</CardWrapper>
		),
	},
	{
		key: 'Tag',
		category: 'General',
		label: 'Tag',
		children: <Tag>Tag</Tag>,
	},
	{
		key: 'Tabs',
		category: 'General',
		label: 'Tabs',
		children: (
			<Tabs
				activeTab="Tab 1"
				items={[
					{ key: 'Tab 1', label: 'Tab 1' },
					{ key: 'Tab 2', label: 'Tab 2' },
				]}
			/>
		),
	},
	{
		key: 'Typography',
		category: 'General',
		label: 'Typography',
		children: <Typography>Typography</Typography>,
	},
	{
		key: 'Icons',
		category: 'General',
		label: 'Icons',
		children: <Icon name="box-outline" />,
	},
	{
		key: 'Checkbox',
		category: 'Data Input',
		label: 'Checkbox',
		children: <Checkbox />,
	},
	{
		key: 'DatePicker',
		category: 'Data Input',
		label: 'DatePicker',
		children: <DatePicker size="sm" />,
	},
	{
		key: 'DateRangePicker',
		category: 'Data Input',
		label: 'DateRangePicker',
		children: <DateRangePicker size="sm" />,
	},
	{
		key: 'TextField',
		category: 'Data Input',
		label: 'TextField',
		children: <TextField placeholder="TextField" />,
	},
	{
		key: 'TextArea',
		category: 'Data Input',
		label: 'TextArea',
		children: <TextArea placeholder="TextArea" autoSize />,
	},
	{
		key: 'Radio',
		category: 'Data Input',
		label: 'Radio',
		children: <Radio value={true} />,
	},
	{
		key: 'Select',
		category: 'Data Input',
		label: 'Select',
		children: <Select options={[{ label: 'Option 1', value: 'option1' }]} placeholder="Select" />,
	},
	{
		key: 'Switch',
		category: 'Data Input',
		label: 'Switch',
		children: <Switch checked />,
	},
	{
		key: 'Pagination',
		category: 'Data Display',
		label: 'Pagination',
		children: <Pagination total={100} />,
	},
	{
		key: 'Table',
		category: 'Data Display',
		label: 'Table',
		children: (
			<Table
				columns={[
					{ key: 'name', title: 'Name', dataIndex: 'name' },
					{ key: 'age', title: 'Age', dataIndex: 'age' },
				]}
				data={[
					{ key: '1', name: 'John Brown', age: 32 },
					{ key: '2', name: 'Jim Green', age: 42 },
					{ key: '3', name: 'Joe Black', age: 32 },
				]}
			/>
		),
	},
	{
		key: 'Form Builder',
		category: 'Advanced',
		label: 'Form Builder',
		children: <>Coming Soon...</>,
	},
]
