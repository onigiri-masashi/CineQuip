import { useState } from 'react'
import { Clapperboard } from 'lucide-react'

import { FilterSelector } from '@/components/FilterSelector'
import { ImageDropzone } from '@/components/ImageDropzone'
import { Preview } from '@/components/Preview'
import { DEFAULT_FILTER, getFilter } from '@/lib/filters'
import { releaseImage, type LoadedImage } from '@/lib/image'
import { pickRandomSubtitle } from '@/lib/subtitles'

function App() {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [filterId, setFilterId] = useState(DEFAULT_FILTER.id)
  const [subtitle, setSubtitle] = useState('')

  const handleSelect = (next: LoadedImage) => {
    if (image) releaseImage(image)
    setImage(next)
    // 画像を入れ替えたらフィルターを初期化し、字幕を自動で抽選する
    setFilterId(DEFAULT_FILTER.id)
    setSubtitle(pickRandomSubtitle())
  }

  const handleClear = () => {
    if (image) releaseImage(image)
    setImage(null)
    setFilterId(DEFAULT_FILTER.id)
    setSubtitle('')
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Clapperboard className="size-7" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold tracking-wide">CineQuip</h1>
            <p className="text-xs text-muted-foreground">
              あなたの写真が、映画のワンシーンになる。
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {image ? (
          <div className="flex flex-col gap-6">
            <Preview
              image={image}
              filter={getFilter(filterId)}
              subtitle={subtitle}
              onShuffleSubtitle={() => setSubtitle(pickRandomSubtitle(subtitle))}
              onClear={handleClear}
            />
            <FilterSelector
              image={image}
              selectedId={filterId}
              onSelect={setFilterId}
            />
          </div>
        ) : (
          <ImageDropzone onSelect={handleSelect} />
        )}
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-5xl px-4 py-3 text-center text-xs text-muted-foreground">
          画像はサーバーに送信されません。すべての加工はブラウザ内で行われます。
        </p>
      </footer>
    </div>
  )
}

export default App
