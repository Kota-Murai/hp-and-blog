import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BlogArticle from '@/components/blog/BlogArticle'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BlogPreviewPage({ params }: Props) {
  const { id } = await params

  // 認証チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // 記事を取得（ステータスに関係なく）
  const post = await prisma.blog_posts.findUnique({
    where: { id },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!post) {
    notFound()
  }

  // タグを整形
  const tags = post.tags.map((pt) => ({
    id: pt.tag.id,
    name: pt.tag.name,
    slug: pt.tag.slug,
  }))

  return (
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
      isPreview={true}
    />
  )
}
