import { applyMatrix, isIdentity } from '@/lib/effects/colorMatrix'
import type { CinemaFilter } from '@/lib/filters'

/** グレインの粒サイズの基準幅（この幅で等倍タイル） */
const GRAIN_BASE_WIDTH = 1280

/**
 * 画像にフィルター（色調・グレイン・ビネット）を適用して canvas に描画する。
 * プレビューと書き出しの両方がこの 1 本を通ることで見た目を完全に一致させる。
 *
 * @param maxDim 出力の長辺上限。指定すると縮小描画（プレビュー用）
 */
export function renderScene(
  canvas: HTMLCanvasElement,
  source: HTMLImageElement,
  filter: CinemaFilter,
  maxDim?: number,
) {
  const srcW = source.naturalWidth
  const srcH = source.naturalHeight
  const scale = maxDim ? Math.min(1, maxDim / Math.max(srcW, srcH)) : 1
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))

  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D コンテキストを取得できませんでした')

  ctx.drawImage(source, 0, 0, w, h)

  if (!isIdentity(filter.matrix)) {
    const imageData = ctx.getImageData(0, 0, w, h)
    applyMatrix(imageData.data, filter.matrix)
    ctx.putImageData(imageData, 0, 0)
  }

  if (filter.grain > 0) drawGrain(ctx, w, h, filter.grain)
  if (filter.vignette > 0) drawVignette(ctx, w, h, filter.vignette)
}

/**
 * renderScene の非同期版。描画前に 1 フレーム譲ることで、
 * 呼び出し側のローディング表示を確実に描画させる（書き出し用）。
 */
export async function renderSceneAsync(
  canvas: HTMLCanvasElement,
  source: HTMLImageElement,
  filter: CinemaFilter,
): Promise<void> {
  await nextFrame()
  renderScene(canvas, source, filter)
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/** フィルムグレイン（中間調中心のノイズを overlay 合成） */
export function drawGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opacity: number,
) {
  const tile = document.createElement('canvas')
  const tileSize = 256
  tile.width = tileSize
  tile.height = tileSize
  const tileCtx = tile.getContext('2d')
  if (!tileCtx) return

  const noise = tileCtx.createImageData(tileSize, tileSize)
  for (let i = 0; i < noise.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 64)
    noise.data[i] = v
    noise.data[i + 1] = v
    noise.data[i + 2] = v
    noise.data[i + 3] = 255
  }
  tileCtx.putImageData(noise, 0, 0)

  // 出力サイズに関わらず粒の見た目の大きさを揃えるためのスケール
  const scale = Math.max(1, w / GRAIN_BASE_WIDTH)
  const scaledTile = tileSize * scale

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = 'overlay'
  for (let y = 0; y < h; y += scaledTile) {
    for (let x = 0; x < w; x += scaledTile) {
      ctx.drawImage(tile, x, y, scaledTile, scaledTile)
    }
  }
  ctx.restore()
}

/** ビネット（楕円放射グラデーションによる四隅の暗がり） */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength: number,
) {
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(w / 2, h / 2)
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(0.45, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = gradient
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()
}
