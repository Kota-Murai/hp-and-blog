import React from "react";
import Link from "next/link";
import Image from "next/image";
import { InstagramIcon, XTwitterIcon, GitHubIcon } from "@/components/icons/SocialIcons";

// SNSリンクコンポーネント（デスクトップ用：WebURL）
const SnsLinksDesktop: React.FC = () => (
  <div className="hidden md:flex space-x-4 mt-6 justify-center">
    <a href="https://instagram.com/kota.murai" target="_blank" rel="noopener noreferrer" className="text-pink-600 transition-colors" aria-label="Instagramを開く">
      <InstagramIcon size={24} />
    </a>
    <a href="https://twitter.com/DevelopTopo" target="_blank" rel="noopener noreferrer" className="text-black transition-colors" aria-label="X(Twitter)を開く">
      <XTwitterIcon size={24} />
    </a>
    <a href="https://github.com/Kota-Murai" target="_blank" rel="noopener noreferrer" className="text-black transition-colors" aria-label="GitHubを開く">
      <GitHubIcon size={24} />
    </a>
  </div>
)

// SNSリンクコンポーネント（モバイル用：アプリリンク）
const SnsLinksMobile: React.FC = () => (
  <div className="flex md:hidden space-x-4 mt-6 justify-center">
    <a href="instagram://user?username=kota.murai" target="_blank" rel="noopener noreferrer" className="text-pink-600 transition-colors" aria-label="Instagramを開く">
      <InstagramIcon size={24} />
    </a>
    <a href="twitter://user?screen_name=DevelopTopo" target="_blank" rel="noopener noreferrer" className="text-black transition-colors" aria-label="X(Twitter)を開く">
      <XTwitterIcon size={24} />
    </a>
    <a href="https://github.com/Kota-Murai" target="_blank" rel="noopener noreferrer" className="text-black transition-colors" aria-label="GitHubを開く">
      <GitHubIcon size={24} />
    </a>
  </div>
)

const AboutSection: React.FC = () => {
  return (
    <section>
      {/* アンカースパイダー */}
      <div className="relative -top-20"></div>

      {/* 第一セクション */}
      <section id="about" className="relative bg-gradient-to-br from-white via-emerald-50 to-white flex items-center py-40">
        {/* コンテンツ */}
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-12">About this site</h2>
          <p className="text-base text-gray-700 leading-loose">
            ここはWebエンジニア村井 洸太のHPです。<br />
            主にエンジニアとしての経歴やスキルについてまとめています。<br />
            ブログではプログラミングのことだけではなく趣味などについてもシェアしていきます。<br />
            ご興味ある方は覗いてみてください。<br />
            <Link href="/blog" className="text-emerald-600 hover:text-emerald-700 underline">ブログはこちら</Link>
          </p>
        </div>
      </section>

      {/* 第二セクション */}
      <section id="profile" className="flex flex-col items-center justify-center px-4 py-20">
        {/* 見出し */}
        <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">About me</h2>

        {/* アイコン画像と説明文の塊 */}
        <div className="flex flex-col items-center md:flex-row md:items-center max-w-4xl">
          {/* アイコン画像 */}
          <div className="mb-8 md:mb-0 md:mr-8">
            <Image
              src="/icon.webp"
              alt="プロフィール画像"
              width={150}
              height={150}
              sizes="150px"
              quality={85}
              className="rounded-full object-cover"
            />
          </div>

          {/* 説明文 */}
          <div className="text-left max-w-xl flex flex-col">
            <p className="text-base text-gray-800 leading-loose">
              村井洸太。奈良生まれ大阪育ち奈良在住のフリーランスWebエンジニア。大学では電気電子工学を専攻し、システム開発の基礎を学びました。新卒でIT企業に入社し汎用機上で動作するWebシステムの受託開発に従事。27歳でWeb系自社開発企業に転職し、現在はフリーランスエンジニアとしてリモートワークで働いています。AWSでのサーバー構築からフロントエンドとバックエンドの開発まで幅広い領域を経験しています。趣味はゲーム、テニス、散歩、筋トレ、登山。
            </p>
          </div>
        </div>
        {/* ソーシャルメディアアイコン（CSSメディアクエリで出し分け） */}
        <SnsLinksDesktop />
        <SnsLinksMobile />
      </section>
    </section>
  );
};

export default AboutSection;