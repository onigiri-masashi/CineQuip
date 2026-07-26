/** 字幕の文字サイズ（画像幅に対する比率）。プレビューと保存で共有する */
export const SUBTITLE_FONT_RATIO = 0.042
/** 字幕の最大描画幅（画像幅に対する比率） */
export const SUBTITLE_MAX_WIDTH_RATIO = 0.96
/** 字幕の字間（em）。プレビューの letter-spacing と揃える */
export const SUBTITLE_LETTER_SPACING_EM = 0.08
/** 字幕の行送り（フォントサイズに対する倍率）。プレビューと保存で共有する */
export const SUBTITLE_LINE_HEIGHT = 1.45
/** 1 行に収める縮小率がこの値を下回るなら 2 行に折り返す */
const WRAP_SHRINK_THRESHOLD = 0.8
/** 2 行分割の位置候補になる区切り文字（この直後で折り返す） */
const BREAK_CHARS = /[。！？…、,.!? ]/

/** 字幕のレイアウト結果。lines は 1〜2 行 */
export interface SubtitleLayout {
  lines: string[]
  fontSize: number
}

/** 全角を 1em、半角相当を 0.5em として字幕の描画幅を見積もる（字間込み） */
function estimateWidthEm(text: string): number {
  let em = 0
  for (const ch of text) {
    em += /[ -ÿ]/.test(ch) ? 0.5 : 1
  }
  return em + text.length * SUBTITLE_LETTER_SPACING_EM
}

/**
 * 字幕の行分割と文字サイズを決める。
 * 長い字幕はまず縮小で 1 行に収め、縮みすぎる場合は句読点を優先した
 * 位置で 2 行に折り返して文字サイズを保つ。プレビューと保存で共有する。
 */
export function layoutSubtitle(width: number, subtitle: string): SubtitleLayout {
  const base = width * SUBTITLE_FONT_RATIO
  if (!subtitle) return { lines: [], fontSize: base }

  const maxWidth = width * SUBTITLE_MAX_WIDTH_RATIO
  const singleFit = maxWidth / estimateWidthEm(subtitle)
  if (singleFit >= base * WRAP_SHRINK_THRESHOLD) {
    return { lines: [subtitle], fontSize: Math.min(base, singleFit) }
  }

  const lines = splitBalanced(subtitle)
  const widest = Math.max(...lines.map(estimateWidthEm))
  return { lines, fontSize: Math.min(base, maxWidth / widest) }
}

/** 区切り文字の直後を優先しつつ、2 行の幅が最も釣り合う位置で分割する */
function splitBalanced(text: string): string[] {
  const chars = [...text]
  const candidates: number[] = []
  for (let i = 0; i < chars.length - 1; i++) {
    if (BREAK_CHARS.test(chars[i]) && !BREAK_CHARS.test(chars[i + 1])) {
      candidates.push(i + 1)
    }
  }
  if (candidates.length === 0) {
    candidates.push(Math.ceil(chars.length / 2))
  }

  let best: string[] = []
  let bestWidth = Infinity
  for (const at of candidates) {
    const head = chars.slice(0, at).join('').trimEnd()
    const tail = chars.slice(at).join('').trimStart()
    const width = Math.max(estimateWidthEm(head), estimateWidthEm(tail))
    if (width < bestWidth) {
      bestWidth = width
      best = [head, tail]
    }
  }
  return best
}
