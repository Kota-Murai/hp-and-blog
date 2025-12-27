import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import BlogEditor from '@/components/admin/BlogEditor'
import AdminHeader from '@/components/admin/AdminHeader'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export default async function EditBlogPost({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  const { id } = await params

  // 記事、カテゴリ、タグ、閲覧数を並行で取得
  const [post, categories, allTags, viewCount, lastView] = await Promise.all([
    prisma.blog_posts.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    prisma.blog_categories.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.blog_tags.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.blog_post_views.count({
      where: { post_id: id },
    }),
    prisma.blog_post_views.findFirst({
      where: { post_id: id },
      orderBy: { viewed_at: 'desc' },
      select: { viewed_at: true },
    }),
  ])

  if (!post) {
    notFound()
  }

  // 記事に紐づいているタグIDのリスト
  const selectedTagIds = post.tags.map((pt) => pt.tag_id)

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        currentPage="記事編集"
        backHref="/admin/blog"
        userEmail={user.email || undefined}
        signOutAction={signOut}
      />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 閲覧数情報 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-blue-800">
                この記事の閲覧数: {viewCount.toLocaleString()} PV
              </span>
              {lastView && (
                <span className="text-sm text-blue-600 ml-3">
                  (最終閲覧: {new Date(lastView.viewed_at).toLocaleString('ja-JP')})
                </span>
              )}
            </div>
          </div>
        </div>

        <BlogEditor
          authorId={user.id}
          initialData={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt || '',
            thumbnail_url: post.thumbnail_url || '',
            status: post.status,
            category_id: post.category_id || '',
            tag_ids: selectedTagIds,
          }}
          categories={categories}
          allTags={allTags}
        />
      </main>
    </div>
  )
}


