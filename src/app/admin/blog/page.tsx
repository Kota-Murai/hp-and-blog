import { redirect } from 'next/navigation'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import BlogPagination from '@/components/blog/BlogPagination'
import DeletePostButton from '@/components/admin/DeletePostButton'
import AdminHeader from '@/components/admin/AdminHeader'

const ITEMS_PER_PAGE = 12

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminBlogList({ searchParams }: Props) {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1') || 1)

  // 総件数を取得
  const totalItems = await prisma.blog_posts.count()
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // 存在しないページへのアクセス時は最終ページにリダイレクト
  if (currentPage > totalPages && totalPages > 0) {
    redirect(`/admin/blog?page=${totalPages}`)
  }

  // 記事一覧を取得
  const posts = await prisma.blog_posts.findMany({
    orderBy: {
      created_at: 'desc',
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: { views: true },
      },
    },
  })

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        currentPage="ブログ記事"
        backHref="/admin"
        userEmail={user.email || undefined}
        signOutAction={signOut}
      />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">記事一覧</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/admin/blog/categories">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                カテゴリ管理
              </Button>
            </Link>
            <Link href="/admin/blog/tags">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                タグ管理
              </Button>
            </Link>
            <Link href="/admin/blog/preview" target="_blank">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                一覧プレビュー
              </Button>
            </Link>
            <Link href="/admin/blog/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm" size="sm">
                新規作成
              </Button>
            </Link>
          </div>
        </div>

        {posts.length === 0 && totalItems === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">記事がありません</p>
            <Link href="/admin/blog/new" className="text-emerald-600 hover:underline mt-2 inline-block">
              最初の記事を作成する
            </Link>
          </div>
        ) : (
          <>
            {/* モバイル用カード表示 */}
            <div className="md:hidden space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">/{post.slug}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {post.status === 'published' ? '公開' : '下書き'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.category && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                        {post.category.name}
                      </span>
                    )}
                    {post.tags.slice(0, 2).map((pt) => (
                      <span
                        key={pt.tag.id}
                        className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded"
                      >
                        #{pt.tag.name}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-xs text-gray-400 py-0.5">+{post.tags.length - 2}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{post._count.views.toLocaleString()} PV</span>
                    <span>
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString('ja-JP')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-emerald-600 hover:text-emerald-900 font-medium"
                    >
                      編集
                    </Link>
                    <Link
                      href={`/admin/blog/${post.id}/preview`}
                      target="_blank"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      プレビュー
                    </Link>
                    <DeletePostButton postId={post.id} postTitle={post.title} />
                  </div>
                </div>
              ))}
            </div>

            {/* デスクトップ用テーブル表示 */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タイトル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ・タグ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      閲覧数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{post.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {post.category && (
                            <span className="inline-flex text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded w-fit">
                              {post.category.name}
                            </span>
                          )}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 3).map((pt) => (
                                <span
                                  key={pt.tag.id}
                                  className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded"
                                >
                                  #{pt.tag.name}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{post.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          {!post.category && post.tags.length === 0 && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.status === 'published' ? '公開' : '下書き'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {post._count.views.toLocaleString()} PV
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.created_at
                          ? new Date(post.created_at).toLocaleDateString('ja-JP')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          編集
                        </Link>
                        <Link
                          href={`/admin/blog/${post.id}/preview`}
                          target="_blank"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          プレビュー
                        </Link>
                        <DeletePostButton postId={post.id} postTitle={post.title} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            <BlogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              basePath="/admin/blog"
            />
          </>
        )}
      </main>
    </div>
  )
}
