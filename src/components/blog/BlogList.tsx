import Link from 'next/link'
import Image from 'next/image'
import BlogPagination from '@/components/blog/BlogPagination'
import BlogListClient from '@/components/blog/BlogListClient'
import { Separator } from '@/components/ui/separator'
import type { BlogPost, Tag, FilterData, PaginationData } from '@/types/blog'

// Markdownからプレーンテキストを抽出する関数
function extractPlainText(markdown: string, maxLength: number = 120): string {
  return markdown
    // コードブロックを削除
    .replace(/```[\s\S]*?```/g, '')
    // インラインコードを削除
    .replace(/`[^`]+`/g, '')
    // 画像を削除
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // リンクをテキストのみに
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    // 見出しの#を削除
    .replace(/^#{1,6}\s+/gm, '')
    // 太字・斜体を削除
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 水平線を削除
    .replace(/^[-*_]{3,}$/gm, '')
    // リスト記号を削除
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 引用を削除
    .replace(/^>\s+/gm, '')
    // HTMLタグを削除
    .replace(/<[^>]+>/g, '')
    // 複数の空白・改行を1つのスペースに
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

interface BlogListProps {
  posts: BlogPost[]
  isPreview?: boolean
  pagination?: PaginationData
  filter?: FilterData
  error?: string
}

// 一覧表示の内部コンポーネント
interface BlogListContentProps {
  posts: BlogPost[]
  isPreview: boolean
  pagination?: PaginationData
  hasActiveFilters: boolean
  filterBasePath?: string
}

function BlogListContent({ posts, isPreview, pagination, hasActiveFilters, filterBasePath }: BlogListContentProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          {hasActiveFilters ? '該当する記事がありません' : 'まだ記事がありません'}
        </p>
        {hasActiveFilters && filterBasePath && (
          <Link
            href={filterBasePath}
            className="text-emerald-600 hover:underline mt-2 inline-block"
          >
            すべての記事を表示
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg px-4 py-2 shadow">
        {posts.map((post, index) => {
          // プレビューモードの場合は詳細プレビューへ、公開ページの場合は公開URLへ
          const postHref = isPreview
            ? `/admin/blog/${post.id}/preview`
            : `/blog/${post.slug}`

          // カテゴリ・タグのリンク先
          const categoryHref = post.category
            ? isPreview
              ? `/admin/blog/category/${post.category.slug}/preview`
              : `/blog/category/${post.category.slug}`
            : ''

          const getTagHref = (tag: Tag) =>
            isPreview
              ? `/admin/blog/tag/${tag.slug}/preview`
              : `/blog/tag/${tag.slug}`

          // 表示する日付（公開日または作成日）
          const displayDate = post.published_at || post.created_at

          return (
            <div key={post.id}>
              {index > 0 && <Separator className="my-0" />}
              {/* モバイル: 縦型レイアウト / デスクトップ: 横型レイアウト */}
              <article className="py-3 md:py-2 -mx-4 px-4 rounded-lg">
                {/* モバイル用縦型レイアウト */}
                <div className="md:hidden">
                  {/* 日付・カテゴリ・ステータス */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {isPreview && post.status !== 'published' && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                        下書き
                      </span>
                    )}
                    <time className="text-sm text-gray-500">
                      {displayDate
                        ? new Date(displayDate).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : ''}
                    </time>
                    {post.category && (
                      <Link
                        href={categoryHref}
                        className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        {post.category.name}
                      </Link>
                    )}
                  </div>

                  {/* タイトル */}
                  <Link href={postHref}>
                    <h2 className="text-base font-bold hover:text-emerald-600 transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h2>
                  </Link>

                  {/* サムネイル */}
                  <Link href={postHref} className="block">
                    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {post.thumbnail_url ? (
                        <Image
                          src={post.thumbnail_url}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* 概要 */}
                  {(() => {
                    const description = post.excerpt || extractPlainText(post.content)
                    return description ? (
                      <Link href={postHref}>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {description}
                        </p>
                      </Link>
                    ) : null
                  })()}

                  {/* タグ */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Link
                          key={tag.id}
                          href={getTagHref(tag)}
                          className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs text-gray-400 py-1">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* デスクトップ用横型レイアウト */}
                <div className="hidden md:flex">
                  {/* サムネイル（左側） */}
                  <Link href={postHref} className="flex-shrink-0">
                    <div className="relative w-48 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {post.thumbnail_url ? (
                        <Image
                          src={post.thumbnail_url}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* コンテンツ（右側） */}
                  <div className="ml-6 flex-1 flex flex-col justify-center min-w-0">
                    {/* ステータスバッジ・カテゴリ */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {isPreview && post.status !== 'published' && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                          下書き
                        </span>
                      )}
                      {post.category && (
                        <Link
                          href={categoryHref}
                          className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                          {post.category.name}
                        </Link>
                      )}
                      <time className="text-sm text-gray-500">
                        {displayDate
                          ? new Date(displayDate).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : ''}
                      </time>
                    </div>

                    <Link href={postHref}>
                      <h2 className="text-lg font-bold hover:text-emerald-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {/* 概要 */}
                    {(() => {
                      const description = post.excerpt || extractPlainText(post.content)
                      return description ? (
                        <Link href={postHref}>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {description}
                          </p>
                        </Link>
                      ) : null
                    })()}

                    {/* タグ */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Link
                            key={tag.id}
                            href={getTagHref(tag)}
                            className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-gray-400 py-1">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </div>
          )
        })}
      </div>

      {/* ページネーション */}
      {pagination && (
        <BlogPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          basePath={pagination.basePath}
        />
      )}
    </>
  )
}

export default function BlogList({ posts, isPreview = false, pagination, filter, error }: BlogListProps) {
  const hasActiveFilters = !!(filter?.currentCategory || filter?.currentTag)

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white via-emerald-50 to-white pb-20 ${isPreview ? 'pt-8' : 'pt-32'}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* プレビューバナー */}
        {isPreview && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <span className="font-medium">一覧プレビューモード</span>
                  <p className="text-sm">下書き記事を含むすべての記事が表示されています</p>
                </div>
              </div>
              <Link
                href="/admin/blog"
                className="text-amber-700 hover:text-amber-900 font-medium text-sm"
              >
                記事一覧に戻る
              </Link>
            </div>
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center">Blog</h1>
        <p className="text-gray-600 text-center mb-8">
          プログラミングや技術、趣味などについて書いています
        </p>

        {/* フィルタ + 一覧（Client Component でラップ） */}
        {filter ? (
          <BlogListClient
            categories={filter.categories}
            tags={filter.tags}
            currentCategory={filter.currentCategory}
            currentTag={filter.currentTag}
            basePath={filter.basePath}
          >
            <BlogListContent
              posts={posts}
              isPreview={isPreview}
              pagination={pagination}
              hasActiveFilters={hasActiveFilters}
              filterBasePath={filter.basePath}
            />
          </BlogListClient>
        ) : (
          <BlogListContent
            posts={posts}
            isPreview={isPreview}
            pagination={pagination}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </div>
    </div>
  )
}
