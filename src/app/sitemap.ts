import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toppomura.jp'

  // 公開記事を取得
  const posts = await prisma.blog_posts.findMany({
    where: { status: 'published' },
    select: { slug: true, updated_at: true, published_at: true },
    orderBy: { published_at: 'desc' },
  })

  // カテゴリを取得（記事があるもののみ）
  const categories = await prisma.blog_categories.findMany({
    where: { posts: { some: { status: 'published' } } },
    select: { slug: true },
  })

  // タグを取得（記事があるもののみ）
  const tags = await prisma.blog_tags.findMany({
    where: { posts: { some: { post: { status: 'published' } } } },
    select: { slug: true },
  })

  // 最新記事の日時（一覧ページの lastmod に使用）
  const latestPostDate = posts[0]?.published_at || new Date()

  return [
    // トップページ
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // ブログ一覧
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 記事詳細
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at || post.published_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // カテゴリ別一覧
    ...categories.map((category) => ({
      url: `${baseUrl}/blog/category/${category.slug}`,
      lastModified: latestPostDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    // タグ別一覧
    ...tags.map((tag) => ({
      url: `${baseUrl}/blog/tag/${tag.slug}`,
      lastModified: latestPostDate,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
