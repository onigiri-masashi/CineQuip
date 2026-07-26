import { downloadBlob } from '@/lib/export'

/** X へのシェア時に付与するハッシュタグ（# は含めない） */
const SHARE_HASHTAG = 'CineQuip'

/**
 * シェア処理の結果。
 * - shared: 共有シート経由で共有を完了した
 * - canceled: ユーザーが共有シートをキャンセルした
 * - intent: 画像を保存して X の投稿画面を開いた（画像添付はユーザー操作）
 */
export type ShareResult = 'shared' | 'canceled' | 'intent'

/**
 * 生成画像を X へシェアする。
 * Web Share API で画像ファイル付き共有ができる環境（主にモバイル）では
 * 共有シートを開き、使えない環境では画像をダウンロードした上で
 * ハッシュタグ付きの X 投稿画面を開くフォールバックに切り替える。
 */
export async function shareToX(
  blob: Blob,
  fileName: string,
): Promise<ShareResult> {
  const file = new File([blob], fileName, { type: 'image/png' })
  const shareData: ShareData = { files: [file], text: `#${SHARE_HASHTAG}` }

  if (typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'canceled'
      }
      // 共有シートが開けなかった場合は intent フォールバックへ進む
    }
  }

  downloadBlob(blob, fileName)
  openPostIntent()
  return 'intent'
}

/** ハッシュタグ付きで X の投稿作成画面を新しいタブで開く */
function openPostIntent() {
  const url = new URL('https://x.com/intent/post')
  url.searchParams.set('hashtags', SHARE_HASHTAG)
  window.open(url.toString(), '_blank', 'noopener,noreferrer')
}
