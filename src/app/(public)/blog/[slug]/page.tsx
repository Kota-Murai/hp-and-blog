import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import BlogArticle from '@/components/blog/BlogArticle'
import ViewCounter from '@/components/blog/ViewCounter'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://toppomura.me'

interface Props {
  params: Promise<{ slug: string }>
}

// 動的メタデータ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blog_posts.findUnique({
    where: { slug },
  })

  if (!post) {
    return {
      title: '記事が見つかりません | Kota Murai Life & Code',
    }
  }

  return {
    title: `${post.title} | Kota Murai Life & Code`,
    description: post.excerpt || post.content.slice(0, 150),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.slice(0, 150),
      type: 'article',
      publishedTime: post.published_at?.toISOString(),
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.content.slice(0, 150),
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
    },
  }
}

// 静的パス生成
export async function generateStaticParams() {
  const posts = await prisma.blog_posts.findMany({
    where: { status: 'published' },
    select: { slug: true },
  })

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export const revalidate = 60 // 60秒ごとに再検証

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await prisma.blog_posts.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  // 公開されていない記事または存在しない記事
  if (!post || post.status !== 'published') {
    notFound()
  }

  // BlogPosting構造化データ
  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 150),
    image: post.thumbnail_url || undefined,
    datePublished: post.published_at?.toISOString(),
    dateModified: post.updated_at?.toISOString(),
    url: `${BASE_URL}/blog/${post.slug}`,
    author: {
      '@type': 'Person',
      name: '村井洸太',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: '村井洸太',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
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
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${BASE_URL}/blog/${post.slug}`,
      },
    ],
  }

  // タグを整形
  const tags = post.tags.map((pt) => ({
    id: pt.tag.id,
    name: pt.tag.name,
    slug: pt.tag.slug,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ViewCounter postId={post.id} />
      <BlogArticle
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          thumbnail_url: post.thumbnail_url,
          status: post.status,
          published_at: post.published_at,
          created_at: post.created_at,
          updated_at: post.updated_at,
          category: post.category,
          tags,
        }}
        isPreview={false}
      />
    </>
  )
}
