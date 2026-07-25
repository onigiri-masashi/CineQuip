import { motion } from 'motion/react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  GRAIN_TEXTURE_URL,
  vignetteBackground,
  type CinemaFilter,
} from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'

interface PreviewProps {
  image: LoadedImage
  filter: CinemaFilter
  onClear: () => void
}

/** 選択された画像にフィルターを適用したプレビュー表示と取消ボタン */
export function Preview({ image, filter, onClear }: PreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4"
    >
      <div className="relative mx-auto overflow-hidden rounded-xl bg-black">
        <img
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
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="truncate text-xs text-muted-foreground">
          {image.fileName}（{image.width}×{image.height}）
        </p>
        <Button variant="outline" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          取消し
        </Button>
      </div>
    </motion.div>
  )
}
