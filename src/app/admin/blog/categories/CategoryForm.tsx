'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CategoryFormProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  initialData?: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CategoryForm({
  action,
  initialData,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')

  // 名前からスラッグを自動生成（新規作成時のみ）
  const handleNameChange = (value: string) => {
    setName(value)
    if (!initialData) {
      // 日本語をローマ字に変換せず、英数字のみ許可
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setSlug(autoSlug)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        if (onSuccess) {
          onSuccess()
        } else {
          // 新規作成時はフォームをリセット
          setName('')
          setSlug('')
          setDescription('')
          formRef.current?.reset()
        }
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">カテゴリ名 *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="例: 技術"
            required
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">スラッグ *</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="例: tech"
            required
            maxLength={50}
            pattern="^[a-z0-9-]+$"
            title="英小文字、数字、ハイフンのみ使用可能"
          />
          <p className="text-xs text-gray-500">
            URLに使用されます（英小文字、数字、ハイフンのみ）
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明（任意）</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="カテゴリの説明（SEO用のメタディスクリプションとしても使用されます）"
          rows={2}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isPending ? '保存中...' : initialData ? '更新' : '作成'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
      </div>
    </form>
  )
}
