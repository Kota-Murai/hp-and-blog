import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import {
  aggregateDaily,
  aggregateMonthly,
  cleanupOldViews,
} from '@/lib/analytics/aggregation'

type AggregationType = 'daily' | 'monthly' | 'cleanup' | 'all'

interface RequestBody {
  type: AggregationType
  date?: string // YYYY-MM-DD形式（dailyの場合）またはYYYY-MM形式（monthlyの場合）
}

// GitHub Actions等からの定期実行用APIキー
const ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY

/**
 * APIキー認証またはセッション認証をチェック
 */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  // APIキー認証（GitHub Actions用）
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ') && ANALYTICS_API_KEY) {
    const token = authHeader.slice(7)
    if (token === ANALYTICS_API_KEY) {
      return true
    }
  }

  // セッション認証（管理画面からの手動実行用）
  const user = await getCurrentUser()
  if (user && isAdminEmail(user.email)) {
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RequestBody = await request.json()
    const { type, date } = body

    if (!type || !['daily', 'monthly', 'cleanup', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be daily, monthly, cleanup, or all' },
        { status: 400 }
      )
    }

    const results: {
      daily?: { aggregated: number; date: string }
      monthly?: { aggregated: number; yearMonth: string }
      cleanup?: { deleted: number; daysKept: number }
    } = {}

    // 日別集計
    if (type === 'daily' || type === 'all') {
      const targetDate = date ? new Date(date) : getYesterday()
      const aggregated = await aggregateDaily(targetDate)
      results.daily = {
        aggregated,
        date: targetDate.toISOString().split('T')[0],
      }
    }

    // 月別集計
    if (type === 'monthly' || type === 'all') {
      const yearMonth = date || getPreviousMonth()
      const aggregated = await aggregateMonthly(yearMonth)
      results.monthly = {
        aggregated,
        yearMonth,
      }
    }

    // 古いデータの削除（90日以上前のデータを削除）
    if (type === 'cleanup' || type === 'all') {
      const daysToKeep = 90
      const deleted = await cleanupOldViews(daysToKeep)
      results.cleanup = { deleted, daysKept: daysToKeep }
    }

    return NextResponse.json({
      success: true,
      type,
      ...results,
    })
  } catch (error) {
    console.error('Analytics aggregation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getYesterday(): Date {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
}

function getPreviousMonth(): string {
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = prevMonth.getFullYear()
  const month = String(prevMonth.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
