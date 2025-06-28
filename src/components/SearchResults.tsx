'use client'

import { SearchResponse } from '@/types/paper'

interface SearchResultsProps {
  results: SearchResponse | null
}

export default function SearchResults({ results }: SearchResultsProps) {
  if (!results) {
    return null
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* AI Response Section */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">
          AI分析結果
        </h2>
        <div className="text-gray-700 whitespace-pre-line">
          {results.response}
        </div>
      </div>

      {/* Papers List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          検索結果 ({results.totalCount}件)
        </h2>
        
        {results.papers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            検索条件に一致する論文が見つかりませんでした。
          </p>
        ) : (
          <div className="space-y-6">
            {results.papers.map((paper) => (
              <div
                key={paper.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {paper.title}
                  </h3>
                  <div className="flex gap-2 ml-4">
                    {paper.arxivId && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        ArXiv
                      </span>
                    )}
                    {paper.pubmedId && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        PubMed
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">著者:</span> {paper.authors.join(', ')}
                </div>

                {paper.journal && (
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">ジャーナル:</span> {paper.journal}
                  </div>
                )}

                {paper.publishedDate && (
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">公開日:</span>{' '}
                    {new Date(paper.publishedDate).toLocaleDateString('ja-JP')}
                  </div>
                )}

                {paper.categories.length > 0 && (
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">カテゴリ:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {paper.categories.map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-700 mb-3">
                  <span className="font-medium">概要:</span>
                  <p className="mt-1 line-clamp-3">
                    {paper.abstract}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      論文を見る
                    </a>
                  )}
                  {paper.doi && (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      DOI
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}