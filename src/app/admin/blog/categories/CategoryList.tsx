'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CategoryForm from './CategoryForm'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: Date | null
  _count: {
    posts: number
  }
}

interface CategoryListProps {
  categories: Category[]
  updateAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  deleteAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export default function CategoryList({
  categories,
  updateAction,
  deleteAction,
}: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = (id: string, postCount: number) => {
    if (postCount > 0) {
      const confirmed = window.confirm(
        `このカテゴリには ${postCount} 件の記事が紐づいています。削除すると、これらの記事からカテゴリが外れます。削除しますか？`
      )
      if (!confirmed) return
    } else {
      const confirmed = window.confirm('このカテゴリを削除しますか？')
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
                カテゴリ名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                スラッグ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                説明
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
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {category.slug}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 line-clamp-2">
                    {category.description || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {category._count.posts}件
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(category.id, category._count.posts)
                      }
                      disabled={isPending && deletingId === category.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isPending && deletingId === category.id
                        ? '削除中...'
                        : '削除'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>カテゴリを編集</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              action={updateAction}
              initialData={{
                id: editingCategory.id,
                name: editingCategory.name,
                slug: editingCategory.slug,
                description: editingCategory.description,
              }}
              onSuccess={() => setEditingCategory(null)}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
