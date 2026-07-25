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

字幕の候補は `src/data/subtitles.json` で管理します（字幕機能の実装後に追加されます）。配列に文字列を追加・削除するだけで反映されます。

## ライセンス

[MIT](./LICENSE)
