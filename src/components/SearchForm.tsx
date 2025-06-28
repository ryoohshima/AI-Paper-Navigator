'use client'

import { useState } from 'react'
import { SearchRequest } from '@/types/paper'

interface SearchFormProps {
  onSearch: (request: SearchRequest) => void
  isLoading: boolean
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<('arxiv' | 'pubmed')[]>(['arxiv', 'pubmed'])
  const [limit, setLimit] = useState(10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch({ query: query.trim(), sources, limit })
    }
  }

  const handleSourceChange = (source: 'arxiv' | 'pubmed', checked: boolean) => {
    if (checked) {
      setSources([...sources, source])
    } else {
      setSources(sources.filter(s => s !== source))
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="query" className="block text-lg font-medium text-gray-700 mb-2">
            論文を検索
          </label>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例：機械学習の最新動向について"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              検索対象
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sources.includes('arxiv')}
                  onChange={(e) => handleSourceChange('arxiv', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">ArXiv</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sources.includes('pubmed')}
                  onChange={(e) => handleSourceChange('pubmed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">PubMed</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
              取得件数
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value={5}>5件</option>
              <option value={10}>10件</option>
              <option value={20}>20件</option>
              <option value={50}>50件</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim() || sources.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '検索中...' : '検索開始'}
        </button>
      </form>
    </div>
  )
}