import { InstagramIcon, XTwitterIcon, GitHubIcon } from "@/components/icons/SocialIcons"

// SNSリンクコンポーネント（デスクトップ用：WebURL）
const SnsLinksDesktop: React.FC = () => (
  <div className="hidden md:flex space-x-6">
    <a
      href="https://instagram.com/kota.murai"
      target="_blank"
      rel="noopener noreferrer"
      className="text-pink-600 hover:text-pink-700 transition-colors"
      aria-label="Instagramを開く"
    >
      <InstagramIcon size={24} />
    </a>
    <a
      href="https://twitter.com/DevelopTopo"
      target="_blank"
      rel="noopener noreferrer"
      className="text-black hover:text-gray-700 transition-colors"
      aria-label="X(Twitter)を開く"
    >
      <XTwitterIcon size={24} />
    </a>
    <a
      href="https://github.com/Kota-Murai"
      target="_blank"
      rel="noopener noreferrer"
      className="text-black hover:text-gray-700 transition-colors"
      aria-label="GitHubを開く"
    >
      <GitHubIcon size={24} />
    </a>
  </div>
)

// SNSリンクコンポーネント（モバイル用：アプリリンク）
const SnsLinksMobile: React.FC = () => (
  <div className="flex md:hidden space-x-6">
    <a
      href="instagram://user?username=kota.murai"
      target="_blank"
      rel="noopener noreferrer"
      className="text-pink-600 hover:text-pink-700 transition-colors"
      aria-label="Instagramを開く"
    >
      <InstagramIcon size={24} />
    </a>
    <a
      href="twitter://user?screen_name=DevelopTopo"
      target="_blank"
      rel="noopener noreferrer"
      className="text-black hover:text-gray-700 transition-colors"
      aria-label="X(Twitter)を開く"
    >
      <XTwitterIcon size={24} />
    </a>
    <a
      href="https://github.com/Kota-Murai"
      target="_blank"
      rel="noopener noreferrer"
      className="text-black hover:text-gray-700 transition-colors"
      aria-label="GitHubを開く"
    >
      <GitHubIcon size={24} />
    </a>
  </div>
)

const Footer = () => {
  return (
    <footer id="site-footer" className="w-full bg-gradient-to-br from-white via-emerald-100 to-white py-6 px-4 md:fixed md:bottom-0 z-[49]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        {/* SNSリンク（CSSメディアクエリで出し分け） */}
        <SnsLinksDesktop />
        <SnsLinksMobile />
        <p className="text-sm text-gray-600 text-center">
          このサイトは日本国内のユーザー向けに運営されています<br />
          © 2024 Kota Murai. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer