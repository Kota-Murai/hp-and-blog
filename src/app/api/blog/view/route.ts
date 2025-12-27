import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// ボットのUser-Agentパターン
const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /applebot/i,
  /bot/i,
  /crawler/i,
  /spider/i,
]

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent))
}

function hashIP(ip: string, postId: string): string {
  // 日付とpostIdを含めることで、日ごと・記事ごとにハッシュが変わる
  const today = new Date().toISOString().split('T')[0]
  return crypto
    .createHash('sha256')
    .update(`${ip}-${postId}-${today}`)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ success: false, error: 'postId is required' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // ボット除外
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, counted: false, reason: 'bot' })
    }

    const ipHash = hashIP(ip, postId)

    // 同一IP・同一記事の今日の閲覧履歴を確認
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingView = await prisma.blog_post_views.findFirst({
      where: {
        post_id: postId,
        ip_hash: ipHash,
        viewed_at: { gte: today },
      },
    })

    if (existingView) {
      return NextResponse.json({ success: true, counted: false, reason: 'already_counted' })
    }

    // 閲覧記録を保存
    await prisma.blog_post_views.create({
      data: {
        post_id: postId,
        ip_hash: ipHash,
        user_agent: userAgent.slice(0, 500), // 長すぎるUAを切り詰め
      },
    })

    return NextResponse.json({ success: true, counted: true })
  } catch (error) {
    console.error('Failed to record view:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
