import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '../../../lib/ai/embedding'
import { db } from '../../../lib/db/init'
import { insertResourceSchema, resources } from '../../../lib/db/schema/resources'
import { embeddings as embeddingsTable } from '../../../lib/db/schema/embeddings';

interface Component {
	name: string
	description: string
	props: Record<string, any>
	componentTypeName?: string
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
			schema.components.map(async (component: Component) => {
				console.log(`Processing component: ${component.name}`)
				// Get embedding for component description
				const embeddingResponse = await generateEmbedding(
					component.description || '',
					JSON.stringify(component)
				)
				console.log(`Generated embedding for component: ${component.name}`)

				return {
					content: JSON.stringify(component),
					embedding: embeddingResponse.embedding,
				}
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
		const [resource] = await db.insert(resources).values({ content: JSON.stringify(schema) }).returning()
		console.log(`Created resource with ID: ${resource.id}`)

		console.log('Inserting embeddings into database')
        await db.insert(embeddingsTable).values(
            processedComponents.map(embedding => ({
              resourceId: resource.id,
              ...embedding,
            })),
          );
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
