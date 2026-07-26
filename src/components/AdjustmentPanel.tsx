import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Slider } from '@/components/ui/slider'
import type { Adjustments } from '@/lib/adjustments'

interface SliderDef {
  key: keyof Adjustments
  label: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

const signed = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}`
const percent = (v: number) => `${Math.round(v * 100)}%`

const SLIDERS: SliderDef[] = [
  { key: 'exposure', label: '露光', min: -1, max: 1, step: 0.05, format: signed },
  { key: 'highlights', label: 'ハイライト', min: -1, max: 1, step: 0.05, format: signed },
  { key: 'saturation', label: '彩度', min: 0, max: 2, step: 0.05, format: percent },
  { key: 'contrast', label: 'コントラスト', min: 0.5, max: 1.5, step: 0.05, format: percent },
  { key: 'vignette', label: 'ビネット', min: 0, max: 1, step: 0.05, format: percent },
  { key: 'grain', label: 'グレイン', min: 0, max: 0.6, step: 0.02, format: percent },
  {
    key: 'posterize',
    label: 'ポスタライズ',
    min: 0,
    max: 10,
    step: 1,
    format: (v) => (v >= 2 ? `${v}階調` : 'オフ'),
  },
  {
    key: 'glitch',
    label: 'グリッチ',
    min: 0,
    max: 2,
    step: 0.1,
    format: (v) => (v > 0 ? `${Math.round(v * 100)}%` : 'オフ'),
  },
  {
    key: 'tiltShiftBlur',
    label: 'チルトシフト',
    min: 0,
    max: 0.02,
    step: 0.001,
    format: (v) => (v > 0 ? `${Math.round((v / 0.02) * 100)}%` : 'オフ'),
  },
]

interface AdjustmentPanelProps {
  adjustments: Adjustments
  onChange: (next: Adjustments) => void
  onReset: () => void
}

/** 選択中テンプレートを基準に各エフェクトを微調整するスライダーパネル */
export function AdjustmentPanel({
  adjustments,
  onChange,
  onReset,
}: AdjustmentPanelProps) {
  return (
    <Collapsible className="rounded-xl border border-border">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        微調整
        <ChevronDown
          className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-x-8 gap-y-4 px-4 pb-2 sm:grid-cols-2">
          {SLIDERS.map(({ key, label, min, max, step, format }) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span>{label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {format(adjustments[key])}
                </span>
              </div>
              <Slider
                aria-label={label}
                value={[adjustments[key]]}
                min={min}
                max={max}
                step={step}
                onValueChange={([value]) =>
                  onChange({ ...adjustments, [key]: value })
                }
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end px-4 pb-4 pt-2">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            リセット
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
