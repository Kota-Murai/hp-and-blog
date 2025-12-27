import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github.css'
import LinkCard from './LinkCard'
import type { BlogPost } from '@/types/blog'

// [card](URL) 記法を <link-card> タグに変換する前処理
function preprocessMarkdown(content: string): string {
  // [card](URL) を独立したブロック要素として変換
  // 前後に空行を追加して、Markdownパーサーが<p>タグで囲まないようにする
  return content.replace(
    /\[card\]\((https?:\/\/[^\s)]+)\)/g,
    '\n\n<link-card url="$1"></link-card>\n\n'
  )
}

// link-cardタグのprops型
interface LinkCardProps {
  url?: string
}

// カスタムコンポーネント定義
const markdownComponents: Components = {
  // link-card タグを LinkCard コンポーネントに変換
  'link-card': ({ url }: LinkCardProps) => {
    if (!url) return null
    return <LinkCard url={url} />
  },
} as Components


interface BlogArticleProps {
  post: BlogPost
  isPreview?: boolean
}

export default function BlogArticle({ post, isPreview = false }: BlogArticleProps) {
  // プレビューモードの場合は公開日がなければ作成日を使用
  const displayDate = post.published_at || post.created_at

  return (
    <article className={`min-h-screen bg-gradient-to-br from-white via-emerald-50 to-white pb-20 ${isPreview ? 'pt-8' : 'pt-32'}`}>
      <div className="max-w-3xl mx-auto px-4">
        {/* プレビューバナー */}
        {isPreview && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-medium">
                  プレビューモード
                  {post.status === 'draft' && '（この記事はまだ公開されていません）'}
                </span>
              </div>
              <div className="flex gap-3 text-sm">
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="text-amber-700 hover:text-amber-900 font-medium"
                >
                  編集に戻る
                </Link>
                <Link
                  href="/admin/blog"
                  className="text-amber-700 hover:text-amber-900 font-medium"
                >
                  記事一覧に戻る
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 記事ヘッダー */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <time className="text-sm text-gray-500">
              {displayDate
                ? new Date(displayDate).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </time>
            {post.category && (
              <Link
                href={isPreview ? `/admin/blog/category/${post.category.slug}/preview` : `/blog/category/${post.category.slug}`}
                className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">{post.title}</h1>

          {/* タグ */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={isPreview ? `/admin/blog/tag/${tag.slug}/preview` : `/blog/tag/${tag.slug}`}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* サムネイル画像 */}
        {post.thumbnail_url && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* 記事本文 */}
        <div className="prose prose-lg max-w-none prose-emerald prose-headings:font-bold prose-a:text-emerald-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={markdownComponents}
          >
            {preprocessMarkdown(post.content)}
          </ReactMarkdown>
        </div>

        {/* フッター */}
        <footer className="mt-12 pt-8 border-t">
          {isPreview ? (
            <div className="flex gap-4">
              <Link
                href={`/admin/blog/${post.id}/edit`}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← 編集に戻る
              </Link>
              <Link
                href="/admin/blog"
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                記事一覧に戻る
              </Link>
            </div>
          ) : (
            <Link
              href="/blog"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← 記事一覧に戻る
            </Link>
          )}
        </footer>
      </div>
    </article>
  )
}
