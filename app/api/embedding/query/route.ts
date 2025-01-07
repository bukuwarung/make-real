import { createResource } from '../../../lib/actions/resource';
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '../../../lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.info('Processing embedding query request');
    const { messages } = await req.json();
    
    console.debug('Generating text with OpenAI', { messageCount: messages.length });
    const result = generateText({
      model: openai('gpt-4o'),
      prompt: `I am designing a web page FAQ section. The structure includes:
    1. A FAQSection as the main wrapper with the title 'Frequently Asked Questions' and a list of FAQ items.
    2. FAQItem as the content of FAQSection, displaying a question as text, an answer as rich text, and metadata with tags and user info.
    3. Tag for labels like 'Popular' or 'New' with customizable styles.
    4. Avatar for user information, showing the user's profile picture with alt text.
    5. Typography for styled text, supporting headings and paragraphs for questions and answers.
    6. Card as the container for the FAQSection, providing a bordered box with a title.
    
    I want embedding vectors to represent this structure and components for building or searching relevant designs.`,
      system: `You are a helpful assistant. Check your knowledge base before answering any questions.
      Only respond to questions using information from tool calls.
      if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
      tools: {
        addResource: tool({
          description: `add a resource to your knowledge base.
            If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
          parameters: z.object({
            content: z
              .string()
              .describe('the content or resource to add to the knowledge base'),
          }),
          execute: async ({ content }) => {
            console.debug('Adding resource to knowledge base', { contentLength: content?.length });
            if (typeof content !== 'string') {
              return createResource({ content });
            }
          },
        }),
        getInformation: tool({
          description: `get information from your knowledge base to answer questions.`,
          parameters: z.object({
            question: z.string().describe('the users question'),
          }),
          execute: async ({ question }) => {
            console.debug('Searching knowledge base', { question });
            return findRelevantContent(question);
          },
        }),
      },
    });

    const response = await result;
    console.info('Successfully processed embedding query', response.responseMessages[0].content);
    return response.responseMessages;
  } catch (error) {
    console.error('Error processing embedding query', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}
