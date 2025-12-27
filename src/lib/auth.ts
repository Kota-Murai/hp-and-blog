import { createClient } from '@/lib/supabase/server'

// 許可された管理者メールアドレスのリスト
export function getAllowedAdminEmails(): string[] {
  const emails = process.env.ALLOWED_ADMIN_EMAILS || ''
  return emails.split(',').map(email => email.trim()).filter(Boolean)
}

// 管理者かどうかをチェック（大文字小文字を区別しない）
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const normalizedEmail = email.toLowerCase()
  const allowedEmails = getAllowedAdminEmails()
  return allowedEmails.map(e => e.toLowerCase()).includes(normalizedEmail)
}

// 現在のユーザーを取得
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// 現在のユーザーが管理者かどうかをチェック
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return isAdminEmail(user.email)
}


