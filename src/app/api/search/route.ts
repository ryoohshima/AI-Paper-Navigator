import { NextRequest, NextResponse } from 'next/server'
import { searchArxivPapers } from '@/lib/arxiv'
import { searchPubmedPapers } from '@/lib/pubmed'
import { prisma } from '@/lib/prisma'
import { Paper, SearchRequest, SearchResponse } from '@/types/paper'

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    const { query, limit = 10, sources = ['arxiv', 'pubmed'] } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Search papers from external APIs
    const searchPromises = []
    
    if (sources.includes('arxiv')) {
      searchPromises.push(searchArxivPapers(query, Math.ceil(limit / sources.length)))
    }
    
    if (sources.includes('pubmed')) {
      searchPromises.push(searchPubmedPapers(query, Math.ceil(limit / sources.length)))
    }

    const results = await Promise.allSettled(searchPromises)
    const papers: Paper[] = []

    // Process ArXiv results
    if (sources.includes('arxiv') && results[0]?.status === 'fulfilled') {
      const arxivPapers = results[0].value
      for (const arxivPaper of arxivPapers) {
        try {
          // Save or update paper in database
          const paper = await prisma.paper.upsert({
            where: { arxivId: arxivPaper.id },
            update: {
              title: arxivPaper.title,
              abstract: arxivPaper.summary,
              authors: arxivPaper.authors.map(a => a.name),
              publishedDate: new Date(arxivPaper.published),
              journal: arxivPaper.journal_ref || null,
              doi: arxivPaper.doi || null,
              categories: arxivPaper.categories,
              url: arxivPaper.pdf_url || null,
            },
            create: {
              arxivId: arxivPaper.id,
              title: arxivPaper.title,
              abstract: arxivPaper.summary,
              authors: arxivPaper.authors.map(a => a.name),
              publishedDate: new Date(arxivPaper.published),
              journal: arxivPaper.journal_ref || null,
              doi: arxivPaper.doi || null,
              categories: arxivPaper.categories,
              url: arxivPaper.pdf_url || null,
            },
          })
          papers.push(paper)
        } catch (error) {
          console.error('Error saving ArXiv paper:', error)
        }
      }
    }

    // Process PubMed results
    const pubmedResultIndex = sources.includes('arxiv') ? 1 : 0
    if (sources.includes('pubmed') && results[pubmedResultIndex]?.status === 'fulfilled') {
      const pubmedPapers = results[pubmedResultIndex].value
      for (const pubmedPaper of pubmedPapers) {
        try {
          // Save or update paper in database
          const paper = await prisma.paper.upsert({
            where: { pubmedId: pubmedPaper.pmid },
            update: {
              title: pubmedPaper.title,
              abstract: pubmedPaper.abstract,
              authors: pubmedPaper.authors,
              publishedDate: pubmedPaper.pubdate ? new Date(pubmedPaper.pubdate) : null,
              journal: pubmedPaper.journal,
              doi: pubmedPaper.doi || null,
              categories: [], // PubMed doesn't have categories like ArXiv
              url: pubmedPaper.doi ? `https://doi.org/${pubmedPaper.doi}` : null,
            },
            create: {
              pubmedId: pubmedPaper.pmid,
              title: pubmedPaper.title,
              abstract: pubmedPaper.abstract,
              authors: pubmedPaper.authors,
              publishedDate: pubmedPaper.pubdate ? new Date(pubmedPaper.pubdate) : null,
              journal: pubmedPaper.journal,
              doi: pubmedPaper.doi || null,
              categories: [],
              url: pubmedPaper.doi ? `https://doi.org/${pubmedPaper.doi}` : null,
            },
          })
          papers.push(paper)
        } catch (error) {
          console.error('Error saving PubMed paper:', error)
        }
      }
    }

    // Generate AI response (placeholder for now)
    const aiResponse = generateBasicResponse(papers, query)

    // Save search to database
    try {
      await prisma.search.create({
        data: {
          query,
          response: aiResponse,
          results: {
            create: papers.map(paper => ({
              paperId: paper.id,
              relevance: Math.random(), // Placeholder relevance score
            })),
          },
        },
      })
    } catch (error) {
      console.error('Error saving search:', error)
    }

    const response: SearchResponse = {
      query,
      response: aiResponse,
      papers: papers.slice(0, limit),
      totalCount: papers.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateBasicResponse(papers: Paper[], query: string): string {
  if (papers.length === 0) {
    return `申し訳ございませんが、「${query}」に関連する論文は見つかりませんでした。検索キーワードを変更してお試しください。`
  }

  const paperCount = papers.length
  const sources = papers.map(p => p.arxivId ? 'ArXiv' : 'PubMed').filter((v, i, a) => a.indexOf(v) === i)
  
  let response = `「${query}」に関連する論文を${paperCount}件見つかりました（${sources.join(', ')}から検索）。\\n\\n`
  
  response += `**主要な研究分野:**\\n`
  const categories = papers.flatMap(p => p.categories).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5)
  if (categories.length > 0) {
    response += categories.map(cat => `- ${cat}`).join('\\n') + '\\n\\n'
  }

  response += `**最近の研究動向:**\\n`
  const recentPapers = papers
    .filter(p => p.publishedDate)
    .sort((a, b) => new Date(b.publishedDate!).getTime() - new Date(a.publishedDate!).getTime())
    .slice(0, 3)

  if (recentPapers.length > 0) {
    response += recentPapers.map(paper => 
      `- ${paper.title.slice(0, 100)}${paper.title.length > 100 ? '...' : ''} (${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : '年不明'})`
    ).join('\\n')
  }

  response += `\\n\\n詳細な論文情報は下記のリストをご確認ください。`
  
  return response
}