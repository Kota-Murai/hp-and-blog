'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import TagForm from './TagForm'

interface Tag {
  id: string
  name: string
  slug: string
  created_at: Date | null
  _count: {
    posts: number
  }
}

interface TagListProps {
  tags: Tag[]
  updateAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  deleteAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export default function TagList({
  tags,
  updateAction,
  deleteAction,
}: TagListProps) {
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = (id: string, postCount: number) => {
    if (postCount > 0) {
      const confirmed = window.confirm(
        `このタグには ${postCount} 件の記事が紐づいています。削除すると、これらの記事からタグが外れます。削除しますか？`
      )
      if (!confirmed) return
    } else {
      const confirmed = window.confirm('このタグを削除しますか？')
      if (!confirmed) return
    }

    setError(null)
    setDeletingId(id)

    const formData = new FormData()
    formData.append('id', id)

    startTransition(async () => {
      const result = await deleteAction(formData)
      if (result.error) {
        setError(result.error)
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タグ名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                スラッグ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                記事数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
                    {tag.name}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {tag.slug}
                  </code>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm ${
                      tag._count.posts === 0 ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {tag._count.posts}件
                    {tag._count.posts === 0 && (
                      <span className="ml-2 text-xs text-amber-600">未使用</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTag(tag)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tag.id, tag._count.posts)}
                      disabled={isPending && deletingId === tag.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isPending && deletingId === tag.id ? '削除中...' : '削除'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>タグを編集</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <TagForm
              action={updateAction}
              initialData={{
                id: editingTag.id,
                name: editingTag.name,
                slug: editingTag.slug,
              }}
              onSuccess={() => setEditingTag(null)}
              onCancel={() => setEditingTag(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
