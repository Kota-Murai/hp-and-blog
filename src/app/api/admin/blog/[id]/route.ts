import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

// 記事取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const post = await prisma.blog_posts.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/blog/[id]')
  }
}

// 記事更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, slug, content, excerpt, thumbnail_url, status, published_at, category_id, tag_ids } = body

    // スラッグの重複チェック（自分以外）
    const existingPost = await prisma.blog_posts.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'このスラッグは既に使用されています' },
        { status: 400 }
      )
    }

    // トランザクションで記事更新とタグ更新を行う
    const post = await prisma.$transaction(async (tx) => {
      // 既存のタグ関連を削除
      await tx.blog_post_tags.deleteMany({
        where: { post_id: id },
      })

      // 記事を更新（新しいタグ関連も作成）
      return tx.blog_posts.update({
        where: { id },
        data: {
          title,
          slug,
          content,
          excerpt: excerpt || null,
          thumbnail_url: thumbnail_url || null,
          status,
          published_at: published_at ? new Date(published_at) : null,
          updated_at: new Date(),
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
    })

    return NextResponse.json(post)
  } catch (error) {
    return handleApiError(error, 'PUT /api/admin/blog/[id]')
  }
}

// 記事削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.blog_posts.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/admin/blog/[id]')
  }
}


