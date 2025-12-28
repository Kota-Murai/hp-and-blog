'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedBlob: Blob) => void
  aspectRatio?: number
}

// 中央に配置されたアスペクト比固定のクロップ領域を作成
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isCropping, setIsCropping] = useState(false)

  // 画像読み込み時に初期クロップ領域を設定
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      const newCrop = centerAspectCrop(width, height, aspectRatio)
      setCrop(newCrop)
    },
    [aspectRatio]
  )

  // トリミング実行
  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) return

    setIsCropping(true)

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height

      // 出力サイズを計算（元画像の解像度を維持）
      const outputWidth = completedCrop.width * scaleX
      const outputHeight = completedCrop.height * scaleY

      canvas.width = outputWidth
      canvas.height = outputHeight

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        outputWidth,
        outputHeight,
        0,
        0,
        outputWidth,
        outputHeight
      )

      // Blobに変換
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
            onClose()
          }
          setIsCropping(false)
        },
        'image/jpeg',
        0.95
      )
    } catch (error) {
      console.error('Crop failed:', error)
      setIsCropping(false)
    }
  }

  // モーダルが閉じられたときに状態をリセット
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCrop(undefined)
      setCompletedCrop(undefined)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>サムネイル画像のトリミング</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-0 overflow-auto">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="トリミング対象"
                onLoad={onImageLoad}
                style={{ maxHeight: '60vh', maxWidth: '100%' }}
              />
            </ReactCrop>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center py-2">
          枠をドラッグして切り出し範囲を調整してください（16:9固定）
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isCropping}>
            キャンセル
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleCrop}
            disabled={!completedCrop || isCropping}
          >
            {isCropping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                処理中...
              </>
            ) : (
              'トリミングして使用'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
