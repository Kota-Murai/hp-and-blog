import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import TagForm from './TagForm'
import TagList from './TagList'
import AdminHeader from '@/components/admin/AdminHeader'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

async function createTag(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!name || !slug) {
    return { error: '名前とスラッグは必須です' }
  }

  try {
    await prisma.blog_tags.create({
      data: {
        name,
        slug,
      },
    })
    revalidatePath('/admin/blog/tags')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: '同じ名前またはスラッグのタグが既に存在します' }
    }
    return { error: 'タグの作成に失敗しました' }
  }
}

async function updateTag(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!id || !name || !slug) {
    return { error: 'ID、名前、スラッグは必須です' }
  }

  try {
    await prisma.blog_tags.update({
      where: { id },
      data: {
        name,
        slug,
      },
    })
    revalidatePath('/admin/blog/tags')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: '同じ名前またはスラッグのタグが既に存在します' }
    }
    return { error: 'タグの更新に失敗しました' }
  }
}

async function deleteTag(formData: FormData) {
  'use server'
  const id = formData.get('id') as string

  if (!id) {
    return { error: 'IDは必須です' }
  }

  try {
    await prisma.blog_tags.delete({
      where: { id },
    })
    revalidatePath('/admin/blog/tags')
    return { success: true }
  } catch {
    return { error: 'タグの削除に失敗しました' }
  }
}

async function deleteUnusedTags() {
  'use server'
  try {
    // 使用されていないタグを削除
    const unusedTags = await prisma.blog_tags.findMany({
      where: {
        posts: {
          none: {},
        },
      },
    })

    if (unusedTags.length === 0) {
      return
    }

    await prisma.blog_tags.deleteMany({
      where: {
        id: {
          in: unusedTags.map((tag) => tag.id),
        },
      },
    })

    revalidatePath('/admin/blog/tags')
  } catch {
    // エラーは無視（ページがリロードされるため）
  }
}

export default async function AdminTagsPage() {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  // タグ一覧を取得（記事数も含む）
  const tags = await prisma.blog_tags.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  // 未使用タグの数をカウント
  const unusedTagCount = tags.filter((tag) => tag._count.posts === 0).length

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        currentPage="タグ管理"
        backHref="/admin"
        userEmail={user.email || undefined}
        signOutAction={signOut}
      />

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* 新規作成フォーム */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">新規タグ作成</h2>
            <TagForm action={createTag} />
          </div>

          {/* タグ一覧 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">タグ一覧（{tags.length}件）</h2>
              {unusedTagCount > 0 && (
                <form action={deleteUnusedTags}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    未使用タグを一括削除（{unusedTagCount}件）
                  </Button>
                </form>
              )}
            </div>
            {tags.length === 0 ? (
              <p className="text-gray-600 text-center py-4">タグがありません</p>
            ) : (
              <TagList
                tags={tags}
                updateAction={updateTag}
                deleteAction={deleteTag}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
