import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import BlogPagination from '@/components/blog/BlogPagination'
import { Separator } from '@/components/ui/separator'

const ITEMS_PER_PAGE = 12
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://toppomura.me'

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

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

// 動的メタデータ（rel=prev/next対応）
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const searchParamsResolved = await searchParams
  const currentPage = Math.max(1, parseInt(searchParamsResolved.page || '1') || 1)

  const tag = await prisma.blog_tags.findUnique({
    where: { slug },
  })

  if (!tag) {
    return {
      title: 'タグが見つかりません | Kota Murai Life & Code',
    }
  }

  // 総件数を取得
  const totalItems = await prisma.blog_posts.count({
    where: {
      status: 'published',
      tags: {
        some: {
          tag_id: tag.id,
        },
      },
    },
  })
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // ページURLを構築
  const buildPageUrl = (page: number) => {
    if (page === 1) return `${BASE_URL}/blog/tag/${slug}`
    return `${BASE_URL}/blog/tag/${slug}?page=${page}`
  }

  // タイトルとdescription
  let title = `#${tag.name} | ブログ | Kota Murai Life & Code`
  let description = `${tag.name}タグが付いた記事一覧`

  if (currentPage > 1) {
    title = `#${tag.name} (${currentPage}ページ目) | ブログ | Kota Murai Life & Code`
    description = `${tag.name}タグが付いた記事一覧（${currentPage}ページ目）`
  }

  const other: Record<string, string> = {}
  if (currentPage > 1) {
    other['link:prev'] = buildPageUrl(currentPage - 1)
  }
  if (currentPage < totalPages) {
    other['link:next'] = buildPageUrl(currentPage + 1)
  }

  return {
    title,
    description,
    alternates: {
      canonical: buildPageUrl(currentPage),
    },
    ...(Object.keys(other).length > 0 ? { other } : {}),
  }
}

// 静的パス生成
export async function generateStaticParams() {
  const tags = await prisma.blog_tags.findMany({
    select: { slug: true },
  })

  return tags.map((tag) => ({
    slug: tag.slug,
  }))
}

export const revalidate = 60 // 60秒ごとに再検証

export default async function TagPage({ params, searchParams }: Props) {
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

  // 総件数を取得
  const totalItems = await prisma.blog_posts.count({
    where: {
      status: 'published',
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
    redirect(`/blog/tag/${slug}?page=${totalPages}`)
  }

  // 記事を取得（タグ情報も含める）
  const postsWithRelations = await prisma.blog_posts.findMany({
    where: {
      status: 'published',
      tags: {
        some: {
          tag_id: tag.id,
        },
      },
    },
    orderBy: {
      published_at: 'desc',
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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-white pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* パンくずリスト */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-gray-600">
            <li>
              <Link href="/blog" className="hover:text-emerald-600">
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
              href="/blog"
              className="inline-block mt-4 text-emerald-600 hover:underline"
            >
              ブログ一覧に戻る
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg px-4 py-2 shadow">
              {posts.map((post, index) => {
                const postHref = `/blog/${post.slug}`
                const categoryHref = post.category ? `/blog/category/${post.category.slug}` : ''

                return (
                  <div key={post.id}>
                    {index > 0 && <Separator className="my-0" />}
                    {/* モバイル: 縦型レイアウト / デスクトップ: 横型レイアウト */}
                    <article className="py-3 md:py-2 -mx-4 px-4 rounded-lg">
                      {/* モバイル用縦型レイアウト */}
                      <div className="md:hidden">
                        {/* 日付・カテゴリ */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <time className="text-sm text-gray-500">
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString('ja-JP', {
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
                                href={`/blog/tag/${t.slug}`}
                                className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
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
                          {/* カテゴリ・日付 */}
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {post.category && (
                              <Link
                                href={categoryHref}
                                className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                              >
                                {post.category.name}
                              </Link>
                            )}
                            <time className="text-sm text-gray-500">
                              {post.published_at
                                ? new Date(post.published_at).toLocaleDateString('ja-JP', {
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
                                  href={`/blog/tag/${t.slug}`}
                                  className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
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
              basePath={`/blog/tag/${slug}`}
            />
          </>
        )}
      </div>
    </div>
  )
}
