/** 加工に適さない小さな画像を弾くための最小サイズ（短辺, px） */
export const MIN_SHORT_SIDE = 360

export interface LoadedImage {
  /** URL.createObjectURL で生成した画像 URL。破棄時は revoke すること */
  url: string
  width: number
  height: number
  fileName: string
}

export type ImageLoadError = 'not-image' | 'too-small' | 'load-failed'

export const IMAGE_LOAD_ERROR_MESSAGES: Record<ImageLoadError, string> = {
  'not-image': '画像ファイルを選択してください。',
  'too-small': `画像が小さすぎます。短辺 ${MIN_SHORT_SIDE}px 以上の画像を使用してください。`,
  'load-failed': '画像の読み込みに失敗しました。別のファイルをお試しください。',
}

export type ImageLoadResult =
  | { ok: true; image: LoadedImage }
  | { ok: false; error: ImageLoadError }

/** ファイルを検証しつつ読み込み、プレビュー用の LoadedImage を返す */
export async function loadImageFile(file: File): Promise<ImageLoadResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'not-image' }
  }

  const url = URL.createObjectURL(file)
  try {
    const { width, height } = await measureImage(url)
    if (Math.min(width, height) < MIN_SHORT_SIDE) {
      URL.revokeObjectURL(url)
      return { ok: false, error: 'too-small' }
    }
    return { ok: true, image: { url, width, height, fileName: file.name } }
  } catch {
    URL.revokeObjectURL(url)
    return { ok: false, error: 'load-failed' }
  }
}

export function releaseImage(image: LoadedImage) {
  URL.revokeObjectURL(image.url)
}

function measureImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}
