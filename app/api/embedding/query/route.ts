import { createOpenAI } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findRelevantContent } from '../../../lib/ai/embedding'

export async function POST(req: Request) {
	const openai = createOpenAI({
		// example fetch wrapper that logs the input to the API call:
		fetch: async (url, options) => {
			console.log('URL', url)
			// console.log(`Body ${JSON.stringify(JSON.parse(options!.body! as string), null, 2)}`)
			return await fetch(url, options)
		},
	})

	try {
		const formData = await req.formData()
		// const prompt = formData.get('prompt');
		const imageFile = formData.get('image')

		if (!imageFile || !(imageFile instanceof File)) {
			throw new Error('Image file is required')
		}

		// Convert image file to base64 or buffer if needed
		const imageBuffer = await imageFile.arrayBuffer()
		const imageBase64 = Buffer.from(imageBuffer).toString('base64')

		// Configure the AI response generation
		const result = await generateText({
			// model: openai('gpt-4o-mini-2024-07-18'),
			model: openai('gpt-4o'),
			messages: [
				{
					role: 'system',
					content: `You are a web component analyzer. You are given an image and you need to find the component and the properties needed to build a layout for the following image. use the tools to find the component.`,
				},
				{
					role: 'user',
					content: `What is the component and the properties needed to build a layout for the following image?`,
				},
				{
					role: 'user',
					content: [
						{
							type: 'image',
							image: imageBase64,
						},
					],
				},
			],
			tools: {
				findComponent: tool({
					description: 'Search for a specific component in the knowledge base',
					parameters: z.object({
						componentDescription: z
							.string()
							.describe('The description of the component to search for'),
					}),
					execute: async ({ componentDescription }) => {
						console.log('componentDescription', componentDescription)
						const results = await findRelevantContent(componentDescription)
						return JSON.stringify(results)
					},
				}),
			},
		})

		// Process the AI response
		const messages = result.responseMessages
		const finalMessage = messages[messages.length - 1]

		console.log('messages', messages)

		// Log token usage if available
		if (result.usage) {
			console.log('Token Usage:', {
				promptTokens: result.usage.promptTokens,
				completionTokens: result.usage.completionTokens,
				totalTokens: result.usage.totalTokens,
			})
		}

		// Extract component search results
		const componentResults = messages
			.filter(
				(msg) =>
					msg.role === 'tool' && msg.content.find((content) => content.toolName === 'findComponent')
			)
			.map((content) => content)
			.flat()

		// Parse and structure the final response
		const results = finalMessage.content

		return NextResponse.json({
			results,
			components: componentResults
				.map((content) =>
					Array.isArray(content.content) ? content.content.map((c) => JSON.parse(c.result)) : []
				)
				.flat()
				.flat(),
		})
	} catch (error) {
		console.error('Error analyzing prototype:', error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
