/** X へのシェア時に付与するハッシュタグ（# は含めない） */
const SHARE_HASHTAG = 'CineQuip'

/**
 * X の投稿作成画面 URL を組み立てる。
 * 本文には「空行 + ハッシュタグ + サイト URL」を仕込み、
 * 先頭の空行にユーザーがコメントを書き足せるようにする。
 */
export function buildPostIntentUrl(): string {
  const text = `\n#${SHARE_HASHTAG}\n${window.location.origin}`
  const url = new URL('https://x.com/intent/post')
  url.searchParams.set('text', text)
  return url.toString()
}

/**
 * 生成画像をクリップボードにコピーする。
 * コピーに対応していない環境では何もせず false を返す
 * （呼び出し側でダウンロードにフォールバックする）。
 *
 * Safari はユーザー操作直後にしかクリップボード書き込みを許可しないため、
 * 画像生成の完了を待たず Blob の Promise をそのまま ClipboardItem に渡し、
 * クリックハンドラから同期的に呼び出すこと。
 */
export async function copyImageToClipboard(
  blob: Promise<Blob>,
): Promise<boolean> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    return false
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  return true
}
