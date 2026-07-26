/** 字幕の文字サイズ（画像幅に対する比率）。プレビューと保存で共有する */
export const SUBTITLE_FONT_RATIO = 0.042
/** 字幕の最大描画幅（画像幅に対する比率） */
export const SUBTITLE_MAX_WIDTH_RATIO = 0.96
/** 字幕の字間（em）。プレビューの letter-spacing と揃える */
export const SUBTITLE_LETTER_SPACING_EM = 0.08

/** 全角を 1em、半角相当を 0.5em として字幕の描画幅を見積もる（字間込み） */
function estimateWidthEm(text: string): number {
  let em = 0
  for (const ch of text) {
    em += /[ -ÿ]/.test(ch) ? 0.5 : 1
  }
  return em + text.length * SUBTITLE_LETTER_SPACING_EM
}

/**
 * 字幕が最大描画幅に収まる文字サイズを返す。
 * 長い字幕は基準サイズから縮小し、プレビューと保存画像の見た目を揃える。
 */
export function fitSubtitleFontSize(width: number, subtitle: string): number {
  const base = width * SUBTITLE_FONT_RATIO
  if (!subtitle) return base
  const fit = (width * SUBTITLE_MAX_WIDTH_RATIO) / estimateWidthEm(subtitle)
  return Math.min(base, fit)
}
