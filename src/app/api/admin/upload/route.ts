import { NextResponse } from 'next/server'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { optimizeImage, formatFileSize, OptimizeOptions } from '@/lib/image-optimizer'

// マジックバイト定義（ファイル形式の識別用）
const MAGIC_NUMBERS: { [key: string]: number[] } = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp_riff: [0x52, 0x49, 0x46, 0x46], // RIFF header
}

function validateMagicBytes(buffer: ArrayBuffer): { valid: boolean; detectedFormat: string | null } {
  const bytes = new Uint8Array(buffer)

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, detectedFormat: 'jpeg' }
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { valid: true, detectedFormat: 'png' }
  }

  // GIF: 47 49 46 (GIF)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { valid: true, detectedFormat: 'gif' }
  }

  // WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    // Check for WEBP signature at bytes 8-11
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { valid: true, detectedFormat: 'webp' }
    }
  }

  return { valid: false, detectedFormat: null }
}

// Service Role Keyを使用してRLSをバイパスする管理者用クライアント
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string || 'images'
    const imageType = formData.get('type') as 'thumbnail' | 'content' || 'content'

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    // ファイルサイズチェック（10MB制限 - 最適化前なので余裕を持たせる）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
    }

    // 許可するファイルタイプ（MIME型チェック）
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPEG, PNG, WebP, GIF形式の画像のみアップロード可能です' },
        { status: 400 }
      )
    }

    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer()

    // マジックバイト検証（MIME型偽装対策）
    const magicValidation = validateMagicBytes(arrayBuffer)
    if (!magicValidation.valid) {
      return NextResponse.json(
        { error: '不正なファイル形式です。正しい画像ファイルをアップロードしてください。' },
        { status: 400 }
      )
    }

    const originalBuffer = Buffer.from(arrayBuffer)

    // 画像を最適化（WebP変換・リサイズ・圧縮）
    const optimizeOptions: OptimizeOptions = {
      type: imageType,
      quality: 80,
    }
    const optimized = await optimizeImage(originalBuffer, file.type, optimizeOptions)

    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    // GIF以外はWebPに変換されるので拡張子を変更
    const extension = optimized.format === 'gif' ? 'gif' : 'webp'
    const fileName = `${folder}/${timestamp}-${randomString}.${extension}`

    // Service Role Keyを使用してアップロード（RLSをバイパス）
    const supabase = createAdminClient()

    // MIMEタイプを設定
    const contentType = optimized.format === 'gif' ? 'image/gif' : 'image/webp'

    const { data, error } = await supabase.storage
      .from('blog')
      .upload(fileName, optimized.buffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
    }

    // 公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from('blog')
      .getPublicUrl(data.path)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
      fileName: file.name,
      // 最適化情報
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      reductionPercent: optimized.reductionPercent,
      width: optimized.width,
      height: optimized.height,
      format: optimized.format,
      // 人間が読みやすい形式
      originalSizeFormatted: formatFileSize(optimized.originalSize),
      optimizedSizeFormatted: formatFileSize(optimized.optimizedSize),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}

