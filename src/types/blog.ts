// ブログ記事の型定義
// Prismaで生成された型を再エクスポート
import type { blog_posts } from '@/generated/prisma/client'

export type BlogPostRaw = blog_posts
export type PostStatus = 'draft' | 'published'

// カテゴリの共通型
export interface Category {
  id: string
  name: string
  slug: string
}

// タグの共通型
export interface Tag {
  id: string
  name: string
  slug: string
}

// ブログ記事の表示用型（カテゴリ・タグを含む）
export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string | null
  thumbnail_url: string | null
  status: string
  published_at: Date | null
  created_at: Date | null
  updated_at: Date | null
  category?: Category | null
  tags?: Tag[]
}

// 記事作成時の入力型
export interface CreateBlogPostInput {
  title: string
  slug: string
  content: string
  excerpt?: string
  thumbnail_url?: string
  status?: PostStatus
  published_at?: Date
}

// 記事更新時の入力型
export interface UpdateBlogPostInput {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  thumbnail_url?: string
  status?: PostStatus
  published_at?: Date
}

// 記事一覧取得時のフィルター
export interface BlogPostFilter {
  status?: PostStatus
  limit?: number
  offset?: number
}

// 記事一覧のレスポンス型
export interface BlogPostListResponse {
  posts: BlogPost[]
  total: number
}

// フィルターデータの型
export interface FilterData {
  categories: Category[]
  tags: Tag[]
  currentCategory: string | null
  currentTag: string | null
  basePath: string
}

// ページネーションの型
export interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  basePath: string
}

