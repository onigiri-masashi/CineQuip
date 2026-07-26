import { contrast, multiply, saturate } from '@/lib/effects/colorMatrix'
import type { GlitchParams } from '@/lib/effects/glitch'
import type { TiltShiftParams } from '@/lib/effects/tiltShift'
import type { CinemaFilter } from '@/lib/filters'

/**
 * 手動調整の値。選択中のテンプレートを基準（デフォルト値）として、
 * スライダーで上書き・追加適用する。
 */
export interface Adjustments {
  /** 露光の追加補正（EV、-1〜+1） */
  exposure: number
  /** ハイライトの追加補正（-1〜+1） */
  highlights: number
  /** 彩度の追加適用（1 で変更なし、0〜2） */
  saturation: number
  /** コントラストの追加適用（1 で変更なし、0.5〜1.5） */
  contrast: number
  /** ビネットの強さ（絶対値で上書き、0〜1） */
  vignette: number
  /** グレインの強さ（絶対値で上書き、0〜0.6） */
  grain: number
  /** ポスタライゼーションの階調数（0〜1 で無効、2〜10） */
  posterize: number
  /** グリッチ強度（テンプレート比の倍率、0 で無効、0〜2） */
  glitch: number
  /** チルトシフトのぼかし強さ（絶対値、0 で無効、0〜0.02） */
  tiltShiftBlur: number
}

/** テンプレートにグリッチがない場合にスライダーで使う基本形 */
const BASE_GLITCH: GlitchParams = {
  shift: 0.003,
  slices: 3,
  scanline: 0.1,
  seed: 11,
}

/** テンプレートにチルトシフトがない場合にスライダーで使う基本形 */
const BASE_TILT_SHIFT: TiltShiftParams = {
  center: 0.55,
  range: 0.16,
  feather: 0.22,
  blur: 0.012,
}

/** テンプレートを基準としたスライダーの初期値 */
export function defaultAdjustments(filter: CinemaFilter): Adjustments {
  return {
    exposure: 0,
    highlights: 0,
    saturation: 1,
    contrast: 1,
    vignette: filter.vignette,
    grain: filter.grain,
    posterize: filter.tone?.posterize ?? 0,
    glitch: filter.glitch ? 1 : 0,
    tiltShiftBlur: filter.tiltShift?.blur ?? 0,
  }
}

/** 調整値をテンプレートに適用した実効フィルターを返す */
export function applyAdjustments(
  filter: CinemaFilter,
  adj: Adjustments,
): CinemaFilter {
  let matrix = filter.matrix
  if (adj.saturation !== 1) matrix = multiply(saturate(adj.saturation), matrix)
  if (adj.contrast !== 1) matrix = multiply(contrast(adj.contrast), matrix)

  const tone = {
    exposure: (filter.tone?.exposure ?? 0) + adj.exposure,
    highlights: (filter.tone?.highlights ?? 0) + adj.highlights,
    posterize: adj.posterize >= 2 ? Math.floor(adj.posterize) : 0,
  }

  const baseGlitch = filter.glitch ?? BASE_GLITCH
  const glitch =
    adj.glitch > 0
      ? {
          ...baseGlitch,
          shift: baseGlitch.shift * adj.glitch,
          slices: Math.round(baseGlitch.slices * adj.glitch),
          scanline: Math.min(1, baseGlitch.scanline * adj.glitch),
        }
      : undefined

  const baseTiltShift = filter.tiltShift ?? BASE_TILT_SHIFT
  const tiltShift =
    adj.tiltShiftBlur > 0
      ? { ...baseTiltShift, blur: adj.tiltShiftBlur }
      : undefined

  return {
    ...filter,
    matrix,
    tone,
    glitch,
    tiltShift,
    vignette: adj.vignette,
    grain: adj.grain,
  }
}
