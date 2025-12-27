import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import CategoryForm from './CategoryForm'
import CategoryList from './CategoryList'
import AdminHeader from '@/components/admin/AdminHeader'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

async function createCategory(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string

  if (!name || !slug) {
    return { error: '名前とスラッグは必須です' }
  }

  try {
    await prisma.blog_categories.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    })
    revalidatePath('/admin/blog/categories')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: '同じ名前またはスラッグのカテゴリが既に存在します' }
    }
    return { error: 'カテゴリの作成に失敗しました' }
  }
}

async function updateCategory(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string

  if (!id || !name || !slug) {
    return { error: 'ID、名前、スラッグは必須です' }
  }

  try {
    await prisma.blog_categories.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
      },
    })
    revalidatePath('/admin/blog/categories')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: '同じ名前またはスラッグのカテゴリが既に存在します' }
    }
    return { error: 'カテゴリの更新に失敗しました' }
  }
}

async function deleteCategory(formData: FormData) {
  'use server'
  const id = formData.get('id') as string

  if (!id) {
    return { error: 'IDは必須です' }
  }

  try {
    await prisma.blog_categories.delete({
      where: { id },
    })
    revalidatePath('/admin/blog/categories')
    return { success: true }
  } catch {
    return { error: 'カテゴリの削除に失敗しました' }
  }
}

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  // カテゴリ一覧を取得（記事数も含む）
  const categories = await prisma.blog_categories.findMany({
    orderBy: { created_at: 'asc' },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        currentPage="カテゴリ管理"
        backHref="/admin"
        userEmail={user.email || undefined}
        signOutAction={signOut}
      />

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* 新規作成フォーム */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">新規カテゴリ作成</h2>
            <CategoryForm action={createCategory} />
          </div>

          {/* カテゴリ一覧 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">カテゴリ一覧</h2>
            {categories.length === 0 ? (
              <p className="text-gray-600 text-center py-4">カテゴリがありません</p>
            ) : (
              <CategoryList
                categories={categories}
                updateAction={updateCategory}
                deleteAction={deleteCategory}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
