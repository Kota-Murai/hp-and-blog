'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function AnalyticsAggregator() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function runAggregation() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/analytics/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      })

      const data = await response.json()

      if (data.success) {
        const messages: string[] = []
        if (data.daily) {
          messages.push(`日別集計: ${data.daily.aggregated}件 (${data.daily.date})`)
        }
        if (data.monthly) {
          messages.push(`月別集計: ${data.monthly.aggregated}件 (${data.monthly.yearMonth})`)
        }
        if (data.cleanup) {
          messages.push(`古いデータ削除: ${data.cleanup.deleted}件`)
        }
        setResult(messages.join(' / '))
      } else {
        setResult('エラー: ' + (data.error || '不明なエラー'))
      }
    } catch {
      setResult('エラー: 通信エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">アクセス解析データ管理</h3>
          <p className="text-sm text-gray-500 mt-1">
            閲覧データの集計と古いデータの削除を実行します
          </p>
        </div>
        <Button
          onClick={runAggregation}
          disabled={isLoading}
          variant="outline"
          size="sm"
          aria-busy={isLoading}
        >
          {isLoading ? '処理中...' : '手動集計実行'}
        </Button>
      </div>
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`text-sm p-3 rounded ${
            result.startsWith('エラー')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {result}
        </div>
      )}
      <div className="mt-4 text-xs text-gray-400">
        <p>集計処理はGitHub Actionsにより毎日自動実行されます。手動実行は必要な場合のみ使用してください。</p>
        <ul className="mt-2 list-disc list-inside">
          <li>日別集計: 前日分の閲覧データを集計（デバイス統計含む）</li>
          <li>月別集計: 前月分の日別データを月別に集約</li>
          <li>古いデータ削除: 90日以上前の詳細データを削除</li>
        </ul>
      </div>
    </div>
  )
}
