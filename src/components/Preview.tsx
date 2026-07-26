import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Dices, Download, LoaderCircle, Share2, X } from 'lucide-react'

import { CanvasView } from '@/components/CanvasView'
import { Button } from '@/components/ui/button'
import { downloadBlob, exportFileName, renderToBlob } from '@/lib/export'
import { POST_INTENT_URL, shareToX } from '@/lib/share'
import { fitSubtitleFontSize } from '@/lib/subtitle-layout'
import type { CinemaFilter } from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'

/** プレビューの描画解像度の長辺上限（速度と画質のバランス） */
const PREVIEW_MAX_DIM = 1440

interface PreviewProps {
  image: LoadedImage
  filter: CinemaFilter
  subtitle: string
  onShuffleSubtitle: () => void
  onClear: () => void
}

/** 選択された画像にフィルターと字幕を重ねたプレビュー表示 */
export function Preview({
  image,
  filter,
  subtitle,
  onShuffleSubtitle,
  onClear,
}: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewWidth, setViewWidth] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState(false)
  const [showFallbackGuide, setShowFallbackGuide] = useState(false)

  // 表示中のプレビュー幅に追従して字幕サイズを決める（1 行に収めるため）
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setViewWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const subtitleFontSize = Math.min(
    40,
    Math.max(10, fitSubtitleFontSize(viewWidth, subtitle)),
  )

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(false)
    try {
      const blob = await renderToBlob(image, filter, subtitle)
      downloadBlob(blob, exportFileName(image.fileName))
    } catch {
      setSaveError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    setShareError(false)
    setShowFallbackGuide(false)
    try {
      const blob = await renderToBlob(image, filter, subtitle)
      const result = await shareToX(blob, exportFileName(image.fileName))
      // フォールバック時は投稿画面へのリンクと画像の添付操作を案内する
      if (result === 'fallback') setShowFallbackGuide(true)
    } catch {
      setShareError(true)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4"
    >
      <div className="relative mx-auto w-fit overflow-hidden rounded-xl bg-black">
        <CanvasView
          ref={canvasRef}
          image={image}
          filter={filter}
          maxDim={PREVIEW_MAX_DIM}
          label={image.fileName}
          className="mx-auto block max-h-[70svh] w-auto max-w-full"
        />
        {subtitle && viewWidth > 0 && (
          <p
            className="font-cinema pointer-events-none absolute inset-x-0 bottom-[4%] overflow-hidden text-center font-bold whitespace-nowrap text-white"
            style={{
              fontSize: subtitleFontSize,
              letterSpacing: '0.08em',
              textShadow:
                '0 0 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="truncate text-xs text-muted-foreground">
          {image.fileName}（{image.width}×{image.height}）
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onShuffleSubtitle}>
            <Dices aria-hidden="true" />
            字幕を変える
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            <X aria-hidden="true" />
            取消し
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleShare()}
            disabled={isSharing}
          >
            {isSharing ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Share2 aria-hidden="true" />
            )}
            Xでシェア
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            保存する
          </Button>
        </div>
      </div>
      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          画像の保存に失敗しました。もう一度お試しください。
        </p>
      )}
      {shareError && (
        <p role="alert" className="text-sm text-destructive">
          シェアに失敗しました。もう一度お試しください。
        </p>
      )}
      {showFallbackGuide && (
        <p role="status" className="text-sm text-muted-foreground">
          画像を保存しました。
          <a
            href={POST_INTENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Xの投稿画面を開き
          </a>
          、保存した画像を添付してください。
        </p>
      )}
    </motion.div>
  )
}
