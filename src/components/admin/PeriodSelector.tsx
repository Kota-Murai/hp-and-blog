'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIOD_OPTIONS = [
  { value: '7', label: '7日間' },
  { value: '30', label: '30日間' },
  { value: '60', label: '60日間' },
  { value: '90', label: '90日間' },
] as const

interface PeriodSelectorProps {
  currentPeriod: number
}

export default function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', newPeriod)
    router.push(`/admin?${params.toString()}`)
  }

  return (
    <select
      value={currentPeriod.toString()}
      onChange={handleChange}
      aria-label="表示期間を選択"
      className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    >
      {PERIOD_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          過去{option.label}
        </option>
      ))}
    </select>
  )
}
