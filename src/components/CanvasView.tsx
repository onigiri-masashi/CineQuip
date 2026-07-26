import { useEffect, useRef, useState, type Ref } from 'react'

import { renderScene } from '@/lib/effects/render'
import type { CinemaFilter } from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'

interface CanvasViewProps {
  image: LoadedImage
  filter: CinemaFilter
  /** 描画解像度の長辺上限（表示サイズとは独立） */
  maxDim: number
  className?: string
  label?: string
  ref?: Ref<HTMLCanvasElement>
}

/** 画像にフィルターを適用して canvas に描画する表示コンポーネント */
export function CanvasView({
  image,
  filter,
  maxDim,
  className,
  label,
  ref,
}: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [source, setSource] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setSource(img)
    }
    img.src = image.url
    return () => {
      cancelled = true
    }
  }, [image.url])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source) return
    // 連続したフィルター切替を 1 フレームにまとめる
    const id = requestAnimationFrame(() => {
      renderScene(canvas, source, filter, maxDim)
    })
    return () => cancelAnimationFrame(id)
  }, [source, filter, maxDim])

  const setRefs = (el: HTMLCanvasElement | null) => {
    canvasRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  return (
    <canvas
      ref={setRefs}
      role="img"
      aria-label={label}
      className={className}
    />
  )
}
