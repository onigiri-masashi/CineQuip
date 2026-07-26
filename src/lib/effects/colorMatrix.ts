/**
 * CSS filter の色調関数（sepia / grayscale / saturate / hue-rotate /
 * brightness / contrast）と等価な 4x5 カラーマトリクス演算。
 * W3C Filter Effects Module Level 1 の定義に従う（sRGB 空間）。
 *
 * 行列は行優先の長さ20の配列。各行が R', G', B', A' を表し、
 * 第5列は 0〜1 正規化のオフセット。
 */
export type ColorMatrix = number[]

export const IDENTITY: ColorMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
]

/** b を適用してから a を適用する合成行列（a ∘ b）を返す */
export function multiply(a: ColorMatrix, b: ColorMatrix): ColorMatrix {
  const out = new Array<number>(20)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0
      for (let k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col]
      }
      if (col === 4) sum += a[row * 5 + 4]
      out[row * 5 + col] = sum
    }
  }
  return out
}

function lerpMatrix(from: ColorMatrix, to: ColorMatrix, t: number): ColorMatrix {
  return from.map((v, i) => v + (to[i] - v) * t)
}

export function grayscale(amount: number): ColorMatrix {
  const full: ColorMatrix = [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0, 0, 0, 1, 0,
  ]
  return lerpMatrix(IDENTITY, full, Math.min(1, amount))
}

export function sepia(amount: number): ColorMatrix {
  const full: ColorMatrix = [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0,
  ]
  return lerpMatrix(IDENTITY, full, Math.min(1, amount))
}

export function saturate(s: number): ColorMatrix {
  return [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
    0, 0, 0, 1, 0,
  ]
}

export function hueRotate(degrees: number): ColorMatrix {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0, 0,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.140,
    0.072 - cos * 0.072 - sin * 0.283,
    0, 0,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
    0, 0,
    0, 0, 0, 1, 0,
  ]
}

export function brightness(b: number): ColorMatrix {
  return [
    b, 0, 0, 0, 0,
    0, b, 0, 0, 0,
    0, 0, b, 0, 0,
    0, 0, 0, 1, 0,
  ]
}

export function contrast(c: number): ColorMatrix {
  const off = 0.5 - 0.5 * c
  return [
    c, 0, 0, 0, off,
    0, c, 0, 0, off,
    0, 0, c, 0, off,
    0, 0, 0, 1, 0,
  ]
}

/** 色調操作の宣言的な表現。配列の先頭から順に適用される */
export type ColorOp =
  | { type: 'sepia'; value: number }
  | { type: 'grayscale'; value: number }
  | { type: 'saturate'; value: number }
  | { type: 'contrast'; value: number }
  | { type: 'brightness'; value: number }
  | { type: 'hueRotate'; degrees: number }

export function buildMatrix(ops: readonly ColorOp[]): ColorMatrix {
  let matrix = IDENTITY
  for (const op of ops) {
    const m =
      op.type === 'sepia' ? sepia(op.value)
      : op.type === 'grayscale' ? grayscale(op.value)
      : op.type === 'saturate' ? saturate(op.value)
      : op.type === 'contrast' ? contrast(op.value)
      : op.type === 'brightness' ? brightness(op.value)
      : hueRotate(op.degrees)
    matrix = multiply(m, matrix)
  }
  return matrix
}

export function isIdentity(m: ColorMatrix): boolean {
  return m.every((v, i) => Math.abs(v - IDENTITY[i]) < 1e-9)
}

/**
 * ImageData の各ピクセルへカラーマトリクスとトーン LUT を 1 パスで適用する（破壊的）。
 * LUT はマトリクス適用後の値に対して引かれる。
 */
export function applyColor(
  data: Uint8ClampedArray,
  matrix: ColorMatrix,
  lut?: Uint8Array | null,
) {
  const m = matrix
  const r0 = m[0], r1 = m[1], r2 = m[2], r4 = m[4] * 255
  const g0 = m[5], g1 = m[6], g2 = m[7], g4 = m[9] * 255
  const b0 = m[10], b1 = m[11], b2 = m[12], b4 = m[14] * 255
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    data[i] = r0 * r + r1 * g + r2 * b + r4
    data[i + 1] = g0 * r + g1 * g + g2 * b + g4
    data[i + 2] = b0 * r + b1 * g + b2 * b + b4
    if (lut) {
      data[i] = lut[data[i]]
      data[i + 1] = lut[data[i + 1]]
      data[i + 2] = lut[data[i + 2]]
    }
  }
}
