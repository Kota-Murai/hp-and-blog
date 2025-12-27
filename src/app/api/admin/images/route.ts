import { NextResponse } from 'next/server'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// Service Role Keyを使用してRLSをバイパスする管理者用クライアント
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // blog バケットの画像一覧を取得
    const folders = ['thumbnails', 'content', 'images']
    const allFiles: {
      name: string
      path: string
      url: string
      size: number
      created_at: string
      folder: string
      usedInPosts: { id: string; title: string; slug: string }[]
    }[] = []

    for (const folder of folders) {
      const { data: files, error } = await supabase.storage
        .from('blog')
        .list(folder, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error) {
        console.error(`Error listing ${folder}:`, error)
        continue
      }

      if (files) {
        for (const file of files) {
          if (file.name === '.emptyFolderPlaceholder') continue
          
          const path = `${folder}/${file.name}`
          const { data: publicUrlData } = supabase.storage
            .from('blog')
            .getPublicUrl(path)

          // この画像を使用している記事を検索
          const url = publicUrlData.publicUrl
          const posts = await prisma.blog_posts.findMany({
            where: {
              OR: [
                { thumbnail_url: url },
                { content: { contains: url } },
              ],
            },
            select: {
              id: true,
              title: true,
              slug: true,
            },
          })

          allFiles.push({
            name: file.name,
            path,
            url,
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            folder,
            usedInPosts: posts,
          })
        }
      }
    }

    // 作成日時でソート（新しい順）
    allFiles.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ images: allFiles })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: '画像一覧の取得に失敗しました' }, { status: 500 })
  }
}

