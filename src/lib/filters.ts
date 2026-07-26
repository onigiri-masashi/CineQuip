import {
  buildMatrix,
  type ColorMatrix,
  type ColorOp,
} from '@/lib/effects/colorMatrix'
import type { GlitchParams } from '@/lib/effects/glitch'
import type { TiltShiftParams } from '@/lib/effects/tiltShift'
import type { ToneParams } from '@/lib/effects/tone'

/** 加色（カラーレイヤーの合成）の定義 */
export interface TintParams {
  color: string
  blend: GlobalCompositeOperation
  opacity: number
}

/**
 * 映画調フィルターの定義。
 * 色調はカラーマトリクス+トーンLUT、質感（グレイン・ビネット・グリッチ等）は
 * canvas 合成で表現し、プレビューと保存の両方が同じパイプラインを通る。
 */
export interface CinemaFilter {
  id: string
  /** UI に表示する日本語名 */
  name: string
  /** 色調操作（先頭から順に適用）。定義順は見た目に影響する */
  ops: readonly ColorOp[]
  /** ops から合成済みのカラーマトリクス */
  matrix: ColorMatrix
  /** ビネット（四隅の暗がり）の強さ 0〜1 */
  vignette: number
  /** フィルムグレイン（粒状ノイズ）の不透明度 0〜1 */
  grain: number
  /** 露光・ハイライト・ポスタライゼーション */
  tone?: ToneParams
  /** 加色レイヤー（配列順に合成） */
  tints?: readonly TintParams[]
  /** グリッチ加工 */
  glitch?: GlitchParams
  /** チルトシフト（ミニチュア風） */
  tiltShift?: TiltShiftParams
}

interface FilterDef extends Omit<CinemaFilter, 'matrix'> {
  id: string
  name: string
  ops: readonly ColorOp[]
  vignette: number
  grain: number
}

function defineFilter(def: FilterDef): CinemaFilter {
  return { ...def, matrix: buildMatrix(def.ops) }
}

