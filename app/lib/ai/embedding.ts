import fs from 'fs';
import { embed, EmbeddingModel, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import path from 'path';
import { embeddings }from '../db/schema/embeddings';
import { sql } from 'drizzle-orm';
import { cosineDistance, desc, gt } from 'drizzle-orm/sql';
import { db } from '../db/init';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const getJson = () => {
    const json = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
    return JSON.parse(json);
}

const generateChunks = (input: JSON): string[] => {
  return Object.keys(input)
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(getJson());

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks, 
  });

  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (
  value: string,
  content: string,
) => {
  const { embedding } = await embed({
    model: embeddingModel,
    value,
  });

  embedding

  return { embedding, content };
};


export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery, '');
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded.embedding,
  )})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy(t => desc(t.similarity))
    .limit(4);
  return similarGuides;
};