'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface OgpData {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string | null
  favicon: string | null
}

interface LinkCardProps {
  url: string
}

export default function LinkCard({ url }: LinkCardProps) {
  const [ogp, setOgp] = useState<OgpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchOgp = async () => {
      try {
        const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setOgp(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOgp()
  }, [url])

  // ローディング中
  if (loading) {
    return (
      <span className="not-prose my-4 block border border-gray-200 rounded-lg overflow-hidden animate-pulse">
        <span className="flex">
          <span className="flex-1 p-4">
            <span className="block h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <span className="block h-4 bg-gray-200 rounded w-full mb-1" />
            <span className="block h-4 bg-gray-200 rounded w-2/3" />
          </span>
          <span className="w-32 md:w-48 bg-gray-200" />
        </span>
      </span>
    )
  }

  // エラー時は通常のリンクを表示
  if (error || !ogp) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 hover:underline break-all"
      >
        {url}
      </a>
    )
  }

  const hostname = new URL(url).hostname

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="not-prose my-4 block border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors group"
    >
      <span className="flex flex-col sm:flex-row">
        {/* コンテンツ */}
        <span className="flex-1 p-4 min-w-0 order-2 sm:order-1 block">
          <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 text-sm sm:text-base block">
            {ogp.title}
          </span>
          {ogp.description && (
            <span className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2 block">
              {ogp.description}
            </span>
          )}
          <span className="flex items-center gap-2 mt-2">
            {ogp.favicon && (
              <Image
                src={ogp.favicon}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4"
                unoptimized
              />
            )}
            <span className="text-xs text-gray-500 truncate">{hostname}</span>
          </span>
        </span>

        {/* 画像 */}
        {ogp.image && (
          <span className="relative w-full sm:w-32 md:w-48 h-32 sm:h-auto flex-shrink-0 bg-gray-100 order-1 sm:order-2 block">
            <Image
              src={ogp.image}
              alt={ogp.title}
              fill
              className="object-cover"
              unoptimized
            />
          </span>
        )}
      </span>
    </a>
  )
}
