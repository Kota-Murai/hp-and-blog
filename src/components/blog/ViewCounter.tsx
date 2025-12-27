'use client'

import { useEffect } from 'react'

interface ViewCounterProps {
  postId: string
}

export default function ViewCounter({ postId }: ViewCounterProps) {
  useEffect(() => {
    // ページ表示をブロックしないよう非同期で実行
    fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    }).catch(() => {
      // エラーは無視（閲覧カウントの失敗はUXに影響させない）
    })
  }, [postId])

  // UIは表示しない（公開ページでは閲覧数を表示しない仕様）
  return null
}
