import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Dices, Download, LoaderCircle, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { downloadBlob, exportFileName, renderToBlob } from '@/lib/export'
import {
  GRAIN_TEXTURE_URL,
  vignetteBackground,
  type CinemaFilter,
} from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'

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
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgWidth, setImgWidth] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

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

  // 表示中の画像幅に追従して字幕サイズを決める（1 行に収めるため）
  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setImgWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const subtitleFontSize = Math.min(40, Math.max(10, imgWidth * 0.042))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4"
    >
      <div className="relative mx-auto w-fit overflow-hidden rounded-xl bg-black">
        <img
          ref={imgRef}
          src={image.url}
          alt={image.fileName}
          className="mx-auto max-h-[70svh] w-auto max-w-full"
          style={{ filter: filter.cssFilter || undefined }}
        />
        {filter.grain > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{
              backgroundImage: `url("${GRAIN_TEXTURE_URL}")`,
              opacity: filter.grain,
            }}
          />
        )}
        {filter.vignette > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: vignetteBackground(filter.vignette) }}
          />
        )}
        {subtitle && imgWidth > 0 && (
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
    </motion.div>
  )
}
