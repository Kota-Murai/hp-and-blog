import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'

export interface ApiErrorResponse {
  error: string
  code?: string
}

/**
 * APIエラーを適切なレスポンスに変換する
 */
export function handleApiError(error: unknown, context: string): NextResponse<ApiErrorResponse> {
  console.error(`Error in ${context}:`, error)

  // Prismaエラーの処理
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // ユニーク制約違反
        return NextResponse.json(
          { error: '既に存在するデータです', code: 'DUPLICATE' },
          { status: 409 }
        )
      case 'P2025':
        // レコードが見つからない
        return NextResponse.json(
          { error: 'データが見つかりません', code: 'NOT_FOUND' },
          { status: 404 }
        )
      case 'P2003':
        // 外部キー制約違反
        return NextResponse.json(
          { error: '関連するデータが存在しません', code: 'FOREIGN_KEY' },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          { error: 'データベースエラーが発生しました', code: error.code },
          { status: 500 }
        )
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: '入力データが不正です', code: 'VALIDATION' },
      { status: 400 }
    )
  }

  // 一般的なエラー
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  )
}
