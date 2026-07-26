import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Copy, Dices, Download, LoaderCircle, Share2, X } from 'lucide-react'

import { CanvasView } from '@/components/CanvasView'
import { Button } from '@/components/ui/button'
import { downloadBlob, exportFileName, renderToBlob } from '@/lib/export'
import { buildPostIntentUrl, copyImageToClipboard } from '@/lib/share'
import { layoutSubtitle, SUBTITLE_LINE_HEIGHT } from '@/lib/subtitle-layout'
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
  const [isCopying, setIsCopying] = useState(false)
  const [copyStatus, setCopyStatus] = useState<
    'idle' | 'copied' | 'downloaded' | 'error'
  >('idle')

  // 表示中のプレビュー幅に追従して字幕の行分割とサイズを決める
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setViewWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const subtitleLayout = layoutSubtitle(viewWidth, subtitle)
  const subtitleFontSize = Math.min(40, Math.max(10, subtitleLayout.fontSize))

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

  const handleCopy = () => {
    setIsCopying(true)
    setCopyStatus('idle')
    // Safari はユーザー操作直後しかクリップボード書き込みを許可しないため、
    // 画像生成を待たずに Blob の Promise を渡して同期的にコピーを開始する
    const blobPromise = renderToBlob(image, filter, subtitle)
    void (async () => {
      try {
        const copied = await copyImageToClipboard(blobPromise)
        if (copied) {
          setCopyStatus('copied')
        } else {
          downloadBlob(await blobPromise, exportFileName(image.fileName))
          setCopyStatus('downloaded')
        }
      } catch {
        // コピーが拒否された場合はダウンロードにフォールバックする
        try {
          downloadBlob(await blobPromise, exportFileName(image.fileName))
          setCopyStatus('downloaded')
        } catch {
          setCopyStatus('error')
        }
      } finally {
        setIsCopying(false)
      }
    })()
  }

  const handleShare = () => {
    // 非同期処理を挟むとポップアップブロックされるため同期で開く
    window.open(buildPostIntentUrl(), '_blank', 'noopener,noreferrer')
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
            className="font-cinema pointer-events-none absolute inset-x-0 bottom-[4%] overflow-hidden text-center text-white"
            style={{
              fontSize: subtitleFontSize,
              lineHeight: SUBTITLE_LINE_HEIGHT,
              letterSpacing: '0.08em',
              textShadow:
                '0 0 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)',
            }}
          >
            {subtitleLayout.lines.map((line) => (
              <span key={line} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
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
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          画像をコピーして、Xの投稿にペーストしてシェアできます
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={isCopying}
          >
            {isCopying ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            画像をコピー
          </Button>
          <Button variant="secondary" size="sm" onClick={handleShare}>
            <Share2 aria-hidden="true" />
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
      {copyStatus === 'copied' && (
        <p role="status" className="text-sm text-muted-foreground">
          画像をコピーしました。Xの投稿画面にペーストして添付してください。
        </p>
      )}
      {copyStatus === 'downloaded' && (
        <p role="status" className="text-sm text-muted-foreground">
          コピーの代わりに画像を保存しました。Xの投稿に添付してください。
        </p>
      )}
      {copyStatus === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          画像のコピーに失敗しました。もう一度お試しください。
        </p>
      )}
    </motion.div>
  )
}
