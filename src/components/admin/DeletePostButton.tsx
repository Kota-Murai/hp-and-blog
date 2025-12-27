'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeletePostButtonProps {
  postId: string
  postTitle: string
  variant?: 'icon' | 'button'
}

export default function DeletePostButton({ postId, postTitle, variant = 'icon' }: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`「${postTitle}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      toast.success('記事を削除しました')
      router.refresh()

      // 編集画面から削除した場合は一覧に戻る
      if (variant === 'button') {
        router.push('/admin/blog')
      }
    } catch {
      toast.error('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`「${postTitle}」を削除`}
        aria-busy={isDeleting}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        )}
        削除
      </button>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`「${postTitle}」を削除`}
      aria-busy={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin inline" aria-hidden="true" />
      ) : (
        '削除'
      )}
    </button>
  )
}
