import { openai } from '@ai-sdk/openai'
import { cosineSimilarity, embed, embedMany } from 'ai'
import { sql } from 'drizzle-orm'
import { cosineDistance, desc, gt, gte } from 'drizzle-orm/sql'
import fs from 'fs'
import path from 'path'
import { db } from '../db/init'
import { embeddings } from '../db/schema/embeddings'

const embeddingModel = openai.embedding('text-embedding-3-small')

const getJson = () => {
	const json = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8')
	return JSON.parse(json)
}

const generateChunks = (input: JSON): string[] => {
	return Object.keys(input).filter((i) => i !== '')
}

export const generateEmbeddings = async (
	value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
	const chunks = generateChunks(getJson())

	const { embeddings } = await embedMany({
		model: embeddingModel,
		values: chunks,
	})

	return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }))
}

export const generateEmbedding = async (value: string, content: string) => {
	const { embedding } = await embed({
		model: embeddingModel,
		value,
	})

	return { embedding, content }
}

export const findRelevantContent = async (userQuery: string) => {
	const { embedding } = await generateEmbedding(userQuery, '')

	const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, embedding)})`

	const results = await db
		.select({
			content: embeddings.content,
			embedding: embeddings.embedding,
			similarity: similarity,
		})
		.from(embeddings)
		.where(gt(similarity, 0.7))
		.orderBy(desc(similarity))
		.limit(10)

	const context = results.map((result) => ({
		document: result.content,
		similarity: cosineSimilarity(embedding, result.embedding),
	})).filter((c) => c.similarity > 0.8)

	console.log('context', userQuery, context)
	console.log('results', results)

	// Parse and return the results
	return results.map((result) => {
		const component = JSON.parse(result.content)
		// console.log({
		// 	name: component.name,
		// 	similarity: result.similarity,
		// })
		return {
			name: component.name,
			description: component.description,
			props: component.props,
			similarity: result.similarity,
		}
	})
}
