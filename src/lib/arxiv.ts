import { ArxivPaper } from '@/types/paper'

const ARXIV_API_BASE = process.env.ARXIV_API_BASE_URL || 'http://export.arxiv.org/api/query'

export async function searchArxivPapers(query: string, maxResults: number = 10): Promise<ArxivPaper[]> {
  try {
    const searchParams = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: maxResults.toString(),
      sortBy: 'relevance',
      sortOrder: 'descending'
    })

    const response = await fetch(`${ARXIV_API_BASE}?${searchParams}`)
    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.status}`)
    }

    const xmlText = await response.text()
    return parseArxivXML(xmlText)
  } catch (error) {
    console.error('Error searching ArXiv papers:', error)
    throw error
  }
}

function parseArxivXML(xmlText: string): ArxivPaper[] {
  // Simple XML parsing for ArXiv API response
  // In production, consider using a proper XML parser like 'fast-xml-parser'
  const papers: ArxivPaper[] = []
  
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryXml = match[1]
    
    try {
      const paper: ArxivPaper = {
        id: extractXMLValue(entryXml, 'id')?.replace('http://arxiv.org/abs/', '') || '',
        title: extractXMLValue(entryXml, 'title')?.replace(/\s+/g, ' ').trim() || '',
        summary: extractXMLValue(entryXml, 'summary')?.replace(/\s+/g, ' ').trim() || '',
        authors: extractAuthors(entryXml),
        published: extractXMLValue(entryXml, 'published') || '',
        updated: extractXMLValue(entryXml, 'updated') || '',
        categories: extractCategories(entryXml),
        doi: extractXMLValue(entryXml, 'arxiv:doi'),
        journal_ref: extractXMLValue(entryXml, 'arxiv:journal_ref'),
        pdf_url: extractPdfUrl(entryXml)
      }
      
      if (paper.id && paper.title) {
        papers.push(paper)
      }
    } catch (error) {
      console.warn('Error parsing ArXiv entry:', error)
    }
  }

  return papers
}

function extractXMLValue(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : undefined
}

function extractAuthors(xml: string): { name: string }[] {
  const authorRegex = /<author>\s*<name>([^<]+)<\/name>/g
  const authors: { name: string }[] = []
  let match

  while ((match = authorRegex.exec(xml)) !== null) {
    authors.push({ name: match[1].trim() })
  }

  return authors
}

function extractCategories(xml: string): string[] {
  const categoryRegex = /<category\s+term="([^"]+)"/g
  const categories: string[] = []
  let match

  while ((match = categoryRegex.exec(xml)) !== null) {
    categories.push(match[1])
  }

  return categories
}

function extractPdfUrl(xml: string): string {
  const linkRegex = /<link\s+href="([^"]+)"\s+type="application\/pdf"/
  const match = xml.match(linkRegex)
  return match ? match[1] : ''
}