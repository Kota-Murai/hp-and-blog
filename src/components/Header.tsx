import React from "react"
import Link from "next/link"
import Image from "next/image"
import { MobileNavWrapper } from "./MobileNavWrapper"

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-background shadow-md z-50 bg-gradient-to-br from-white via-emerald-100 to-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-4">
          {/* モバイルナビゲーション */}
          <div className="md:hidden">
            <MobileNavWrapper />
          </div>

          {/* ロゴとサイト名 */}
          <Link href="/#top" className="flex items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="サイトロゴ"
              width={60}
              height={60}
              sizes="(max-width: 640px) 48px, (max-width: 768px) 52px, 65px"
              quality={85}
              className="w-12 h-10 sm:w-[52px] sm:h-12 md:w-[65px] md:h-[60px]"
            />
            <span className="text-base sm:text-lg md:text-xl font-bold whitespace-nowrap">
              Kota Murai Life&Code
            </span>
          </Link>
        </div>

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:block" aria-label="メインナビゲーション">
          <ul className="flex items-center gap-6">
            <li>
              <Link href="/#top" className="hover:text-emerald-600 text-sm lg:text-base">
                トップ
              </Link>
            </li>
            <li>
              <Link href="/#about" className="hover:text-emerald-600 text-sm lg:text-base">
                このサイトについて
              </Link>
            </li>
            <li>
              <Link href="/#profile" className="hover:text-emerald-600 text-sm lg:text-base">
                プロフィール
              </Link>
            </li>
            <li>
              <Link href="/#skills" className="hover:text-emerald-600 text-sm lg:text-base">
                スキル
              </Link>
            </li>
            <li>
              <Link href="/#contact" className="hover:text-emerald-600 text-sm lg:text-base">
                お問い合わせ
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-emerald-600 text-sm lg:text-base">
                ブログ
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header