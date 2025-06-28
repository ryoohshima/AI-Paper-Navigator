export interface Paper {
  id: string
  arxivId?: string | null
  pubmedId?: string | null
  title: string
  abstract: string
  authors: string[]
  publishedDate?: Date | null
  journal?: string | null
  doi?: string | null
  categories: string[]
  url?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SearchRequest {
  query: string
  limit?: number
  sources?: ('arxiv' | 'pubmed')[]
}

export interface SearchResponse {
  query: string
  response: string
  papers: Paper[]
  totalCount: number
}

export interface ArxivPaper {
  id: string
  title: string
  summary: string
  authors: { name: string }[]
  published: string
  updated: string
  categories: string[]
  doi?: string
  journal_ref?: string
  pdf_url: string
}

export interface PubmedPaper {
  pmid: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  pubdate: string
  doi?: string
}