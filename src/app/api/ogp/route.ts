import { NextRequest, NextResponse } from 'next/server'

export interface OgpData {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string | null
  favicon: string | null
}

// OGPデータをキャッシュ（メモリキャッシュ - 本番では Redis などを検討）
const ogpCache = new Map<string, { data: OgpData; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24時間

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  // URLのバリデーション
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // キャッシュをチェック
  const cached = ogpCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      next: { revalidate: 86400 }, // 24時間キャッシュ
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    const ogpData = parseOgp(html, url)

    // キャッシュに保存
    ogpCache.set(url, { data: ogpData, timestamp: Date.now() })

    return NextResponse.json(ogpData)
  } catch (error) {
    console.error('OGP fetch error:', error)
    // エラー時は最低限のデータを返す
    const fallbackData: OgpData = {
      url,
      title: new URL(url).hostname,
      description: '',
      image: null,
      siteName: null,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
    }
    return NextResponse.json(fallbackData)
  }
}

function parseOgp(html: string, url: string): OgpData {
  const getMetaContent = (property: string): string | null => {
    // og:xxx または twitter:xxx
    const ogMatch = html.match(
      new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
    )
    if (ogMatch) return ogMatch[1]

    // content が先に来るパターン
    const reverseMatch = html.match(
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
    )
    return reverseMatch ? reverseMatch[1] : null
  }

  const getTitle = (): string => {
    const ogTitle = getMetaContent('og:title')
    if (ogTitle) return ogTitle

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : new URL(url).hostname
  }

  const getDescription = (): string => {
    const ogDesc = getMetaContent('og:description')
    if (ogDesc) return ogDesc

    const metaDesc = getMetaContent('description')
    return metaDesc || ''
  }

  const getImage = (): string | null => {
    const ogImage = getMetaContent('og:image') || getMetaContent('twitter:image')
    if (!ogImage) return null

    // 相対URLを絶対URLに変換
    if (ogImage.startsWith('//')) {
      return `https:${ogImage}`
    }
    if (ogImage.startsWith('/')) {
      const urlObj = new URL(url)
      return `${urlObj.origin}${ogImage}`
    }
    return ogImage
  }

  const getFavicon = (): string | null => {
    // link rel="icon" を探す
    const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i)
    if (iconMatch) {
      const href = iconMatch[1]
      if (href.startsWith('//')) return `https:${href}`
      if (href.startsWith('/')) {
        const urlObj = new URL(url)
        return `${urlObj.origin}${href}`
      }
      if (href.startsWith('http')) return href
    }
    // フォールバック: Google Favicon API
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
  }

  return {
    url,
    title: getTitle(),
    description: getDescription(),
    image: getImage(),
    siteName: getMetaContent('og:site_name'),
    favicon: getFavicon(),
  }
}
