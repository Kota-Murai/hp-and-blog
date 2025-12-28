'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github.css'
import { Upload, Image as ImageIcon, Loader2, Eye, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Category, Tag } from '@/types/blog'
import ImageCropModal from './ImageCropModal'

interface BlogEditorProps {
  authorId: string
  initialData?: {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    thumbnail_url: string
    status: string
    category_id?: string
    tag_ids?: string[]
  }
  categories?: Category[]
  allTags?: Tag[]
}

export default function BlogEditor({
  authorId,
  initialData,
  categories = [],
  allTags = [],
}: BlogEditorProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const contentImageInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '')
  const [status, setStatus] = useState(initialData?.status || 'draft')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tag_ids || [])
  const [newTagName, setNewTagName] = useState('')
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>(allTags)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [isUploadingContent, setIsUploadingContent] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string>('')

  // 新規タグを作成
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsCreatingTag(true)
    setError('')

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'タグの作成に失敗しました')
      }

      const newTag = await response.json()
      setAvailableTags([...availableTags, newTag])
      setSelectedTagIds([...selectedTagIds, newTag.id])
      setNewTagName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タグの作成に失敗しました')
    } finally {
      setIsCreatingTag(false)
    }
  }

  // タグを選択/解除
  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

  // タイトルからスラッグを自動生成
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!isEditing && !slug) {
      setSlug(generateSlug(newTitle))
    }
  }

  // 画像アップロード関数
  const uploadImage = async (file: File, folder: string, type: 'thumbnail' | 'content' = 'content'): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('type', type)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'アップロードに失敗しました')
      }

      const data = await response.json()
      // 最適化情報をトーストで表示
      if (data.reductionPercent > 0) {
        toast.success('画像を最適化しました', {
          description: `${data.originalSizeFormatted} → ${data.optimizedSizeFormatted} (${data.reductionPercent}%削減)`,
          duration: 4000,
        })
      }
      return data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
      return null
    }
  }

  // サムネイル画像の選択時にトリミングモーダルを開く
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 画像をData URLとして読み込む
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)

    // inputをリセット
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  // トリミング完了時にアップロード
  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploadingThumbnail(true)
    setError('')

    const file = new File([croppedBlob], 'thumbnail.jpg', { type: 'image/jpeg' })
    const url = await uploadImage(file, 'thumbnails', 'thumbnail')

    if (url) {
      setThumbnailUrl(url)
    }

    setIsUploadingThumbnail(false)
    // Data URLをクリア
    setCropImageSrc('')
  }

  // 本文用画像のアップロード
  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingContent(true)
    setError('')

    const url = await uploadImage(file, 'content')
    if (url) {
      // カーソル位置にMarkdown画像構文を挿入
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageMarkdown = `![${file.name}](${url})`
        const newContent = content.slice(0, start) + imageMarkdown + content.slice(end)
        setContent(newContent)
        
        // カーソル位置を更新
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length)
        }, 0)
      } else {
        // textareaがない場合は末尾に追加
        setContent(content + `\n![${file.name}](${url})\n`)
      }
    }

    setIsUploadingContent(false)
    // inputをリセット
    if (contentImageInputRef.current) {
      contentImageInputRef.current.value = ''
    }
  }

  // ドラッグ&ドロップ対応
  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setIsUploadingContent(true)
    setError('')

    const url = await uploadImage(file, 'content')
    if (url) {
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const imageMarkdown = `![${file.name}](${url})`
        const newContent = content.slice(0, start) + imageMarkdown + content.slice(start)
        setContent(newContent)
      }
    }

    setIsUploadingContent(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent, publishStatus: string) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const endpoint = isEditing
        ? `/api/admin/blog/${initialData.id}`
        : '/api/admin/blog'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          thumbnail_url: thumbnailUrl,
          status: publishStatus,
          author_id: authorId,
          published_at: publishStatus === 'published' ? new Date().toISOString() : null,
          category_id: categoryId || null,
          tag_ids: selectedTagIds,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存に失敗しました')
      }

      router.push('/admin/blog')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id) return

    if (!confirm(`「${title}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/blog/${initialData.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      toast.success('記事を削除しました')
      router.push('/admin/blog')
      router.refresh()
    } catch {
      toast.error('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, status)}>
        <div className="grid gap-6">
          {/* タイトル */}
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="記事タイトル"
              required
              className="mt-1"
            />
          </div>

          {/* スラッグ */}
          <div>
            <Label htmlFor="slug">記事のURL（半角英数字・ハイフン推奨）</Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              ※ この値がURLの一部になります。例: https://www.toppomura.jp/blog/<span className="font-bold text-emerald-600">{slug || 'ここに入力した値'}</span>
            </p>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm mr-2 bg-gray-100 px-2 py-2 rounded-l-md border border-r-0">/blog/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-first-post"
                required
                className="rounded-l-none"
              />
            </div>
          </div>

          {/* 抜粋（SEO用） */}
          <div>
            <Label htmlFor="excerpt">抜粋（SEO用メタディスクリプション）</Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              ※ 検索エンジンの検索結果やSNSシェア時に表示される説明文です。未入力の場合は本文先頭150文字が自動で使用されます。
            </p>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="記事の概要を入力（150文字程度推奨）..."
              className="w-full p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {excerpt.length} / 500
            </p>
          </div>

          {/* カテゴリ・タグ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* カテゴリ選択 */}
            <div>
              <Label>カテゴリ</Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                ※ 記事の主分類を選択してください
              </p>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setCategoryId('')}
                >
                  カテゴリを解除
                </Button>
              )}
            </div>

            {/* タグ選択 */}
            <div>
              <Label>タグ</Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                ※ 記事に関連するタグを選択または作成してください
              </p>

              {/* 選択済みタグ */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                {selectedTagIds.map((tagId) => {
                  const tag = availableTags.find((t) => t.id === tagId)
                  if (!tag) return null
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="hover:bg-amber-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
                {selectedTagIds.length === 0 && (
                  <span className="text-gray-400 text-sm">タグが選択されていません</span>
                )}
              </div>

              {/* タグ選択ドロップダウン */}
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !selectedTagIds.includes(value)) {
                      toggleTag(value)
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="タグを追加..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter((tag) => !selectedTagIds.includes(tag.id))
                      .map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    {availableTags.filter((tag) => !selectedTagIds.includes(tag.id))
                      .length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        選択可能なタグがありません
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 新規タグ作成 */}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="新しいタグ名..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateTag}
                  disabled={isCreatingTag || !newTagName.trim()}
                >
                  {isCreatingTag ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="ml-1">作成</span>
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                新しいタグ名を入力してEnterまたは作成ボタンで追加
              </p>
            </div>
          </div>

          {/* サムネイル画像 */}
          <div>
            <Label>サムネイル画像</Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              ※ ブログ一覧で記事と一緒に表示される画像です
            </p>
            
            <div className="flex gap-2 mb-3">
              <Input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="URLを入力するか、画像をアップロード"
                className="flex-1"
              />
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isUploadingThumbnail}
              >
                {isUploadingThumbnail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="ml-2">アップロード</span>
              </Button>
            </div>

            {/* サムネイルプレビュー */}
            {thumbnailUrl && (
              <div className="border rounded-md p-4 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">プレビュー（一覧での表示イメージ）:</p>
                <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-md">
                  <div className="flex">
                    <div className="w-1/3 relative h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrl}
                        alt="サムネイルプレビュー"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="w-2/3 p-3">
                      <p className="text-xs text-gray-400">2024年12月18日</p>
                      <p className="font-bold text-sm mt-1 line-clamp-2">
                        {title || '記事タイトル'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 本文エディタ */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>本文（Markdown）</Label>
              <div className="flex gap-2">
                <input
                  ref={contentImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleContentImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => contentImageInputRef.current?.click()}
                  disabled={isUploadingContent}
                >
                  {isUploadingContent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  <span className="ml-1">画像挿入</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'エディタ' : 'プレビュー'}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-2">
              ※ 画像はドラッグ&ドロップでも挿入できます
            </p>

            {showPreview ? (
              <div className="border rounded-md p-4 min-h-[400px] bg-white prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                  {content || '*プレビューするテキストがありません*'}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  placeholder="Markdownで記事を書いてください...&#10;&#10;画像はドラッグ&ドロップで挿入できます"
                  className="w-full h-[400px] p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                {isUploadingContent && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>画像をアップロード中...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 送信ボタン */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/blog')}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                削除
              </Button>
            )}
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/admin/blog/${initialData.id}/preview`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-1" />
                実際の表示を確認
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '下書き保存'}
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={(e) => handleSubmit(e, 'published')}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '公開する'}
            </Button>
          </div>
        </div>
      </form>

      {/* サムネイル画像トリミングモーダル */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />
    </div>
  )
}
