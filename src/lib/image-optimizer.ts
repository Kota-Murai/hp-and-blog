import sharp from 'sharp'

export interface OptimizeOptions {
  type: 'thumbnail' | 'content'
  quality?: number
}

export interface OptimizeResult {
  buffer: Buffer
  width: number
  height: number
  format: string
  originalSize: number
  optimizedSize: number
  reductionPercent: number
}

/**
 * 画像を最適化（WebP変換・リサイズ・圧縮）
 * GIF形式はアニメーション対応のためそのまま返す
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  mimeType: string,
  options: OptimizeOptions
): Promise<OptimizeResult> {
  const originalSize = inputBuffer.length

  // GIFはアニメーション対応のため最適化をスキップ
  if (mimeType === 'image/gif') {
    const metadata = await sharp(inputBuffer).metadata()
    return {
      buffer: inputBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: 'gif',
      originalSize,
      optimizedSize: originalSize,
      reductionPercent: 0,
    }
  }

  const quality = options.quality || 80

  // サムネイル: 1200x630（OGP推奨サイズ）
  // 記事内画像: 幅1600px（アスペクト比維持）
  const maxWidth = options.type === 'thumbnail' ? 1200 : 1600
  const maxHeight = options.type === 'thumbnail' ? 630 : undefined

  let sharpInstance = sharp(inputBuffer)
  const metadata = await sharpInstance.metadata()

  // リサイズが必要な場合のみ実行
  const needsResize =
    (metadata.width && metadata.width > maxWidth) ||
    (options.type === 'thumbnail' && metadata.height && maxHeight && metadata.height > maxHeight)

  if (needsResize) {
    if (options.type === 'thumbnail') {
      // サムネイルは指定サイズに収める（アスペクト比維持、余白なし）
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    } else {
      // 記事内画像は幅のみ制限
      sharpInstance = sharpInstance.resize(maxWidth, undefined, {
        withoutEnlargement: true,
      })
    }
  }

  // WebPに変換して圧縮
  const optimizedBuffer = await sharpInstance
    .webp({ quality })
    .toBuffer()

  const optimizedMetadata = await sharp(optimizedBuffer).metadata()
  const optimizedSize = optimizedBuffer.length
  const reductionPercent = Math.round((1 - optimizedSize / originalSize) * 100)

  return {
    buffer: optimizedBuffer,
    width: optimizedMetadata.width || 0,
    height: optimizedMetadata.height || 0,
    format: 'webp',
    originalSize,
    optimizedSize,
    reductionPercent,
  }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