export const FILTERS: CinemaFilter[] = [
  defineFilter({
    id: 'normal',
    name: 'ノーマル',
    ops: [],
    vignette: 0,
    grain: 0,
  }),
  defineFilter({
    id: '8mm',
    name: '8mmフィルム',
    ops: [
      { type: 'sepia', value: 0.45 },
      { type: 'contrast', value: 1.15 },
      { type: 'brightness', value: 0.95 },
      { type: 'saturate', value: 0.85 },
      { type: 'hueRotate', degrees: -8 },
    ],
    vignette: 0.5,
    grain: 0.35,
  }),
  defineFilter({
    id: 'noir',
    name: 'ノワール',
    ops: [
      { type: 'grayscale', value: 1 },
      { type: 'contrast', value: 1.35 },
      { type: 'brightness', value: 0.9 },
    ],
    vignette: 0.55,
    grain: 0.2,
  }),
  defineFilter({
    id: 'sci-fi',
    name: 'SF',
    ops: [
      { type: 'sepia', value: 0.3 },
      { type: 'hueRotate', degrees: 170 },
      { type: 'saturate', value: 1.4 },
      { type: 'contrast', value: 1.2 },
      { type: 'brightness', value: 0.95 },
    ],
    vignette: 0.35,
    grain: 0.1,
  }),
  defineFilter({
    id: 'war',
    name: '戦争映画',
    ops: [
      { type: 'sepia', value: 0.4 },
      { type: 'hueRotate', degrees: 45 },
      { type: 'saturate', value: 0.6 },
      { type: 'contrast', value: 1.15 },
      { type: 'brightness', value: 0.9 },
    ],
    vignette: 0.45,
    grain: 0.3,
  }),
  defineFilter({
    id: 'mini-theater',
    name: 'ミニシアター',
    ops: [
      { type: 'sepia', value: 0.18 },
      { type: 'brightness', value: 1.06 },
      { type: 'contrast', value: 0.88 },
      { type: 'saturate', value: 0.85 },
    ],
    vignette: 0.15,
    grain: 0.12,
  }),
  defineFilter({
    id: 'western',
    name: 'ウェスタン',
    ops: [
      { type: 'sepia', value: 0.5 },
      { type: 'saturate', value: 1.3 },
      { type: 'contrast', value: 1.1 },
      { type: 'hueRotate', degrees: -12 },
      { type: 'brightness', value: 1.02 },
    ],
    vignette: 0.4,
    grain: 0.25,
  }),
  defineFilter({
    id: 'horror',
    name: 'ホラー',
    ops: [
      { type: 'sepia', value: 0.3 },
      { type: 'hueRotate', degrees: 65 },
      { type: 'saturate', value: 0.75 },
      { type: 'brightness', value: 0.8 },
      { type: 'contrast', value: 1.25 },
    ],
    vignette: 0.7,
    grain: 0.3,
  }),
  defineFilter({
    id: 'technicolor',
    name: 'テクニカラー',
    ops: [
      { type: 'saturate', value: 1.65 },
      { type: 'contrast', value: 1.2 },
      { type: 'brightness', value: 1.02 },
    ],
    vignette: 0.2,
    grain: 0.15,
  }),
  defineFilter({
    id: 'vhs',
    name: 'VHS',
    ops: [
      { type: 'saturate', value: 0.85 },
      { type: 'contrast', value: 1.08 },
      { type: 'brightness', value: 1.02 },
    ],
    glitch: { shift: 0.004, slices: 4, scanline: 0.14, seed: 11 },
    vignette: 0.3,
    grain: 0.2,
  }),
  defineFilter({
    id: 'cyberpunk',
    name: 'サイバーパンク',
    ops: [
      { type: 'saturate', value: 1.45 },
      { type: 'contrast', value: 1.3 },
      { type: 'hueRotate', degrees: -12 },
      { type: 'brightness', value: 0.95 },
    ],
    tints: [
      { color: '#00d4ff', blend: 'overlay', opacity: 0.2 },
      { color: '#ff2bd6', blend: 'soft-light', opacity: 0.18 },
    ],
    glitch: { shift: 0.0025, slices: 2, scanline: 0.06, seed: 23 },
    vignette: 0.45,
    grain: 0.1,
  }),
  defineFilter({
    id: 'retro-poster',
    name: 'レトロポスター',
    ops: [
      { type: 'saturate', value: 1.75 },
      { type: 'contrast', value: 1.2 },
      { type: 'brightness', value: 1.03 },
    ],
    tone: { posterize: 4 },
    vignette: 0.12,
    grain: 0.08,
  }),
  defineFilter({
    id: 'miniature',
    name: 'ミニチュア',
    ops: [
      { type: 'saturate', value: 1.5 },
      { type: 'contrast', value: 1.12 },
      { type: 'brightness', value: 1.04 },
    ],
    tiltShift: { center: 0.55, range: 0.16, feather: 0.22, blur: 0.012 },
    vignette: 0.12,
    grain: 0,
  }),
  defineFilter({
    id: 'bleach-bypass',
    name: '銀残し',
    ops: [
      { type: 'saturate', value: 0.4 },
      { type: 'contrast', value: 1.35 },
    ],
    tone: { highlights: 0.25 },
    vignette: 0.4,
    grain: 0.18,
  }),
  defineFilter({
    id: 'daydream',
    name: '白昼夢',
    ops: [
      { type: 'saturate', value: 1.15 },
      { type: 'contrast', value: 0.92 },
    ],
    tone: { exposure: 0.55, highlights: 0.2 },
    tints: [{ color: '#ffd9a0', blend: 'soft-light', opacity: 0.3 }],
    vignette: 0,
    grain: 0.06,
  }),
]

export const DEFAULT_FILTER = FILTERS[0]

export function getFilter(id: string): CinemaFilter {
  return FILTERS.find((f) => f.id === id) ?? DEFAULT_FILTER
}
