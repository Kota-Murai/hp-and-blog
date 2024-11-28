"use client"

import React from "react";
import Image from "next/image";
import { FaInstagram } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa';
import { FaSquareXTwitter } from "react-icons/fa6";
import { useState, useEffect } from 'react';

const AboutSection: React.FC = () => {
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
            <b>※ブログは準備中です</b>
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
              alt="Icon"
              width={150}
              height={150}
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
        {/* ソーシャルメディアアイコン */}
        <div className="flex space-x-4 mt-6 justify-center">
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 transition-colors">
            <FaInstagram size={24} />
          </a>
          <a href={xUrl} target="_blank" rel="noopener noreferrer" className="text-black transition-colors">
            <FaSquareXTwitter size={24} />
          </a>
          <a href="https://github.com/Kota-Murai" target="_blank" rel="noopener noreferrer" className="text-black-600 transition-colors">
            <FaGithub size={24} />
          </a>
        </div>
      </section>
    </section>
  );
};

export default AboutSection;