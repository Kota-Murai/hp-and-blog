import React from "react";
import Image from "next/image";

const TopSection: React.FC = () => {
  return (
    // Web版: ヘッダー高さ(約80px)を引いた高さ、スマホ版: 100vh
    // 背景色を暗めに設定して、画像読み込み前の灰色を目立たなくする
    <section className="relative h-screen md:h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-800">
      {/* 背景画像 */}
      <div className="absolute inset-0 animate-[fadeIn_1.2s_ease-out_forwards]">
        <Image
          src="/top_background.webp"
          alt="Top Background"
          fill
          sizes="100vw"
          quality={75}
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMjU1LC0yMi4xODY6Ojo4MS89PUBAQl5aXmJiYpKVkv/bUEBAX/9k="
          className="opacity-80 object-cover transform-gpu"
          style={{ objectPosition: '70% 25%' }}
        />
      </div>

      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black opacity-30"></div>

      {/* コンテンツ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 animate-[fadeIn_1.2s_ease-out_0.3s_forwards] opacity-0">
        <Image
          src="/logo.webp"
          alt="サイトロゴ"
          width={120}
          height={120}
          sizes="120px"
          quality={85}
          priority
        />
        <h1 className="mt-4 text-4xl md:text-6xl font-bold text-white">
          Kota Murai Life&Code
        </h1>
      </div>
    </section>
  );
};

export default TopSection;