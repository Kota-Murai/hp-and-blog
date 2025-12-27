'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GitHubIcon } from '@/components/icons/SocialIcons'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleGitHubLogin = async () => {
    const supabase = createClient()
    
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-white">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2">管理画面ログイン</h1>
          <p className="text-gray-600 text-center mb-8">
            GitHubアカウントでログインしてください
          </p>

          {error === 'auth_failed' && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
              認証に失敗しました。もう一度お試しください。
            </div>
          )}
          {error === 'unauthorized' && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
              このアカウントには管理画面へのアクセス権限がありません。
            </div>
          )}

          <Button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800"
          >
            <GitHubIcon size={20} />
            GitHubでログイン
          </Button>

          <p className="text-xs text-gray-500 text-center mt-6">
            ※ 管理者として登録されたアカウントのみログイン可能です
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-white">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-64 mx-auto mb-8" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}

