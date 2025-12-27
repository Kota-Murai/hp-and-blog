import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import {
  parseDeviceType,
  createEmptyDeviceStats,
  mergeDeviceStats,
  parseDeviceStatsJson,
  type DeviceStats,
} from './device-parser'

/**
 * DeviceStatsをPrismaのJson型に変換
 */
function toJsonValue(stats: DeviceStats): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(stats))
}

/**
 * 指定日の閲覧データを日別集計テーブルに集約
 */
export async function aggregateDaily(targetDate: Date): Promise<number> {
  // 対象日の開始・終了時刻を計算
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  // 対象日の閲覧データを記事ごとに集計
  const viewsByPost = await prisma.blog_post_views.groupBy({
    by: ['post_id'],
    where: {
      viewed_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    _count: {
      post_id: true,
    },
  })

  // 各記事のユニークビジター数も取得
  const uniqueVisitorsByPost = await prisma.$queryRaw<
    { post_id: string; unique_count: bigint }[]
  >`
    SELECT post_id, COUNT(DISTINCT ip_hash) as unique_count
    FROM blog_post_views
    WHERE viewed_at >= ${startOfDay} AND viewed_at <= ${endOfDay}
    GROUP BY post_id
  `

  const uniqueVisitorsMap = new Map(
    uniqueVisitorsByPost.map((row) => [row.post_id, Number(row.unique_count)])
  )

  // デバイス統計を計算するため、詳細データを取得
  const viewsWithUA = await prisma.blog_post_views.findMany({
    where: {
      viewed_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      post_id: true,
      user_agent: true,
    },
  })

  // 記事ごとのデバイス統計を計算
  const deviceStatsMap = new Map<string, DeviceStats>()
  for (const view of viewsWithUA) {
    const deviceType = parseDeviceType(view.user_agent)
    const current = deviceStatsMap.get(view.post_id) || createEmptyDeviceStats()
    current[deviceType]++
    deviceStatsMap.set(view.post_id, current)
  }

  // 日付をDATE型用にフォーマット
  const dateOnly = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  // 各記事の集計をUPSERT（トランザクションでバッチ処理）
  await prisma.$transaction(
    viewsByPost.map((view) => {
      const uniqueVisitors = uniqueVisitorsMap.get(view.post_id) || 0
      const deviceStats = deviceStatsMap.get(view.post_id) || createEmptyDeviceStats()

      return prisma.blog_post_views_daily.upsert({
        where: {
          post_id_date: {
            post_id: view.post_id,
            date: dateOnly,
          },
        },
        update: {
          view_count: view._count.post_id,
          unique_visitors: uniqueVisitors,
          device_stats: toJsonValue(deviceStats),
        },
        create: {
          post_id: view.post_id,
          date: dateOnly,
          view_count: view._count.post_id,
          unique_visitors: uniqueVisitors,
          device_stats: toJsonValue(deviceStats),
        },
      })
    })
  )

  return viewsByPost.length
}

/**
 * 指定月の日別集計データを月別集計テーブルに集約
 */
export async function aggregateMonthly(yearMonth: string): Promise<number> {
  // yearMonthは "YYYY-MM" 形式
  const [year, month] = yearMonth.split('-').map(Number)
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0) // 月末日

  // 対象月の日別集計を記事ごとに合算
  const dailyAggregates = await prisma.blog_post_views_daily.groupBy({
    by: ['post_id'],
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      view_count: true,
      unique_visitors: true,
    },
  })

  // 各記事の日別集計からデバイス統計を取得して合算
  const dailyRecords = await prisma.blog_post_views_daily.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      post_id: true,
      device_stats: true,
    },
  })

  // 記事ごとのデバイス統計を合算
  const deviceStatsMap = new Map<string, DeviceStats>()
  for (const record of dailyRecords) {
    const current = deviceStatsMap.get(record.post_id) || createEmptyDeviceStats()
    const recordStats = parseDeviceStatsJson(record.device_stats)
    deviceStatsMap.set(record.post_id, mergeDeviceStats(current, recordStats))
  }

  // 各記事の月別集計をUPSERT（トランザクションでバッチ処理）
  await prisma.$transaction(
    dailyAggregates.map((agg) => {
      const deviceStats = deviceStatsMap.get(agg.post_id) || createEmptyDeviceStats()

      return prisma.blog_post_views_monthly.upsert({
        where: {
          post_id_year_month: {
            post_id: agg.post_id,
            year_month: yearMonth,
          },
        },
        update: {
          view_count: agg._sum.view_count || 0,
          unique_visitors: agg._sum.unique_visitors || 0,
          device_stats: toJsonValue(deviceStats),
        },
        create: {
          post_id: agg.post_id,
          year_month: yearMonth,
          view_count: agg._sum.view_count || 0,
          unique_visitors: agg._sum.unique_visitors || 0,
          device_stats: toJsonValue(deviceStats),
        },
      })
    })
  )

  return dailyAggregates.length
}

/**
 * 指定日数より古い詳細データを削除（デフォルト90日）
 */
export async function cleanupOldViews(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  cutoffDate.setHours(0, 0, 0, 0)

  const result = await prisma.blog_post_views.deleteMany({
    where: {
      viewed_at: {
        lt: cutoffDate,
      },
    },
  })

  return result.count
}

/**
 * 総閲覧数を計算（月別集計 + 日別集計 + 未集計の詳細データ）
 */
export async function calculateTotalViews(postId?: string): Promise<number> {
  const whereClause = postId ? { post_id: postId } : {}

  const [monthlySum, dailySum, recentCount] = await Promise.all([
    // 月別集計の合計
    prisma.blog_post_views_monthly.aggregate({
      where: whereClause,
      _sum: { view_count: true },
    }),
    // 日別集計の合計
    prisma.blog_post_views_daily.aggregate({
      where: whereClause,
      _sum: { view_count: true },
    }),
    // 詳細データの件数（まだ集計されていない分）
    prisma.blog_post_views.count({
      where: whereClause,
    }),
  ])

  return (
    (monthlySum._sum.view_count || 0) +
    (dailySum._sum.view_count || 0) +
    recentCount
  )
}

/**
 * 過去N日間の日別閲覧数を取得
 */
export async function getDailyViewsForPeriod(
  days: number = 7
): Promise<{ date: string; view_count: number }[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  const dailyViews = await prisma.blog_post_views_daily.groupBy({
    by: ['date'],
    where: {
      date: {
        gte: startDate,
      },
    },
    _sum: {
      view_count: true,
    },
    orderBy: {
      date: 'asc',
    },
  })

  return dailyViews.map((d) => ({
    date: d.date.toISOString().split('T')[0],
    view_count: d._sum.view_count || 0,
  }))
}

/**
 * 月別閲覧数の推移を取得
 */
export async function getMonthlyViewsHistory(
  months: number = 12
): Promise<{ year_month: string; view_count: number }[]> {
  const monthlyViews = await prisma.blog_post_views_monthly.groupBy({
    by: ['year_month'],
    _sum: {
      view_count: true,
    },
    orderBy: {
      year_month: 'desc',
    },
    take: months,
  })

  return monthlyViews
    .map((m) => ({
      year_month: m.year_month,
      view_count: m._sum.view_count || 0,
    }))
    .reverse()
}
