import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

// 記事一覧取得
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await prisma.blog_posts.findMany({
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(posts)
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/blog')
  }
}

// 記事作成
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, excerpt, thumbnail_url, status, published_at, category_id, tag_ids } = body

    // スラッグの重複チェック
    const existingPost = await prisma.blog_posts.findUnique({
      where: { slug },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'このスラッグは既に使用されています' },
        { status: 400 }
      )
    }

    // 記事を作成（タグがある場合は関連も作成）
    const post = await prisma.blog_posts.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        thumbnail_url: thumbnail_url || null,
        status: status || 'draft',
        published_at: published_at ? new Date(published_at) : null,
        author_id: user.id,
        category_id: category_id || null,
        tags: tag_ids && tag_ids.length > 0
          ? {
              create: tag_ids.map((tagId: string) => ({
                tag_id: tagId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/blog')
  }
}


