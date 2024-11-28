"use client"

import { FaInstagram, FaGithub } from 'react-icons/fa'
import { FaSquareXTwitter } from "react-icons/fa6"
import { useState, useEffect } from 'react'

const Footer = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  // SNSリンクの設定
  const instagramUrl = isMobile
    ? "instagram://user?username=kota.murai"
    : "https://instagram.com/kota.murai"
  
  const xUrl = isMobile
    ? "twitter://user?screen_name=DevelopTopo"
    : "https://twitter.com/DevelopTopo"

  return (
    <footer className="w-full bg-gradient-to-br from-white via-emerald-100 to-white py-6 px-4 md:fixed md:bottom-0 z-[49]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        <div className="flex space-x-6">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700 transition-colors"
          >
            <FaInstagram size={24} />
          </a>
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:text-gray-700 transition-colors"
          >
            <FaSquareXTwitter size={24} />
          </a>
          <a
            href="https://github.com/Kota-Murai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:text-gray-700 transition-colors"
          >
            <FaGithub size={24} />
          </a>
        </div>
        <p className="text-sm text-gray-600 text-center">
          このサイトは日本国内のユーザー向けに運営されています<br />
          © 2024 Kota Murai. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer