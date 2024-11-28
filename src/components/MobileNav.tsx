"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="p-2" onClick={toggleMenu}>
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        <div className="h-[72px] bg-gradient-to-br from-white via-emerald-100 to-white p-4 flex items-center justify-between">
          <button onClick={toggleMenu} className="p-2">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="Logo"
              width={60}
              height={60}
              className="w-12 h-10"
            />
            <span className="text-base font-bold">Kota Murai Life&Code</span>
          </div>
        </div>
        <nav className="flex flex-col gap-4 p-4">
          <Link
            href="#top"
            className="block text-lg hover:text-emerald-600"
            onClick={toggleMenu}
          >
            トップ
          </Link>
          <Link
            href="#about"
            className="block text-lg hover:text-emerald-600"
            onClick={toggleMenu}
          >
            このサイトについて
          </Link>
          <Link
            href="#profile"
            className="block text-lg hover:text-emerald-600"
            onClick={toggleMenu}
          >
            プロフィール
          </Link>
          <Link
            href="#skills"
            className="block text-lg hover:text-emerald-600"
            onClick={toggleMenu}
          >
            スキル
          </Link>
          <Link
            href="#contact"
            className="block text-lg hover:text-emerald-600"
            onClick={toggleMenu}
          >
            お問い合わせ
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span 
                  className="block text-lg hover:text-emerald-600 cursor-pointer" 
                  onClick={toggleMenu}
                >
                  ブログ
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>準備中です</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </SheetContent>
    </Sheet>
  )
}