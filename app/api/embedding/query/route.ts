import { openai } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findRelevantContent } from '../../../lib/ai/embedding'

export async function POST(req: Request) {
	try {
		const formData = await req.formData()
		// const prompt = formData.get('prompt');
		const imageFile = formData.get('image')

		console.log(imageFile)

		if (!imageFile || !(imageFile instanceof File)) {
			throw new Error('Image file is required')
		}

		// Convert image file to base64 or buffer if needed
		const imageBuffer = await imageFile.arrayBuffer()
		const imageBase64 = Buffer.from(imageBuffer).toString('base64')

		// Configure the AI response generation
		const result = await generateText({
			model: openai('gpt-4o-mini-2024-07-18'),
			messages: [
				{
					role: 'system',
					content: `You are a UI prototype analyzer that converts design descriptions into structured component hierarchies. 
          For each component needed:
          1. Identify the component type and its role. Please use antd design system as reference.
          2. Layout is build with Grid Row and Col.
          3. Use the findRelevantContent tool to find matching components
          4. Create a structured hierarchy showing component relationships
          5. Include properties and configurations needed for each component
          
          Return the results as a JSON structure with:
          - components: An array of ComponentConfig objects, each with:
            - component: The type of component to render
            - props: An optional object containing properties for the component
              - children: An optional array of nested ComponentConfig objects or a string

          Example:
          {
            "components": [
              {
                "component": "Layout",
                "props": {
                  "children": [
                    {
                      "component": "Header",
                      "props": {
                        "title": "Welcome"
                      }
                    },
                    {
                      "component": "Content",
                      "props": {
                        "children": [
                          {
                            "component": "Text",
                            "props": {
                              "content": "This is a sample text."
                            }
                          },
                          {
                            "component": "Image",
                            "props": {
                              "src": "image-url.jpg"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }`,
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
				findRelevantContent: tool({
					description: 'Search for a specific type of component in the knowledge base',
					parameters: z.object({
						componentType: z.string().describe('The type of component to search for'),
					}),
					execute: async ({ componentType }) => {
						console.log('componentType', componentType)
						const results = await findRelevantContent(componentType)
						return JSON.stringify(results)
					},
				}),
			},
		})

		// Process the AI response
		const messages = result.responseMessages
		const finalMessage = messages[messages.length - 1]

		// Extract component search results
		const componentResults = messages
			.filter(
				(msg) =>
					msg.role === 'tool' &&
					msg.content.find((content) => content.toolName === 'findRelevantContent')
			)
			.map((content) => content)
			.flat()

		// console.log('final', finalMessage)

		// Parse and structure the final response
		const results = finalMessage.content

		return NextResponse.json({
			results,
			components: componentResults
				.map((content) =>
					Array.isArray(content.content)
						? content.content.map((c) => JSON.parse(c.result))
						: []
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
