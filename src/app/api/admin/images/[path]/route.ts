import { NextResponse } from 'next/server'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Service Role Keyを使用してRLSをバイパスする管理者用クライアント
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Next.js 15+ではparamsがPromiseになった
    const { path } = await params
    // パスをデコード（URLエンコードされている可能性があるため）
    const filePath = decodeURIComponent(path)

    const supabase = createAdminClient()
    const { error } = await supabase.storage
      .from('blog')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}

