import { redirect } from 'next/navigation'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AnalyticsAggregator from '@/components/admin/AnalyticsAggregator'
import PeriodSelector from '@/components/admin/PeriodSelector'
import AdminHeader from '@/components/admin/AdminHeader'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

const VALID_PERIODS = [7, 30, 60, 90] as const
type ValidPeriod = (typeof VALID_PERIODS)[number]

function isValidPeriod(value: number): value is ValidPeriod {
  return VALID_PERIODS.includes(value as ValidPeriod)
}

interface StatsResult {
  totalPosts: number
  publishedPosts: number
  totalViews: number
  todayViews: number
  popularPosts: { id: string; title: string; slug: string; status: string; viewCount: number }[]
  dailyViewsArray: { date: string; views: number }[]
  periodViews: number
  error: string | null
}

async function getStats(period: ValidPeriod): Promise<StatsResult> {
  try {
    // 総記事数
    const totalPosts = await prisma.blog_posts.count()

  // 公開記事数
  const publishedPosts = await prisma.blog_posts.count({
    where: { status: 'published' },
  })

  // 総閲覧数を集計テーブルから計算
  const [monthlySum, dailySum, recentCount] = await Promise.all([
    prisma.blog_post_views_monthly.aggregate({
      _sum: { view_count: true },
    }),
    prisma.blog_post_views_daily.aggregate({
      _sum: { view_count: true },
    }),
    prisma.blog_post_views.count(),
  ])
  const totalViews =
    (monthlySum._sum.view_count || 0) +
    (dailySum._sum.view_count || 0) +
    recentCount

  // 今日の閲覧数
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayViews = await prisma.blog_post_views.count({
    where: { viewed_at: { gte: today } },
  })

  // 人気記事TOP5（集計テーブル + 詳細データを統合）
  // 3つのクエリを並列実行で最適化
  const [monthlyPopular, dailyPopular, recentPopular] = await Promise.all([
    prisma.blog_post_views_monthly.groupBy({
      by: ['post_id'],
      _sum: { view_count: true },
    }),
    prisma.blog_post_views_daily.groupBy({
      by: ['post_id'],
      _sum: { view_count: true },
    }),
    prisma.blog_post_views.groupBy({
      by: ['post_id'],
      _count: { post_id: true },
    }),
  ])

  // 各記事の総閲覧数を計算
  const viewCountMap = new Map<string, number>()

  for (const m of monthlyPopular) {
    const current = viewCountMap.get(m.post_id) || 0
    viewCountMap.set(m.post_id, current + (m._sum.view_count || 0))
  }
  for (const d of dailyPopular) {
    const current = viewCountMap.get(d.post_id) || 0
    viewCountMap.set(d.post_id, current + (d._sum.view_count || 0))
  }
  for (const r of recentPopular) {
    const current = viewCountMap.get(r.post_id) || 0
    viewCountMap.set(r.post_id, current + r._count.post_id)
  }

  // TOP5を抽出
  const sortedViews = Array.from(viewCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const postIds = sortedViews.map(([id]) => id)
  const posts = await prisma.blog_posts.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true, slug: true, status: true },
  })

  const popularPosts = sortedViews.map(([postId, viewCount]) => {
    const post = posts.find((p) => p.id === postId)
    return {
      id: postId,
      title: post?.title || '(削除された記事)',
      slug: post?.slug || '',
      status: post?.status || 'unknown',
      viewCount,
    }
  })

  // 指定期間の日別閲覧数
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (period - 1))
  startDate.setHours(0, 0, 0, 0)

  const dailyStats = await prisma.blog_post_views_daily.groupBy({
    by: ['date'],
    where: {
      date: { gte: startDate },
    },
    _sum: { view_count: true },
    orderBy: { date: 'asc' },
  })

  // 日付を埋める（データがない日は0として表示）
  const dailyViewsArray: { date: string; views: number }[] = []
  for (let i = 0; i < period; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const found = dailyStats.find(
      (s) => s.date.toISOString().split('T')[0] === dateStr
    )
    dailyViewsArray.push({
      date: dateStr,
      views: found?._sum.view_count || 0,
    })
  }

  // 期間内の合計閲覧数
  const periodViews = dailyViewsArray.reduce((sum, d) => sum + d.views, 0)

    return {
      totalPosts,
      publishedPosts,
      totalViews,
      todayViews,
      popularPosts,
      dailyViewsArray,
      periodViews,
      error: null,
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      totalPosts: 0,
      publishedPosts: 0,
      totalViews: 0,
      todayViews: 0,
      popularPosts: [],
      dailyViewsArray: [],
      periodViews: 0,
      error: '統計データの取得に失敗しました',
    }
  }
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminDashboard({ searchParams }: Props) {
  const user = await getCurrentUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const periodParam = typeof params.period === 'string' ? parseInt(params.period, 10) : 7
  const period: ValidPeriod = isValidPeriod(periodParam) ? periodParam : 7

  const stats = await getStats(period)

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        userEmail={user.email || undefined}
        signOutAction={signOut}
      />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">ダッシュボード</h2>

        {/* エラー表示 */}
        {stats.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">エラー</p>
            <p className="text-sm">{stats.error}</p>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">総記事数</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
            <p className="text-xs text-gray-400 mt-1">公開: {stats.publishedPosts}件</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">総閲覧数</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">PV</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">今日の閲覧数</p>
            <p className="text-3xl font-bold text-blue-600">{stats.todayViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">PV</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">平均閲覧数</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.publishedPosts > 0
                ? Math.round(stats.totalViews / stats.publishedPosts).toLocaleString()
                : 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">PV/記事</p>
          </div>
        </div>

        {/* 期間別閲覧数 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">閲覧数推移</h3>
              <span className="text-sm text-gray-500">
                期間内合計: {stats.periodViews.toLocaleString()} PV
              </span>
            </div>
            <PeriodSelector currentPeriod={period} />
          </div>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {stats.dailyViewsArray.map((day, index) => {
              const maxViews = Math.max(...stats.dailyViewsArray.map((d) => d.views), 1)
              const height = (day.views / maxViews) * 100
              // 期間が長い場合はラベルを間引く
              const showLabel = period <= 30 || index % Math.ceil(period / 15) === 0
              return (
                <div
                  key={day.date}
                  className="flex-1 min-w-[8px] flex flex-col items-center"
                  title={`${day.date}: ${day.views} PV`}
                >
                  {period <= 30 && (
                    <span className="text-xs text-gray-500 mb-1">{day.views}</span>
                  )}
                  <div
                    className="w-full bg-emerald-500 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  {showLabel && (
                    <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            ※ 集計処理実行後に反映されます。今日分はリアルタイムで詳細データから取得しています。
          </p>
        </div>

        {/* 人気記事TOP5 */}
        {stats.popularPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">人気記事 TOP 5</h3>
            <div className="space-y-3">
              {stats.popularPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                    <div>
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="font-medium hover:text-emerald-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                      {post.status === 'draft' && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                          下書き
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {post.viewCount.toLocaleString()} PV
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アクセス解析データ管理 */}
        <AnalyticsAggregator />

        {/* メニューカード */}
        <h3 className="text-lg font-semibold mb-4">メニュー</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ブログ記事管理カード */}
          <Link href="/admin/blog" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">ブログ記事</h3>
              <p className="text-gray-600 text-sm">ブログ記事の作成・編集・削除を行います</p>
            </div>
          </Link>

          {/* 画像管理カード */}
          <Link href="/admin/images" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">画像管理</h3>
              <p className="text-gray-600 text-sm">アップロードした画像の管理・削除を行います</p>
            </div>
          </Link>

          {/* カテゴリ管理カード */}
          <Link href="/admin/blog/categories" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">カテゴリ管理</h3>
              <p className="text-gray-600 text-sm">カテゴリの作成・編集・削除を行います</p>
            </div>
          </Link>

          {/* タグ管理カード */}
          <Link href="/admin/blog/tags" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">タグ管理</h3>
              <p className="text-gray-600 text-sm">タグの作成・編集・削除を行います</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
