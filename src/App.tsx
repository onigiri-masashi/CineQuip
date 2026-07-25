import { Clapperboard } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

function App() {
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
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center text-muted-foreground">
            ここに画像入力エリアが入ります（実装予定）
          </CardContent>
        </Card>
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
