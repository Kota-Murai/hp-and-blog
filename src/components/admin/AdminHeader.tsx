import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminHeaderProps {
  currentPage?: string
  backHref?: string
  userEmail?: string
  signOutAction?: () => Promise<void>
}

export default function AdminHeader({
  currentPage,
  backHref,
  userEmail,
  signOutAction
}: AdminHeaderProps) {
  return (
    <header className="bg-gray-100 border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* 戻るボタン（ダッシュボード以外で表示） */}
          {backHref && (
            <Link
              href={backHref}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label="戻る"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
          )}

          {/* 管理画面タイトル */}
          <span className="text-lg font-bold text-gray-900">
            管理画面
          </span>

          {/* 現在のページがある場合はパンくずリスト的に表示 */}
          {currentPage && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-900">
                {currentPage}
              </span>
            </>
          )}
        </div>

        {/* ユーザー情報とログアウト */}
        {userEmail && signOutAction && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{userEmail}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium border border-gray-400 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
