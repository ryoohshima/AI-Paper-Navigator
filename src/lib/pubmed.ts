import { PubmedPaper } from '@/types/paper'

const PUBMED_API_BASE = process.env.PUBMED_API_BASE_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const API_KEY = process.env.PUBMED_API_KEY

export async function searchPubmedPapers(query: string, maxResults: number = 10): Promise<PubmedPaper[]> {
  try {
    // Step 1: Search for PMIDs
    const pmids = await searchPubmedIds(query, maxResults)
    
    if (pmids.length === 0) {
      return []
    }

    // Step 2: Fetch paper details
    return await fetchPubmedDetails(pmids)
  } catch (error) {
    console.error('Error searching PubMed papers:', error)
    throw error
  }
}

async function searchPubmedIds(query: string, maxResults: number): Promise<string[]> {
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: maxResults.toString(),
    retmode: 'json',
    sort: 'relevance'
  })

  if (API_KEY) {
    searchParams.append('api_key', API_KEY)
  }

  const response = await fetch(`${PUBMED_API_BASE}/esearch.fcgi?${searchParams}`)
  
  if (!response.ok) {
    throw new Error(`PubMed search API error: ${response.status}`)
  }

  const data = await response.json()
  return data.esearchresult?.idlist || []
}

async function fetchPubmedDetails(pmids: string[]): Promise<PubmedPaper[]> {
  const summaryParams = new URLSearchParams({
    db: 'pubmed',
    id: pmids.join(','),
    retmode: 'json'
  })

  if (API_KEY) {
    summaryParams.append('api_key', API_KEY)
  }

  const response = await fetch(`${PUBMED_API_BASE}/esummary.fcgi?${summaryParams}`)
  
  if (!response.ok) {
    throw new Error(`PubMed summary API error: ${response.status}`)
  }

  const data = await response.json()
  const papers: PubmedPaper[] = []

  for (const pmid of pmids) {
    const paperData = data.result?.[pmid]
    if (paperData && paperData.title) {
      try {
        const paper: PubmedPaper = {
          pmid: pmid,
          title: paperData.title || '',
          abstract: await fetchPubmedAbstract(pmid),
          authors: parseAuthors(paperData.authors || []),
          journal: paperData.fulljournalname || paperData.source || '',
          pubdate: paperData.pubdate || '',
          doi: paperData.elocationid?.startsWith('doi:') 
            ? paperData.elocationid.replace('doi:', '') 
            : undefined
        }
        papers.push(paper)
      } catch (error) {
        console.warn(`Error processing PubMed paper ${pmid}:`, error)
      }
    }
  }

  return papers
}

async function fetchPubmedAbstract(pmid: string): Promise<string> {
  try {
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      retmode: 'xml'
    })

    if (API_KEY) {
      fetchParams.append('api_key', API_KEY)
    }

    const response = await fetch(`${PUBMED_API_BASE}/efetch.fcgi?${fetchParams}`)
    
    if (!response.ok) {
      return ''
    }

    const xmlText = await response.text()
    
    // Extract abstract from XML
    const abstractRegex = /<AbstractText[^>]*>([\\s\\S]*?)<\\/AbstractText>/gi
    const matches = xmlText.match(abstractRegex)
    
    if (matches) {
      return matches
        .map(match => match.replace(/<[^>]*>/g, '').trim())
        .join(' ')
        .replace(/\\s+/g, ' ')
        .trim()
    }

    return ''
  } catch (error) {
    console.warn(`Error fetching abstract for ${pmid}:`, error)
    return ''
  }
}

function parseAuthors(authorsData: any[]): string[] {
  if (!Array.isArray(authorsData)) {
    return []
  }

  return authorsData
    .map(author => {
      if (typeof author === 'string') {
        return author
      }
      if (author.name) {
        return author.name
      }
      return ''
    })
    .filter(name => name.length > 0)
}