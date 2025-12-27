import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import BlogPagination from '@/components/blog/BlogPagination'
import { Separator } from '@/components/ui/separator'

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

const ITEMS_PER_PAGE = 12

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function TagPreviewPage({ params, searchParams }: Props) {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  const { slug } = await params
  const searchParamsResolved = await searchParams
  const currentPage = Math.max(1, parseInt(searchParamsResolved.page || '1') || 1)

  // タグを取得
  const tag = await prisma.blog_tags.findUnique({
    where: { slug },
  })

  if (!tag) {
    notFound()
  }

  // 総件数を取得（プレビューなので全ステータス対象）
  const totalItems = await prisma.blog_posts.count({
    where: {
      tags: {
        some: {
          tag_id: tag.id,
        },
      },
    },
  })

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // 存在しないページへのアクセス時は最終ページにリダイレクト
  if (currentPage > totalPages && totalPages > 0) {
    redirect(`/admin/blog/tag/${slug}/preview?page=${totalPages}`)
  }

  // 記事を取得（プレビューなので全ステータス対象、作成日順、カテゴリ・タグ情報も含める）
  const postsWithRelations = await prisma.blog_posts.findMany({
    where: {
      tags: {
        some: {
          tag_id: tag.id,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  // タグデータを整形
  const posts = postsWithRelations.map((post) => ({
    ...post,
    tags: post.tags.map((pt) => pt.tag),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-white pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* プレビューバナー */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-medium">
                タグプレビュー（下書き含む全記事を表示）
              </span>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href="/admin/blog/tags"
                className="text-amber-700 hover:text-amber-900 font-medium"
              >
                タグ管理
              </Link>
              <Link
                href="/admin/blog"
                className="text-amber-700 hover:text-amber-900 font-medium"
              >
                記事一覧
              </Link>
            </div>
          </div>
        </div>

        {/* パンくずリスト */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-gray-600">
            <li>
              <Link href="/admin/blog/preview" className="hover:text-emerald-600">
                ブログ
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">#{tag.name}</li>
          </ol>
        </nav>

        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center">
          <span className="text-emerald-600">#</span>{tag.name}
        </h1>
        <p className="text-gray-500 text-center mb-12">
          {totalItems}件の記事
        </p>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">このタグにはまだ記事がありません</p>
            <Link
              href="/admin/blog/preview"
              className="inline-block mt-4 text-emerald-600 hover:underline"
            >
              ブログ一覧に戻る
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg px-4 py-2 shadow">
              {posts.map((post, index) => {
                const displayDate = post.published_at || post.created_at
                const postHref = `/admin/blog/${post.id}/preview`
                const categoryHref = post.category ? `/admin/blog/category/${post.category.slug}/preview` : ''

                return (
                  <div key={post.id}>
                    {index > 0 && <Separator className="my-0" />}
                    {/* モバイル: 縦型レイアウト / デスクトップ: 横型レイアウト */}
                    <article className="py-3 md:py-2 -mx-4 px-4 rounded-lg">
                      {/* モバイル用縦型レイアウト */}
                      <div className="md:hidden">
                        {/* ステータス・日付・カテゴリ */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {post.status === 'draft' && (
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
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags.slice(0, 3).map((t) => (
                              <Link
                                key={t.id}
                                href={`/admin/blog/tag/${t.slug}/preview`}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                #{t.name}
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
                          {/* ステータス・カテゴリ・日付 */}
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {post.status === 'draft' && (
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
                          {post.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.tags.slice(0, 3).map((t) => (
                                <Link
                                  key={t.id}
                                  href={`/admin/blog/tag/${t.slug}/preview`}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                >
                                  #{t.name}
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
            <BlogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              basePath={`/admin/blog/tag/${slug}/preview`}
            />
          </>
        )}
      </div>
    </div>
  )
}
