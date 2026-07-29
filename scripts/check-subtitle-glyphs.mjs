/**
 * 字幕データの全文字が「しねきゃぷしょん」(cinecaption226.ttf) に収録されているかを検査する。
 *
 * このフォントは JIS 第 1 水準（2965 字）を全網羅しているが、第 2 水準は一部
 * （647 字）しか持たない。未収録の文字はフォールバックの明朝体で描画され、
 * 1 つの字幕の中で書体が混ざってしまうため CI で弾く。
 *
 * 実行: npm run check:glyphs
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FONT_PATH = resolve(ROOT, 'public/fonts/cinecaption226.ttf')
const SUBTITLES_PATH = resolve(ROOT, 'src/data/subtitles.json')
const SUBTITLES_RELATIVE = 'src/data/subtitles.json'

/** sfnt のテーブルディレクトリを読み、タグ → オフセットの対応を返す */
function readTableDirectory(buf) {
  const numTables = buf.readUInt16BE(4)
  const tables = new Map()
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16
    tables.set(buf.toString('latin1', record, record + 4), {
      offset: buf.readUInt32BE(record + 8),
      length: buf.readUInt32BE(record + 12),
    })
  }
  return tables
}

/** cmap format 4（BMP の segment mapping）を走査して収録コードポイントを集める */
function collectFormat4(buf, offset, out) {
  const segCountX2 = buf.readUInt16BE(offset + 6)
  const endCodes = offset + 14
  const startCodes = endCodes + segCountX2 + 2 // +2 は reservedPad
  const idDeltas = startCodes + segCountX2
  const idRangeOffsets = idDeltas + segCountX2

  for (let i = 0; i < segCountX2 / 2; i++) {
    const end = buf.readUInt16BE(endCodes + i * 2)
    const start = buf.readUInt16BE(startCodes + i * 2)
    const delta = buf.readInt16BE(idDeltas + i * 2)
    const rangeOffset = buf.readUInt16BE(idRangeOffsets + i * 2)
    if (start > end) continue

    for (let code = start; code <= end && code !== 0xffff; code++) {
      let glyphId
      if (rangeOffset === 0) {
        glyphId = (code + delta) & 0xffff
      } else {
        const at = idRangeOffsets + i * 2 + rangeOffset + (code - start) * 2
        if (at + 2 > buf.length) continue
        glyphId = buf.readUInt16BE(at)
        if (glyphId !== 0) glyphId = (glyphId + delta) & 0xffff
      }
      // グリフ ID 0 は .notdef（豆腐）なので未収録扱い
      if (glyphId !== 0) out.add(code)
    }
  }
}

/** cmap format 12（BMP 外も含む segmented coverage）を走査する */
function collectFormat12(buf, offset, out) {
  const numGroups = buf.readUInt32BE(offset + 12)
  for (let i = 0; i < numGroups; i++) {
    const group = offset + 16 + i * 12
    const start = buf.readUInt32BE(group)
    const end = buf.readUInt32BE(group + 4)
    for (let code = start; code <= end; code++) out.add(code)
  }
}

/** フォントが収録しているコードポイントの集合を返す */
function readCoveredCodePoints(fontPath) {
  const buf = readFileSync(fontPath)
  const cmap = readTableDirectory(buf).get('cmap')
  if (!cmap) throw new Error(`cmap テーブルが見つかりません: ${fontPath}`)

  const covered = new Set()
  const numSubtables = buf.readUInt16BE(cmap.offset + 2)
  for (let i = 0; i < numSubtables; i++) {
    const record = cmap.offset + 4 + i * 8
    const platformId = buf.readUInt16BE(record)
    const encodingId = buf.readUInt16BE(record + 2)
    // Unicode 系のサブテーブルのみ見る（platform 1 = Mac Roman などは対象外）
    const isUnicode =
      platformId === 0 || (platformId === 3 && (encodingId === 1 || encodingId === 10))
    if (!isUnicode) continue

    const offset = cmap.offset + buf.readUInt32BE(record + 4)
    const format = buf.readUInt16BE(offset)
    if (format === 4) collectFormat4(buf, offset, covered)
    else if (format === 12) collectFormat12(buf, offset, covered)
  }

  if (covered.size === 0) {
    throw new Error(`Unicode の cmap サブテーブルを解釈できませんでした: ${fontPath}`)
  }
  return covered
}

/** 字幕が subtitles.json の何行目に書かれているかを探す（見つからなければ null） */
function findLineNumber(rawLines, subtitle) {
  const escaped = JSON.stringify(subtitle).slice(1, -1)
  const index = rawLines.findIndex((line) => line.includes(escaped))
  return index === -1 ? null : index + 1
}

const covered = readCoveredCodePoints(FONT_PATH)
const subtitles = JSON.parse(readFileSync(SUBTITLES_PATH, 'utf8'))
const rawLines = readFileSync(SUBTITLES_PATH, 'utf8').split('\n')

const failures = []
for (const subtitle of subtitles) {
  const missing = [...new Set([...subtitle].filter((ch) => !covered.has(ch.codePointAt(0))))]
  if (missing.length > 0) {
    failures.push({ subtitle, missing, line: findLineNumber(rawLines, subtitle) })
  }
}

if (failures.length === 0) {
  console.log(
    `✔ 字幕 ${subtitles.length} 件はすべて「しねきゃぷしょん」収録文字（${covered.size} グリフ）で表示できます`,
  )
  process.exit(0)
}

const onActions = process.env.GITHUB_ACTIONS === 'true'
console.error(
  `✘ 「しねきゃぷしょん」に未収録の文字を含む字幕が ${failures.length} 件あります\n`,
)
for (const { subtitle, missing, line } of failures) {
  const chars = missing
    .map((ch) => `「${ch}」(U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`)
    .join(' ')
  const where = line === null ? SUBTITLES_RELATIVE : `${SUBTITLES_RELATIVE}:${line}`
  console.error(`  ${where}\n    字幕: ${subtitle}\n    未収録: ${chars}\n`)
  if (onActions) {
    // PR の差分ビューに直接注釈を出す
    const annotation = `未収録の文字 ${chars} が含まれています。フォールバックの明朝体で描画され書体が混ざります`
    console.error(
      `::error file=${SUBTITLES_RELATIVE}${line === null ? '' : `,line=${line}`}::${annotation}`,
    )
  }
}
console.error(
  '別の言い回し・表記（ひらがな、または JIS 第 1 水準の漢字）に置き換えてください。',
)
process.exit(1)
