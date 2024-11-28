import React from "react";
import Image from "next/image";

const TopSection: React.FC = () => {
  return (
    <section className="relative h-screen w-full">
      {/* 背景画像 */}
      <Image
        src="/top_background.webp"
        alt="Top Background"
        fill
        sizes="100vw"
        quality={100}
        className="opacity-80 object-cover"
        style={{ objectPosition: '70% 25%' }}
      />

      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black opacity-30"></div>

      {/* コンテンツ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <Image src="/logo.webp" alt="Logo" width={120} height={120} />
        <h1 className="mt-4 text-4xl md:text-6xl font-bold text-white">
          Kota Murai Life&Code
        </h1>
      </div>
    </section>
  );
};

export default TopSection;