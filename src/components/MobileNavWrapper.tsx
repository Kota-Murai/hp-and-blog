"use client"

import dynamic from "next/dynamic"
import { Menu } from "lucide-react"

// MobileNavをクライアントサイドでのみレンダリング（ハイドレーションエラー回避）
const MobileNav = dynamic(() => import("./MobileNav").then(mod => mod.MobileNav), {
  ssr: false,
  loading: () => (
    <button className="p-2" type="button" aria-label="メニューを開く">
      <Menu className="h-6 w-6" aria-hidden="true" />
    </button>
  ),
})

export function MobileNavWrapper() {
  return <MobileNav />
}
