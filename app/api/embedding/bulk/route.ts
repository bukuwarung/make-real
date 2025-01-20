import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '../../../lib/ai/embedding'
import { db } from '../../../lib/db/init'
import { embeddings as embeddingsTable } from '../../../lib/db/schema/embeddings'
import { resources } from '../../../lib/db/schema/resources'

interface Component {
	name: string
	description: string
	props: Record<string, any>
	componentTypeName?: string
}

const MAX_CHUNK_LENGTH = 1000 // Maximum characters per chunk

function chunkText(text: string, maxLength: number): string[] {
	if (text.length <= maxLength) return [text]

	const chunks: string[] = []
	let currentIndex = 0

	while (currentIndex < text.length) {
		// Find a good breaking point (end of sentence or space)
		let endIndex = Math.min(currentIndex + maxLength, text.length)
		if (endIndex < text.length) {
			const lastPeriod = text.lastIndexOf('.', endIndex)
			const lastSpace = text.lastIndexOf(' ', endIndex)
			endIndex =
				lastPeriod > currentIndex ? lastPeriod + 1 : lastSpace > currentIndex ? lastSpace : endIndex
		}

		chunks.push(text.slice(currentIndex, endIndex).trim())
		currentIndex = endIndex
	}

	return chunks
}

export async function POST(req: NextRequest) {
	try {
		console.log('Starting bulk embedding process', req)

		// Parse the incoming JSON
		const schema = await req.json()
		console.log(`Received schema with ${schema.components?.length || 0} components`)

		if (!Array.isArray(schema.components)) {
			console.warn('Invalid schema format: components array not found')
			return NextResponse.json(
				{ error: 'Invalid schema format: components array not found' },
				{ status: 400 }
			)
		}

		console.log('Generating embeddings for components in parallel...')
		// Process each component in parallel
		const processedComponents = await Promise.all(
			schema.components.flatMap(async (component: Component) => {
				console.log(`Processing component: ${component.name}`)
				const description = component.description || ''
				const chunks = chunkText(description, MAX_CHUNK_LENGTH)

				return Promise.all(
					chunks.map(async (chunk, index) => {
						const content = JSON.stringify({
							...component,
							chunkIndex: index,
							totalChunks: chunks.length,
						})

						const embeddingResponse = await generateEmbedding(chunk, content)
						console.log(
							`Generated embedding for component: ${component.name} (chunk ${index + 1}/${
								chunks.length
							})`
						)

						// Add validation to ensure we have both content and embedding
						if (!embeddingResponse?.embedding) {
							throw new Error(`Failed to generate embedding for component: ${component.name}`)
						}

						if (!content) {
							throw new Error(`Failed to stringify content for component: ${component.name}`)
						}

						return {
							content: content,
							embedding: embeddingResponse.embedding,
						}
					})
				)
			})
		)
		console.log(`Successfully processed ${processedComponents.length} components`)

		console.log('Parsing and validating schema content')
		// const { content } = insertResourceSchema.parse({ test: 'test' })

		// if (typeof content !== 'string') {
		// 	console.error('Content validation failed: content must be a string')
		// 	throw new Error('Content must be a string')
		// }

		console.log('Inserting resource into database')
		const [resource] = await db
			.insert(resources)
			.values({ content: JSON.stringify(schema) })
			.returning()
		console.log(`Created resource with ID: ${resource.id}`)

		console.log('Inserting embeddings into database')
		await db.insert(embeddingsTable).values(
			processedComponents.flat().map((embedding) => ({
				resourceId: resource.id,
				...embedding,
			}))
		)
		console.log(`Successfully stored ${processedComponents.length} embeddings`)

		return NextResponse.json({
			success: true,
			data: 'Resource successfully created and embedded',
		})
	} catch (error) {
		console.error('Error processing components:', error)
		return NextResponse.json({ error: 'Failed to process components' }, { status: 500 })
	}
}

// Configure larger payload size limit since schema.json might be large
export const config = {
	api: {
		bodyParser: {
			sizeLimit: '10mb',
		},
	},
}
