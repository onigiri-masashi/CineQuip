import { motion } from 'motion/react'

import { cn } from '@/lib/utils'
import { FILTERS } from '@/lib/filters'
import type { LoadedImage } from '@/lib/image'

interface FilterSelectorProps {
  image: LoadedImage
  selectedId: string
  onSelect: (id: string) => void
}

/** フィルターのサムネイル一覧。選択するとプレビューへ即時反映される */
export function FilterSelector({
  image,
  selectedId,
  onSelect,
}: FilterSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="フィルターを選択"
      className="flex gap-3 overflow-x-auto pb-2"
    >
      {FILTERS.map((filter) => {
        const selected = filter.id === selectedId
        return (
          <motion.button
            key={filter.id}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.95 }}
            className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5"
            onClick={() => onSelect(filter.id)}
          >
            <span
              className={cn(
                'relative block size-16 overflow-hidden rounded-lg border-2 border-transparent transition-all sm:size-20',
                selected && 'border-primary ring-2 ring-primary/40',
              )}
            >
              <img
                src={image.url}
                alt=""
                aria-hidden="true"
                className="size-full object-cover"
                style={{ filter: filter.cssFilter || undefined }}
              />
            </span>
            <span
              className={cn(
                'text-[11px]',
                selected
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {filter.name}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
