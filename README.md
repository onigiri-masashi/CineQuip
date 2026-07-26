# CineQuip

あなたの写真が、映画のワンシーンになる。

アップロードした画像に映画調のフィルターと日本語字幕を重ねて、「映画の一コマ」風の画像をつくるジョークサービスです。

## 特徴

- 画像はサーバーに送信されません。フィルター適用・字幕合成はすべてブラウザ内で完結します
- 8mmフィルム調・SF・戦争映画風・ミニシアター系など複数の映画調フィルター
- 画像下部にランダムな日本語字幕を映画字幕風に表示

## 技術スタック

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [motion](https://motion.dev/)（アニメーション）
- [lucide-react](https://lucide.dev/)（アイコン）
- デプロイ先: Cloudflare（静的アセット配信のみ・サーバーレス）

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run lint     # Lint
npm run build    # 型チェック + プロダクションビルド
```

## 字幕の管理

字幕の候補は `src/data/subtitles.json` で管理します。配列に文字列を追加・削除するだけで反映されます。

字幕の描画には映画字幕風フォント「[しねきゃぷしょん](https://fontfree.me/235)」（chiphead 作）を使用しています。おおむね JIS 第一水準までの収録のため、字幕を追加する際は難しい漢字（第二水準以降）を避けてください。含まれているかどうかは表示して確認できます。

## デプロイ

Cloudflare Workers（Static Assets）に配信します。サーバー処理はないため無料枠の範囲で運用できます。

- main ブランチへの push で GitHub Actions（`.github/workflows/deploy.yml`）が自動デプロイします
- リポジトリシークレットに以下の設定が必要です（未設定の間はデプロイをスキップします）
  - `CLOUDFLARE_API_TOKEN`: 「Cloudflare Workers を編集する」テンプレートで作成した API トークン
  - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare ダッシュボードに表示されるアカウント ID
- 手元からは `npm run deploy` でもデプロイできます（`wrangler login` が必要）

## ライセンス

[MIT](./LICENSE)

同梱フォント「しねきゃぷしょん」（`public/fonts/cinecaption226.ttf`）は chiphead 氏の著作物です（ひらがなデザイン: 雑念の塊 氏）。商用利用・再配布可、改変禁止。詳細は [public/fonts/cinecaption2.26.txt](./public/fonts/cinecaption2.26.txt) を参照してください。
