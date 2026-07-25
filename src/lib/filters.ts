/**
 * 映画調フィルターの定義。
 * プレビューは CSS の filter / オーバーレイで、保存時は Canvas 2D で
 * 同じパラメータを適用することで見た目を一致させる。
 */
export interface CinemaFilter {
  id: string
  /** UI に表示する日本語名 */
  name: string
  /** CSS / ctx.filter にそのまま渡すフィルター文字列。空文字は無加工 */
  cssFilter: string
  /** ビネット（四隅の暗がり）の強さ 0〜1 */
  vignette: number
  /** フィルムグレイン（粒状ノイズ）の不透明度 0〜1 */
  grain: number
}

export const FILTERS: CinemaFilter[] = [
  {
    id: 'normal',
    name: 'ノーマル',
    cssFilter: '',
    vignette: 0,
    grain: 0,
  },
  {
    id: '8mm',
    name: '8mmフィルム',
    cssFilter:
      'sepia(0.45) contrast(1.15) brightness(0.95) saturate(0.85) hue-rotate(-8deg)',
    vignette: 0.5,
    grain: 0.35,
  },
  {
    id: 'noir',
    name: 'ノワール',
    cssFilter: 'grayscale(1) contrast(1.35) brightness(0.9)',
    vignette: 0.55,
    grain: 0.2,
  },
  {
    id: 'sci-fi',
    name: 'SF',
    cssFilter:
      'sepia(0.3) hue-rotate(170deg) saturate(1.4) contrast(1.2) brightness(0.95)',
    vignette: 0.35,
    grain: 0.1,
  },
  {
    id: 'war',
    name: '戦争映画',
    cssFilter:
      'sepia(0.4) hue-rotate(45deg) saturate(0.6) contrast(1.15) brightness(0.9)',
    vignette: 0.45,
    grain: 0.3,
  },
  {
    id: 'mini-theater',
    name: 'ミニシアター',
    cssFilter: 'sepia(0.18) brightness(1.06) contrast(0.88) saturate(0.85)',
    vignette: 0.15,
    grain: 0.12,
  },
  {
    id: 'western',
    name: 'ウェスタン',
    cssFilter:
      'sepia(0.5) saturate(1.3) contrast(1.1) hue-rotate(-12deg) brightness(1.02)',
    vignette: 0.4,
    grain: 0.25,
  },
  {
    id: 'horror',
    name: 'ホラー',
    cssFilter:
      'sepia(0.3) hue-rotate(65deg) saturate(0.75) brightness(0.8) contrast(1.25)',
    vignette: 0.7,
    grain: 0.3,
  },
  {
    id: 'technicolor',
    name: 'テクニカラー',
    cssFilter: 'saturate(1.65) contrast(1.2) brightness(1.02)',
    vignette: 0.2,
    grain: 0.15,
  },
]

export const DEFAULT_FILTER = FILTERS[0]

export function getFilter(id: string): CinemaFilter {
  return FILTERS.find((f) => f.id === id) ?? DEFAULT_FILTER
}

/** フィルムグレイン用の SVG ノイズ（データ URI）。CSS 背景としてタイル表示する */
export const GRAIN_TEXTURE_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.9 0"/></filter><rect width="128" height="128" filter="url(%23n)"/></svg>`,
)}`

/** ビネットの CSS 背景（強さに応じた放射状グラデーション） */
export function vignetteBackground(strength: number): string {
  return `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${strength}) 100%)`
}
