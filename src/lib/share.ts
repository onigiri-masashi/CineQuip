import { downloadBlob } from '@/lib/export'

/** X へのシェア時に付与するハッシュタグ（# は含めない） */
const SHARE_HASHTAG = 'CineQuip'

/** ハッシュタグ付きの X 投稿作成画面 URL（フォールバック導線用） */
export const POST_INTENT_URL = `https://x.com/intent/post?hashtags=${SHARE_HASHTAG}`

/**
 * シェア処理の結果。
 * - shared: 共有シート経由で共有を完了した
 * - canceled: ユーザーが共有シートをキャンセルした
 * - fallback: 画像を保存した（X の投稿画面への誘導は呼び出し側が行う）
 */
export type ShareResult = 'shared' | 'canceled' | 'fallback'

/**
 * 生成画像を X へシェアする。
 * Web Share API で画像ファイル付き共有ができる環境（主にモバイル）では
 * 共有シートを開く。使えない環境では画像をダウンロードし 'fallback' を
 * 返すので、呼び出し側で POST_INTENT_URL へのリンクを提示する。
 * 画像生成の非同期処理を挟むとユーザー操作コンテキストが失われ
 * window.open はポップアップブロックされるため、ここでは開かない。
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
      // 共有シートが開けなかった場合はフォールバックへ進む
    }
  }

  downloadBlob(blob, fileName)
  return 'fallback'
}
