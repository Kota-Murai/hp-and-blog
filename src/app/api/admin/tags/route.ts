import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

// スラッグを生成
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// タグ作成（エディタからのインライン作成用）
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'タグ名は必須です' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const slug = generateSlug(trimmedName)

    // 名前の重複チェック
    const existingByName = await prisma.blog_tags.findUnique({
      where: { name: trimmedName },
    })

    if (existingByName) {
      return NextResponse.json(
        { error: 'このタグ名は既に使用されています' },
        { status: 400 }
      )
    }

    // スラッグの重複チェック（異なるスラッグになることもあるので）
    const existingBySlug = await prisma.blog_tags.findUnique({
      where: { slug },
    })

    if (existingBySlug) {
      return NextResponse.json(
        { error: 'このスラッグは既に使用されています' },
        { status: 400 }
      )
    }

    const tag = await prisma.blog_tags.create({
      data: {
        name: trimmedName,
        slug,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/tags')
  }
}
