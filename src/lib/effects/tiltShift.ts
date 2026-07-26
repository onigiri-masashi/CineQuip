/**
 * チルトシフト（ミニチュア風）加工。
 * 縮小⇄拡大によるぼかし画像を全面に重ね、フォーカス帯だけ
 * グラデーションマスク付きでシャープな元画像を戻す。
 * ぼかし半径は画像幅比で持ち、プレビューと書き出しで見た目を揃える。
 */
export interface TiltShiftParams {
  /** フォーカス帯の中心（高さに対する 0〜1） */
  center: number
  /** フォーカス帯の半分の高さ（高さに対する比率） */
  range: number
  /** フォーカス帯からぼけへの移行幅（高さに対する比率） */
  feather: number
  /** ぼかしの強さ（画像幅に対する比率、0.008〜0.016 目安） */
  blur: number
}

export function applyTiltShift(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: TiltShiftParams,
) {
  const sharp = snapshot(ctx, w, h)

  // 縮小 → 拡大の 2 段階でガウシアン風のぼかしを近似する
  const factor = Math.max(2, Math.min(24, Math.round(w * params.blur)))
  const smallW = Math.max(1, Math.round(w / factor))
  const smallH = Math.max(1, Math.round(h / factor))
  const small = createCanvas(smallW, smallH)
  const smallCtx = small.getContext('2d')
  if (!smallCtx) return
  smallCtx.imageSmoothingEnabled = true
  smallCtx.imageSmoothingQuality = 'high'
  smallCtx.drawImage(sharp, 0, 0, smallW, smallH)

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(small, 0, 0, smallW, smallH, 0, 0, w, h)
  ctx.restore()

  // フォーカス帯のシャープな元画像をグラデーションマスクで戻す
  const masked = createCanvas(w, h)
  const maskedCtx = masked.getContext('2d')
  if (!maskedCtx) return
  maskedCtx.drawImage(sharp, 0, 0)
  maskedCtx.globalCompositeOperation = 'destination-in'
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const top = clamp01(params.center - params.range - params.feather)
  const bandTop = clamp01(params.center - params.range)
  const bandBottom = clamp01(params.center + params.range)
  const bottom = clamp01(params.center + params.range + params.feather)
  const gradient = maskedCtx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(top, 'rgba(0,0,0,0)')
  gradient.addColorStop(bandTop, 'rgba(0,0,0,1)')
  gradient.addColorStop(bandBottom, 'rgba(0,0,0,1)')
  gradient.addColorStop(bottom, 'rgba(0,0,0,0)')
  maskedCtx.fillStyle = gradient
  maskedCtx.fillRect(0, 0, w, h)

  ctx.drawImage(masked, 0, 0)
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
