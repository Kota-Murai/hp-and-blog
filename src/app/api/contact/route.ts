import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"

// バリデーションスキーマの定義
const contactSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100),
  company: z.string().max(100).optional().or(z.literal("")),
  message: z.string().max(1000, "お問い合わせ内容は1000文字以内で入力してください"),
})

export async function POST(request: Request) {
  try {
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