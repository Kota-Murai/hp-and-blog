"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import Image from "next/image"
import { useState } from "react"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="p-2" type="button" aria-label="メニューを開く">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        {/* アクセシビリティ用の非表示タイトル */}
        <VisuallyHidden>
          <SheetTitle>ナビゲーションメニュー</SheetTitle>
        </VisuallyHidden>
        <div className="h-[72px] bg-gradient-to-br from-white via-emerald-100 to-white p-4 flex items-center justify-between">
          <button onClick={closeMenu} className="p-2" type="button" aria-label="メニューを閉じる">
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="サイトロゴ"
              width={60}
              height={60}
              sizes="48px"
              quality={85}
              className="w-12 h-10"
            />
            <span className="text-base font-bold">Kota Murai Life&Code</span>
          </div>
        </div>
        <nav className="flex flex-col gap-4 p-4">
          <Link
            href="/#top"
            className="block text-lg hover:text-emerald-600"
            onClick={closeMenu}
          >
            トップ
          </Link>
          <Link
            href="/#about"
            className="block text-lg hover:text-emerald-600"
            onClick={closeMenu}
          >
            このサイトについて
          </Link>
          <Link
            href="/#profile"
            className="block text-lg hover:text-emerald-600"
            onClick={closeMenu}
          >
            プロフィール
          </Link>
          <Link
            href="/#skills"
            className="block text-lg hover:text-emerald-600"
            onClick={closeMenu}
          >
            スキル
          </Link>
          <Link
            href="/#contact"
            className="block text-lg hover:text-emerald-600"
            onClick={closeMenu}
          >
            お問い合わせ
          </Link>
          <Link
            href="/blog"
            className="block text-lg hover:text-emerald-600"
            onClick={closeMenu}
          >
            ブログ
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}