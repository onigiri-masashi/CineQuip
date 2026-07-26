import { mulberry32 } from '@/lib/effects/prng'

/**
 * グリッチ加工。RGB チャンネルの横ずらし、水平スライスの変位、走査線で構成する。
 * 各量は画像サイズに対する比率で持ち、プレビュー（縮小）と書き出し（原寸）で
 * 見た目が一致するようにする。
 */
export interface GlitchParams {
  /** RGB チャンネルのずらし幅（画像幅に対する比率、0.002〜0.006 目安） */
  shift: number
  /** 変位させる水平スライスの本数 */
  slices: number
  /** 走査線の濃さ 0〜1（0 で無効） */
  scanline: number
  /** スライス位置を決める乱数シード（プレビューと書き出しの一致用） */
  seed: number
}

export function applyGlitch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: GlitchParams,
) {
  const dx = Math.max(1, Math.round(w * params.shift))

  // RGB チャンネル分離: 純色との multiply 合成で各チャンネルだけを残し、
  // 加算合成（lighter）でずらして重ね直す
  const base = snapshot(ctx, w, h)
  const channel = (color: string) => {
    const c = createCanvas(w, h)
    const cctx = c.getContext('2d')
    if (!cctx) return null
    cctx.drawImage(base, 0, 0)
    cctx.globalCompositeOperation = 'multiply'
    cctx.fillStyle = color
    cctx.fillRect(0, 0, w, h)
    return c
  }
  const r = channel('#ff0000')
  const g = channel('#00ff00')
  const b = channel('#0000ff')
  if (r && g && b) {
    ctx.save()
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(r, -dx, 0)
    ctx.drawImage(g, 0, 0)
    ctx.drawImage(b, dx, 0)
    ctx.restore()
  }

  // 水平スライスの変位
  if (params.slices > 0) {
    const rand = mulberry32(params.seed)
    const shifted = snapshot(ctx, w, h)
    for (let i = 0; i < params.slices; i++) {
      const y = Math.floor(rand() * h)
      const sliceH = Math.max(1, Math.floor((0.01 + rand() * 0.04) * h))
      const offset = Math.round((rand() * 2 - 1) * w * 0.03)
      ctx.drawImage(shifted, 0, y, w, sliceH, offset, y, w, sliceH)
    }
  }

  // 走査線
  if (params.scanline > 0) {
    const period = Math.max(2, h / 135)
    const lineH = Math.max(1, Math.floor(period / 2))
    ctx.save()
    ctx.globalAlpha = params.scanline
    ctx.fillStyle = '#000'
    for (let y = 0; y < h; y += period * 2) {
      ctx.fillRect(0, Math.round(y), w, lineH)
    }
    ctx.restore()
  }
}

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function snapshot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): HTMLCanvasElement {
  const c = createCanvas(w, h)
  c.getContext('2d')?.drawImage(ctx.canvas, 0, 0)
  return c
}
