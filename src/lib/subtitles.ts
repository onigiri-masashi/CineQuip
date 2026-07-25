import subtitlesData from '@/data/subtitles.json'

/**
 * 字幕の候補一覧。
 * 追加・削除は src/data/subtitles.json を編集するだけでよい。
 */
export const SUBTITLES: readonly string[] = subtitlesData

/** 字幕をランダムに 1 件選ぶ。current を渡すと同じ字幕の連続を避ける */
export function pickRandomSubtitle(current?: string): string {
  const pool =
    current && SUBTITLES.length > 1
      ? SUBTITLES.filter((s) => s !== current)
      : SUBTITLES
  return pool[Math.floor(Math.random() * pool.length)] ?? ''
}
