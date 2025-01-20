import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { generateEmbedding } from '../../../lib/ai/embedding';
import { db } from '../../../lib/db/init';
import { resources } from '../../../lib/db/schema/resources';
import { embeddings as embeddingsTable } from '../../../lib/db/schema/embeddings';

interface DocSection {
  title: string;
  content: string;
  references: Array<{
    name: string;
    link: string;
    type: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the HTML content
    const response = await fetch(url);
    const html = await response.text();

    // Parse with jsdom
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract TypeDoc specific content
    const sections: DocSection[] = [];
    const panels = document.querySelectorAll('.tsd-panel');

    panels.forEach(panel => {
      // Use Readability for main content extraction
      const clonedPanel = panel.cloneNode(true) as HTMLElement;
      const reader = new Readability(new JSDOM(clonedPanel.outerHTML).window.document);
      const article = reader.parse();

      if (!article) return;

      // Extract references
      const references = Array.from(panel.querySelectorAll('a[href]')).map(ref => ({
        name: ref.textContent?.trim() || '',
        link: (ref as HTMLAnchorElement).href,
        type: ref.classList.contains('tsd-kind-reference') ? 'reference' : 
              ref.classList.contains('tsd-is-inherited') ? 'inherited' : 'link'
      })).filter(ref => ref.name && ref.link);

      sections.push({
        title: article.title || panel.querySelector('.tsd-panel-header')?.textContent?.trim() || '',
        content: article.textContent,
        references
      });
    });

    // Filter out empty sections
    const validSections = sections.filter(section => 
      section.content && section.content.trim().length > 0
    );

    if (validSections.length === 0) {
      return NextResponse.json({ error: 'No valid content found' }, { status: 400 });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const processedSections = await Promise.all(
      validSections.map(async (section) => {
        const docs = await splitter.createDocuments([section.content]);
        
        return Promise.all(docs.map(async (doc) => {
          if (!doc.pageContent.trim()) return null;

          const contextualContent = {
            content: doc.pageContent,
            title: section.title || 'Untitled Section',
            references: section.references,
            sourceUrl: url
          };

          const embeddingResponse = await generateEmbedding(
            contextualContent.title || url,
            JSON.stringify(contextualContent)
          );

          return {
            content: JSON.stringify(contextualContent),
            embedding: embeddingResponse.embedding,
          };
        }));
      })
    );

    const processedDocs = processedSections.flat().filter(Boolean);

    if (processedDocs.length === 0) {
      return NextResponse.json({ error: 'No valid content to process' }, { status: 400 });
    }

    // Store in database
    const [resource] = await db
      .insert(resources)
      .values({ 
        content: JSON.stringify({ 
          url, 
          sections: validSections
        }) 
      })
      .returning();

    await db.insert(embeddingsTable).values(
      processedDocs.map(doc => ({
        resourceId: resource.id,
        ...doc,
      }))
    );

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Documentation processed',
        chunkCount: processedDocs.length,
        sectionCount: validSections.length
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process documentation' }, { status: 500 });
  }
}