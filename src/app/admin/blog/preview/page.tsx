import { redirect } from 'next/navigation'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import BlogList from '@/components/blog/BlogList'

const ITEMS_PER_PAGE = 12

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>
}

export default async function BlogListPreviewPage({ searchParams }: Props) {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1') || 1)
  const categorySlug = params.category || null
  const tagSlug = params.tag || null

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
  const whereCondition: Prisma.blog_postsWhereInput = {}

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

  // 総件数を取得（下書き・公開問わず）
  const totalItems = await prisma.blog_posts.count({
    where: whereCondition,
  })
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // 存在しないページへのアクセス時は最終ページにリダイレクト
  if (currentPage > totalPages && totalPages > 0) {
    const filterParams = new URLSearchParams()
    filterParams.set('page', totalPages.toString())
    if (categorySlug) filterParams.set('category', categorySlug)
    if (tagSlug) filterParams.set('tag', tagSlug)
    redirect(`/admin/blog/preview?${filterParams.toString()}`)
  }

  // 全記事を取得（下書き・公開問わず）
  // ソート: 公開日がある場合は公開日、ない場合は作成日で降順
  const postsWithRelations = await prisma.blog_posts.findMany({
    where: whereCondition,
    orderBy: [
      { published_at: 'desc' },
      { created_at: 'desc' },
    ],
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

  // BlogListコンポーネント用にタグデータを整形
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
    return queryString ? `/admin/blog/preview?${queryString}&` : '/admin/blog/preview'
  }

  return (
    <BlogList
      posts={posts}
      isPreview={true}
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
        basePath: '/admin/blog/preview',
      }}
    />
  )
}
