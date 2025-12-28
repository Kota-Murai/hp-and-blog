'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useOptimistic, useTransition, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category, Tag } from '@/types/blog'

interface BlogListClientProps {
  categories: Category[]
  tags: Tag[]
  currentCategory: string | null
  currentTag: string | null
  basePath: string
  children: ReactNode
}

// スケルトンローダーコンポーネント
function BlogListSkeleton() {
  return (
    <div className="bg-white rounded-lg px-4 py-2 shadow">
      {[1, 2, 3].map((i) => (
        <div key={i} className={i > 1 ? 'border-t border-gray-100' : ''}>
          {/* デスクトップ用スケルトン */}
          <div className="hidden md:flex py-3">
            {/* サムネイル */}
            <Skeleton className="flex-shrink-0 w-48 h-32 rounded-lg" />
            {/* コンテンツ */}
            <div className="ml-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="w-16 h-5" />
                <Skeleton className="w-24 h-4" />
              </div>
              <Skeleton className="w-3/4 h-6 mb-2" />
              <Skeleton className="w-full h-4 mb-1" />
              <Skeleton className="w-2/3 h-4" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="w-16 h-5" />
                <Skeleton className="w-16 h-5" />
              </div>
            </div>
          </div>
          {/* モバイル用スケルトン */}
          <div className="md:hidden py-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-5" />
            </div>
            <Skeleton className="w-full h-5 mb-3" />
            <Skeleton className="w-full aspect-video rounded-lg mb-3" />
            <Skeleton className="w-full h-4 mb-1" />
            <Skeleton className="w-3/4 h-4 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="w-14 h-5" />
              <Skeleton className="w-14 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BlogListClient({
  categories,
  tags,
  currentCategory,
  currentTag,
  basePath,
  children,
}: BlogListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // 楽観的な選択状態（UIは即座に更新される）
  const [optimisticState, setOptimisticState] = useOptimistic({
    category: currentCategory,
    tag: currentTag,
  })

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
    const newValue = optimisticState.category === slug ? null : slug
    const queryString = createQueryString('category', newValue)

    startTransition(() => {
      setOptimisticState({ category: newValue, tag: optimisticState.tag })
      router.push(`${basePath}${queryString ? `?${queryString}` : ''}`)
    })
  }

  const handleTagClick = (slug: string) => {
    const newValue = optimisticState.tag === slug ? null : slug
    const queryString = createQueryString('tag', newValue)

    startTransition(() => {
      setOptimisticState({ category: optimisticState.category, tag: newValue })
      router.push(`${basePath}${queryString ? `?${queryString}` : ''}`)
    })
  }

  // カテゴリ・タグが両方空の場合はフィルタを表示しない
  const showFilter = categories.length > 0 || tags.length > 0

  return (
    <>
      {/* フィルタUI */}
      {showFilter && (
        <div className="mb-8 space-y-4" role="search" aria-label="記事フィルター">
          {/* カテゴリフィルタ */}
          {categories.length > 0 && (
            <div role="group" aria-labelledby="category-filter-label">
              <span id="category-filter-label" className="text-sm text-gray-600 font-medium mr-3">カテゴリ:</span>
              <div className="inline-flex flex-wrap gap-2 mt-1" role="listbox" aria-label="カテゴリで絞り込み">
                {categories.map((category) => {
                  const isSelected = optimisticState.category === category.slug
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.slug)}
                      role="option"
                      aria-selected={isSelected}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
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
                  const isSelected = optimisticState.tag === tag.slug
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.slug)}
                      role="option"
                      aria-selected={isSelected}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
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
        </div>
      )}

      {/* 一覧表示エリア（ローディング時はスケルトン表示） */}
      {isPending ? <BlogListSkeleton /> : children}
    </>
  )
}
