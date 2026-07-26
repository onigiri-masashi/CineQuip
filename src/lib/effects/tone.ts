/**
 * トーンカーブ系の調整（露光・ハイライト・ポスタライゼーション）を
 * 256 エントリの LUT にまとめる。カラーマトリクスと同じピクセル走査で適用される。
 */
export interface ToneParams {
  /** 露光補正（EV 相当、-1〜+1 目安） */
  exposure?: number
  /** ハイライトの持ち上げ(+)/抑え(-)（-1〜+1） */
  highlights?: number
  /** ポスタライゼーションの階調数（2〜32、0/未指定で無効） */
  posterize?: number
}

export function buildToneLUT(tone: ToneParams | undefined): Uint8Array | null {
  const exposure = tone?.exposure ?? 0
  const highlights = tone?.highlights ?? 0
  const posterize = tone?.posterize ?? 0
  if (exposure === 0 && highlights === 0 && posterize === 0) return null

  const lut = new Uint8Array(256)
  const gain = Math.pow(2, exposure)
  for (let i = 0; i < 256; i++) {
    let x = (i / 255) * gain

    if (highlights !== 0) {
      // 明部にだけ効くよう smoothstep で重み付け
      const t = Math.min(1, Math.max(0, (x - 0.45) / 0.55))
      const w = t * t * (3 - 2 * t)
      x += highlights * w * (highlights > 0 ? 1 - x : x - 0.5)
    }

    if (posterize >= 2) {
      const n = Math.min(32, Math.floor(posterize))
      x = Math.round(x * (n - 1)) / (n - 1)
    }

    lut[i] = Math.min(255, Math.max(0, Math.round(x * 255)))
  }
  return lut
}
