import type { CinemaFilter } from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'

/** 字幕の文字サイズ（画像幅に対する比率）。プレビューと揃える */
const SUBTITLE_FONT_RATIO = 0.042
/** 字幕のベースライン位置（画像下端からのオフセット比率） */
const SUBTITLE_BOTTOM_RATIO = 0.04

/**
 * フィルターと字幕を Canvas で焼き込んだ PNG Blob を生成する。
 * プレビュー（CSS）と同じパラメータを ctx.filter / グラデーション / ノイズで再現する。
 */
export async function renderToBlob(
  image: LoadedImage,
  filter: CinemaFilter,
  subtitle: string,
): Promise<Blob> {
  const img = await loadImage(image.url)
  const { naturalWidth: w, naturalHeight: h } = img

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D コンテキストを取得できませんでした')

  // 1. 色調フィルター
  ctx.filter = filter.cssFilter || 'none'
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'

  // 2. フィルムグレイン（mix-blend-overlay 相当）
  if (filter.grain > 0) {
    drawGrain(ctx, w, h, filter.grain)
  }

  // 3. ビネット
  if (filter.vignette > 0) {
    drawVignette(ctx, w, h, filter.vignette)
  }

  // 4. 字幕
  if (subtitle) {
    await drawSubtitle(ctx, w, h, subtitle)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('画像の書き出しに失敗しました'))
    }, 'image/png')
  })
}

/** 生成した Blob をファイルとしてダウンロードさせる */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** 元ファイル名から保存用ファイル名を組み立てる */
export function exportFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'scene'
  return `cinequip-${base}.png`
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = url
  })
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opacity: number,
) {
  // プレビューの SVG ノイズ（128px タイル・表示幅基準）に近づけるため、
  // 画像幅から粒の大きさを決めてノイズタイルを拡大描画する
  const tile = document.createElement('canvas')
  const tileSize = 256
  tile.width = tileSize
  tile.height = tileSize
  const tileCtx = tile.getContext('2d')
  if (!tileCtx) return

  const noise = tileCtx.createImageData(tileSize, tileSize)
  for (let i = 0; i < noise.data.length; i += 4) {
    // プレビュー（50% グレー基準の SVG ノイズ）に合わせ、中間調中心の弱いノイズにする
    const v = 96 + Math.floor(Math.random() * 64)
    noise.data[i] = v
    noise.data[i + 1] = v
    noise.data[i + 2] = v
    noise.data[i + 3] = 255
  }
  tileCtx.putImageData(noise, 0, 0)

  // 表示上の粒サイズ感に合わせるためのスケール（幅 1280px 相当で等倍）
  const scale = Math.max(1, w / 1280)
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

function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength: number,
) {
  // CSS の radial-gradient(ellipse, transparent 45%, black 100%) を再現
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

async function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  subtitle: string,
) {
  const fontSize = Math.round(w * SUBTITLE_FONT_RATIO)
  const font = `700 ${fontSize}px "Zen Old Mincho", "Hiragino Mincho ProN", serif`
  // Web フォントの読み込みを待ってから描画する（未読込だと代替フォントになる）
  try {
    await document.fonts.load(font, subtitle)
  } catch {
    // フォントが読み込めなくても代替フォントで描画を続行する
  }

  ctx.save()
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = '0.08em'
  }
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = fontSize * 0.15
  ctx.shadowOffsetY = fontSize * 0.03
  ctx.fillStyle = '#ffffff'
  ctx.fillText(subtitle, w / 2, h - h * SUBTITLE_BOTTOM_RATIO, w * 0.96)
  ctx.restore()
}
