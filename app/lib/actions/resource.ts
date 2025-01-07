'use server';

import { db } from '../db/init';
import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '../db/schema/resources';

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);

    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();

    return 'Resource successfully created.';
  } catch (e) {
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : 'Error, please try again.';
  }
};