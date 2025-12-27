import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import BlogList from '@/components/blog/BlogList'

const ITEMS_PER_PAGE = 12
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://toppomura.me'

export const revalidate = 60 // 60秒ごとに再検証

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>
}

// 動的メタデータ（rel=prev/next対応）
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1') || 1)
  const categorySlug = params.category || null
  const tagSlug = params.tag || null

  // フィルタ条件を構築
  const whereCondition: Prisma.blog_postsWhereInput = {
    status: 'published',
  }

  if (categorySlug) {
    whereCondition.category = { slug: categorySlug }
  }
  if (tagSlug) {
    whereCondition.tags = { some: { tag: { slug: tagSlug } } }
  }

  const totalItems = await prisma.blog_posts.count({ where: whereCondition })
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // ベースURLを構築
  const buildPageUrl = (page: number) => {
    const filterParams = new URLSearchParams()
    if (page > 1) filterParams.set('page', page.toString())
    if (categorySlug) filterParams.set('category', categorySlug)
    if (tagSlug) filterParams.set('tag', tagSlug)
    const queryString = filterParams.toString()
    return queryString ? `${BASE_URL}/blog?${queryString}` : `${BASE_URL}/blog`
  }

  // alternates（canonical, prev, next）
  const alternates: Metadata['alternates'] = {
    canonical: buildPageUrl(currentPage),
  }

  // タイトルとdescription
  let title = 'ブログ | Kota Murai Life & Code'
  let description = 'プログラミングや技術、趣味などについてのブログ記事'

  if (currentPage > 1) {
    title = `ブログ (${currentPage}ページ目) | Kota Murai Life & Code`
    description = `プログラミングや技術、趣味などについてのブログ記事（${currentPage}ページ目）`
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
    alternates,
    ...(Object.keys(other).length > 0 ? { other } : {}),
  }
}

export default async function BlogListPage({ searchParams }: Props) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1') || 1)
  const categorySlug = params.category || null
  const tagSlug = params.tag || null

  try {
    // カテゴリとタグの一覧を取得（フィルタ用）
    const [categories, tags] = await Promise.all([
      prisma.blog_categories.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.blog_tags.findMany({
        orderBy: { name: 'asc' },
      }),
    ])

    // フィルタ条件を構築
    const whereCondition: Prisma.blog_postsWhereInput = {
      status: 'published',
    }

    if (categorySlug) {
      whereCondition.category = {
        slug: categorySlug,
      }
    }

    if (tagSlug) {
      whereCondition.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      }
    }

    // 総件数を取得
    const totalItems = await prisma.blog_posts.count({
      where: whereCondition,
    })

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    // 存在しないページへのアクセス時は最終ページにリダイレクト
    // フィルタパラメータも維持
    if (currentPage > totalPages && totalPages > 0) {
      const filterParams = new URLSearchParams()
      filterParams.set('page', totalPages.toString())
      if (categorySlug) filterParams.set('category', categorySlug)
      if (tagSlug) filterParams.set('tag', tagSlug)
      redirect(`/blog?${filterParams.toString()}`)
    }

    // 記事を取得
    const postsWithRelations = await prisma.blog_posts.findMany({
      where: whereCondition,
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

    // ページネーション用のベースパスを構築
    const buildBasePath = () => {
      const filterParams = new URLSearchParams()
      if (categorySlug) filterParams.set('category', categorySlug)
      if (tagSlug) filterParams.set('tag', tagSlug)
      const queryString = filterParams.toString()
      return queryString ? `/blog?${queryString}&` : '/blog'
    }

    // パンくずリスト構造化データ
    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ホーム',
          item: BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'ブログ',
          item: `${BASE_URL}/blog`,
        },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <BlogList
          posts={posts}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage: ITEMS_PER_PAGE,
            basePath: buildBasePath(),
          }}
          filter={{
            categories,
            tags,
            currentCategory: categorySlug,
            currentTag: tagSlug,
            basePath: '/blog',
          }}
        />
      </>
    )
  } catch (error) {
    console.error('Blog posts fetch error:', error)
    // エラー時は空のリストを表示
    return (
      <BlogList
        posts={[]}
        pagination={{
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: ITEMS_PER_PAGE,
          basePath: '/blog',
        }}
        filter={{
          categories: [],
          tags: [],
          currentCategory: null,
          currentTag: null,
          basePath: '/blog',
        }}
        error="記事の取得に失敗しました。しばらく時間をおいてから再度お試しください。"
      />
    )
  }
}
