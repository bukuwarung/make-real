import { openai } from '@ai-sdk/openai'
import { embed, embedMany } from 'ai'
import { sql } from 'drizzle-orm'
import { cosineDistance, desc, gt } from 'drizzle-orm/sql'
import fs from 'fs'
import path from 'path'
import { db } from '../db/init'
import { embeddings } from '../db/schema/embeddings'

const embeddingModel = openai.embedding('text-embedding-ada-002')

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
			similarity,
		})
		.from(embeddings)
		.where(gt(similarity, 0.3))
		.orderBy(desc(similarity))
		.limit(10)

	// Parse and return the results
	return results.map((result) => {
		const component = JSON.parse(result.content)
		console.log({
			name: component.name,
			similarity: result.similarity,
		})
		return {
			name: component.name,
			description: component.description,
			props: component.props,
			similarity: result.similarity,
		}
	})
}
