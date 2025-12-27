import Link from 'next/link'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface BlogPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  basePath: string
}

export default function BlogPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  basePath,
}: BlogPaginationProps) {
  // ページが1ページのみの場合はページネーションを表示しない
  if (totalPages <= 1) {
    return null
  }

  // 表示範囲の計算
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // ページ番号のリストを生成
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      // 7ページ以下の場合は全て表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 8ページ以上の場合
      if (currentPage <= 4) {
        // 先頭付近
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // 末尾付近
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 中間
        pages.push(1)
        pages.push('ellipsis')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  // ページURLを生成
  const getPageUrl = (page: number): string => {
    if (page === 1) {
      return basePath
    }
    return `${basePath}?page=${page}`
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="mt-8 space-y-4">
      {/* 表示件数情報 */}
      <p className="text-center text-sm text-gray-600">
        全{totalItems}件中 {startItem}〜{endItem}件目を表示
      </p>

      {/* ページネーション */}
      <nav
        role="navigation"
        aria-label="pagination"
        className="mx-auto flex w-full justify-center"
      >
        <ul className="flex flex-row items-center gap-1">
          {/* 前へボタン */}
          {currentPage > 1 && (
            <li>
              <Link
                href={getPageUrl(currentPage - 1)}
                aria-label="前のページへ"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'default' }),
                  'gap-1 pl-2.5'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>前へ</span>
              </Link>
            </li>
          )}

          {/* ページ番号 */}
          {pageNumbers.map((page, index) => (
            <li key={index}>
              {page === 'ellipsis' ? (
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">その他のページ</span>
                </span>
              ) : (
                <Link
                  href={getPageUrl(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={cn(
                    buttonVariants({
                      variant: page === currentPage ? 'outline' : 'ghost',
                      size: 'icon',
                    })
                  )}
                >
                  {page}
                </Link>
              )}
            </li>
          ))}

          {/* 次へボタン */}
          {currentPage < totalPages && (
            <li>
              <Link
                href={getPageUrl(currentPage + 1)}
                aria-label="次のページへ"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'default' }),
                  'gap-1 pr-2.5'
                )}
              >
                <span>次へ</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  )
}
