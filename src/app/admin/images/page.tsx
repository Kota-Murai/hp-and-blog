'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, ExternalLink, Copy, Check, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'

interface ImageFile {
  name: string
  path: string
  url: string
  size: number
  created_at: string
  folder: string
  usedInPosts: { id: string; title: string; slug: string }[]
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unused' | 'thumbnails' | 'content'>('all')

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/images')
      if (!response.ok) {
        throw new Error('画像一覧の取得に失敗しました')
      }
      const data = await response.json()
      setImages(data.images)
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleDelete = async (path: string, usedCount: number) => {
    if (usedCount > 0) {
      if (!confirm(`この画像は ${usedCount} 件の記事で使用されています。本当に削除しますか？\n\n※ 削除すると記事内の画像が表示されなくなります。`)) {
        return
      }
    } else {
      if (!confirm('この画像を削除しますか？')) {
        return
      }
    }

    setDeleting(path)
    try {
      const response = await fetch(`/api/admin/images/${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }
      setImages(images.filter(img => img.path !== path))
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '不明'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '不明'
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredImages = images.filter(img => {
    if (filter === 'all') return true
    if (filter === 'unused') return img.usedInPosts.length === 0
    if (filter === 'thumbnails') return img.folder === 'thumbnails'
    if (filter === 'content') return img.folder === 'content'
    return true
  })

  const unusedCount = images.filter(img => img.usedInPosts.length === 0).length

  if (loading) {
    return (
      <div className="min-h-screen">
        <AdminHeader
          currentPage="画像管理"
          backHref="/admin"
        />
        <main className="max-w-7xl mx-auto px-4 py-8" aria-busy="true" aria-label="画像を読み込み中">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <AdminHeader
        currentPage="画像管理"
        backHref="/admin"
      />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">画像一覧</h2>
            <p className="text-sm text-gray-500 mt-1">
              合計 {images.length} 枚 / 未使用 {unusedCount} 枚
            </p>
          </div>
        </div>

        {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          すべて ({images.length})
        </Button>
        <Button
          variant={filter === 'unused' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unused')}
          className={filter !== 'unused' && unusedCount > 0 ? 'border-yellow-400 text-yellow-700' : ''}
        >
          未使用 ({unusedCount})
        </Button>
        <Button
          variant={filter === 'thumbnails' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('thumbnails')}
        >
          サムネイル
        </Button>
        <Button
          variant={filter === 'content' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('content')}
        >
          本文用
        </Button>
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            {filter === 'unused' ? '未使用の画像はありません' : '画像がありません'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image) => (
            <div key={image.path} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 画像プレビュー */}
              <div className="relative h-40 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
                <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded ${
                  image.folder === 'thumbnails' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {image.folder === 'thumbnails' ? 'サムネイル' : '本文用'}
                </span>
              </div>

              {/* 情報 */}
              <div className="p-4">
                <p className="text-sm font-medium truncate" title={image.name}>
                  {image.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatSize(image.size)} / {formatDate(image.created_at)}
                </p>

                {/* 使用状況 */}
                <div className="mt-3">
                  {image.usedInPosts.length > 0 ? (
                    <div>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        {image.usedInPosts.length} 件の記事で使用中
                      </p>
                      <div className="mt-1 space-y-1">
                        {image.usedInPosts.slice(0, 2).map(post => (
                          <Link
                            key={post.id}
                            href={`/admin/blog/${post.id}/edit`}
                            className="text-xs text-blue-600 hover:underline block truncate"
                          >
                            → {post.title}
                          </Link>
                        ))}
                        {image.usedInPosts.length > 2 && (
                          <p className="text-xs text-gray-500">
                            他 {image.usedInPosts.length - 2} 件
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-yellow-600">未使用</p>
                  )}
                </div>

                {/* アクション */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(image.url)}
                  >
                    {copiedUrl === image.url ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-1">{copiedUrl === image.url ? 'コピー済' : 'URL'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={image.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(image.path, image.usedInPosts.length)}
                    disabled={deleting === image.path}
                  >
                    {deleting === image.path ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>
    </div>
  )
}


