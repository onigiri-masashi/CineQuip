import { renderSceneAsync } from '@/lib/effects/render'
import type { CinemaFilter } from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'
import {
  layoutSubtitle,
  SUBTITLE_LETTER_SPACING_EM,
  SUBTITLE_LINE_HEIGHT,
  SUBTITLE_MAX_WIDTH_RATIO,
} from '@/lib/subtitle-layout'

/** 字幕のベースライン位置（画像下端からのオフセット比率） */
const SUBTITLE_BOTTOM_RATIO = 0.04

/**
 * フィルターと字幕を焼き込んだ PNG Blob を生成する。
 * フィルター描画はプレビューと同じ renderScene を全解像度で実行する。
 */
export async function renderToBlob(
  image: LoadedImage,
  filter: CinemaFilter,
  subtitle: string,
): Promise<Blob> {
  const img = await loadImage(image.url)
  const canvas = document.createElement('canvas')

  await renderSceneAsync(canvas, img, filter)

  if (subtitle) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D コンテキストを取得できませんでした')
    await drawSubtitle(ctx, canvas.width, canvas.height, subtitle)
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

async function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  subtitle: string,
) {
  const { lines, fontSize: fitSize } = layoutSubtitle(w, subtitle)
  const fontSize = Math.round(fitSize)
  // しねきゃぷしょんは単一ウェイトのため通常ウェイトで描画する（プレビューと揃える）
  const font = `${fontSize}px cinecaption, "Zen Old Mincho", "Hiragino Mincho ProN", serif`
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
    ctx.letterSpacing = `${SUBTITLE_LETTER_SPACING_EM}em`
  }
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = fontSize * 0.15
  ctx.shadowOffsetY = fontSize * 0.03
  ctx.fillStyle = '#ffffff'
  // フォントサイズ計算は見積もりのため、想定外のはみ出しは maxWidth で保険をかける
  const lineHeight = fontSize * SUBTITLE_LINE_HEIGHT
  const bottom = h - h * SUBTITLE_BOTTOM_RATIO
  lines.forEach((line, i) => {
    ctx.fillText(
      line,
      w / 2,
      bottom - (lines.length - 1 - i) * lineHeight,
      w * SUBTITLE_MAX_WIDTH_RATIO,
    )
  })
  ctx.restore()
}
