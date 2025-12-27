import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"
import { headers } from "next/headers"

// レート制限の設定
const rateLimit = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1分
const RATE_LIMIT_MAX = 5 // 最大5回

function getClientIp(headersList: Headers): string {
  // Vercel/CloudFlare等のプロキシからIPを取得
  const forwarded = headersList.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = headersList.get("x-real-ip")
  if (realIp) {
    return realIp
  }
  return "unknown"
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)

  // 古いレコードをクリーンアップ
  if (rateLimit.size > 1000) {
    for (const [key, value] of rateLimit.entries()) {
      if (now - value.timestamp > RATE_LIMIT_WINDOW) {
        rateLimit.delete(key)
      }
    }
  }

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// バリデーションスキーマの定義
const contactSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100),
  company: z.string().max(100).optional().or(z.literal("")),
  message: z.string().max(1000, "お問い合わせ内容は1000文字以内で入力してください"),
})

export async function POST(request: Request) {
  try {
    // レート制限チェック
    const headersList = await headers()
    const clientIp = getClientIp(headersList)

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: { message: "送信回数の上限に達しました。しばらく時間をおいてから再度お試しください。" } },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsedData = contactSchema.parse(body)

    const { email, name, company, message } = parsedData

    // Nodemailerのトランスポート設定
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // 環境変数に設定してください
        pass: process.env.EMAIL_PASS, // 環境変数に設定してください
      },
    })

    // サイト管理者へのメール
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "新しいお問い合わせがありました",
      text: `
        新しいお問い合わせがありました。

        【メールアドレス】: ${email}
        【お名前】: ${name}
        【企業名・法人名】: ${company || "N/A"}
        【お問い合わせ内容】: ${message}
      `,
    }

    await transporter.sendMail(adminMailOptions)

    // ユーザーへの確認メール
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "お問い合わせありがとうございます",
      text: `
        ${name}様、

        お問い合わせいただきありがとうございます。以下の内容でお問い合わせを受け付けました。

        【お名前】: ${name}
        【企業名・法人名】: ${company || "N/A"}
        【お問い合わせ内容】: ${message}

        追ってご連絡いたします。
      `,
    }

    await transporter.sendMail(userMailOptions)

    return NextResponse.json({ message: "メールが送信されました" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ message: "メールの送信に失敗しました" }, { status: 500 })
  }
}