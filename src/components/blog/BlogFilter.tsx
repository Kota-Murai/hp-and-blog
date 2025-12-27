'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Category, Tag } from '@/types/blog'

interface BlogFilterProps {
  categories: Category[]
  tags: Tag[]
  currentCategory: string | null
  currentTag: string | null
  basePath?: string
}

export default function BlogFilter({
  categories,
  tags,
  currentCategory,
  currentTag,
  basePath = '/blog',
}: BlogFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      // ページをリセット
      params.delete('page')

      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }

      return params.toString()
    },
    [searchParams]
  )

  const handleCategoryClick = (slug: string) => {
    // 同じカテゴリをクリックしたら選択解除
    const newValue = currentCategory === slug ? null : slug
    const queryString = createQueryString('category', newValue)
    router.push(`${basePath}${queryString ? `?${queryString}` : ''}`)
  }

  const handleTagClick = (slug: string) => {
    // 同じタグをクリックしたら選択解除
    const newValue = currentTag === slug ? null : slug
    const queryString = createQueryString('tag', newValue)
    router.push(`${basePath}${queryString ? `?${queryString}` : ''}`)
  }

  const clearFilters = () => {
    router.push(basePath)
  }

  const hasActiveFilters = currentCategory || currentTag

  // カテゴリ・タグが両方空の場合はフィルタを表示しない
  if (categories.length === 0 && tags.length === 0) {
    return null
  }

  return (
    <div className="mb-8 space-y-4" role="search" aria-label="記事フィルター">
      {/* カテゴリフィルタ */}
      {categories.length > 0 && (
        <div role="group" aria-labelledby="category-filter-label">
          <span id="category-filter-label" className="text-sm text-gray-600 font-medium mr-3">カテゴリ:</span>
          <div className="inline-flex flex-wrap gap-2 mt-1" role="listbox" aria-label="カテゴリで絞り込み">
            {categories.map((category) => {
              const isSelected = currentCategory === category.slug
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  role="option"
                  aria-selected={isSelected}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* タグフィルタ */}
      {tags.length > 0 && (
        <div role="group" aria-labelledby="tag-filter-label">
          <span id="tag-filter-label" className="text-sm text-gray-600 font-medium mr-3">タグ:</span>
          <div className="inline-flex flex-wrap gap-2 mt-1" role="listbox" aria-label="タグで絞り込み">
            {tags.map((tag) => {
              const isSelected = currentTag === tag.slug
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.slug)}
                  role="option"
                  aria-selected={isSelected}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-gray-200 text-gray-800 border-gray-400'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* フィルタクリア */}
      {hasActiveFilters && (
        <div className="pt-2">
          <button
            onClick={clearFilters}
            aria-label="すべてのフィルタをクリア"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            フィルタをクリア
          </button>
        </div>
      )}
    </div>
  )
}
