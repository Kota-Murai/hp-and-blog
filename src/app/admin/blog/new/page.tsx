import { redirect } from 'next/navigation'
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

export default async function NewBlogPost() {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  // カテゴリとタグを取得
  const [categories, allTags] = await Promise.all([
    prisma.blog_categories.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.blog_tags.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        currentPage="新規記事作成"
        backHref="/admin/blog"
        userEmail={user.email || undefined}
        signOutAction={signOut}
      />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <BlogEditor
          authorId={user.id}
          categories={categories}
          allTags={allTags}
        />
      </main>
    </div>
  )
}


