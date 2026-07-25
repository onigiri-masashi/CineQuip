import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ImagePlus, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  IMAGE_LOAD_ERROR_MESSAGES,
  MIN_SHORT_SIDE,
  loadImageFile,
  type LoadedImage,
} from '@/lib/image'

interface ImageDropzoneProps {
  onSelect: (image: LoadedImage) => void
}

/** ドラッグ&ドロップまたはファイル選択で画像を 1 枚受け取る入力エリア */
export function ImageDropzone({ onSelect }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const result = await loadImageFile(file)
    if (result.ok) {
      setErrorMessage(null)
      onSelect(result.image)
    } else {
      setErrorMessage(IMAGE_LOAD_ERROR_MESSAGES[result.error])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors',
          isDragging && 'border-primary bg-accent',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          void handleFile(e.dataTransfer.files[0])
        }}
      >
        <ImagePlus className="size-10 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">
            画像をドラッグ&ドロップ、またはクリックして選択
          </p>
          <p className="text-xs text-muted-foreground">
            1枚のみ / 短辺{MIN_SHORT_SIDE}px以上の画像が使用できます
          </p>
        </div>
      </motion.button>

      {errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </motion.p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          // 同じファイルを選び直しても change が発火するようリセット
          e.target.value = ''
        }}
      />
    </div>
  )
}
