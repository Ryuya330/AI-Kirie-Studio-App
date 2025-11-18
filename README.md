# AI Kirie Studio 🎨

テキストや画像から美しい切り絵風イラストを生成するWebアプリケーションです。

## 機能

- **テキストから生成**: テキストプロンプトから切り絵風イラストを生成 (FLUX.1 Schnell使用)
- **画像から生成**: アップロードした画像を切り絵風に変換 (FLUX.1 Dev使用)
- **スタイル選択**: シンプル、カラフル、ジオラマ風、影絵風の4つのスタイル
- **スペシャル機能**: バナナのコスチューム画像を生成 (Stable Diffusion XL使用)
- **履歴管理**: 生成した画像の履歴を保存・表示
- **ダウンロード**: 生成した画像をダウンロード可能

## 使用AI技術

- **FLUX.1 Schnell**: 高速テキスト→画像生成（2-4秒）
- **FLUX.1 Dev**: 高品質画像→画像変換
- **Stable Diffusion XL**: 切り絵スタイル特化生成

これらのモデルはReplicate APIを通じて利用されます。

## セットアップ

### 1. 依存関係のインストール

```powershell
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、Replicate API トークンを設定してください。

```powershell
Copy-Item .env.example .env
```

`.env` ファイルを編集:
```
REPLICATE_API_TOKEN=あなたのAPIトークン
```

Replicate API トークンは以下で取得できます:
1. [Replicate](https://replicate.com) にアクセス
2. アカウントを作成（GitHubでサインイン可能）
3. [API Tokens ページ](https://replicate.com/account/api-tokens) でトークンを生成

### 3. 開発サーバーの起動

**ターミナル1: バックエンドサーバー**
```powershell
npm run server
```

**ターミナル2: フロントエンドサーバー**
```powershell
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアプリケーションにアクセスできます。

## 本番環境へのデプロイ

### Netlify へのデプロイ

1. Netlify にログイン
2. このリポジトリを接続
3. 環境変数 `REPLICATE_API_TOKEN` を設定
4. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

## 技術スタック

- **フロントエンド**: Vanilla JS, Tailwind CSS
- **バックエンド**: Express.js, Node.js
- **AI API**: Replicate (FLUX.1, Stable Diffusion XL)
- **ビルドツール**: Vite
- **デプロイ**: Netlify Functions

## 料金について

Replicate APIは従量課金制です:
- **FLUX.1 Schnell**: 約$0.003/画像（高速）
- **FLUX.1 Dev**: 約$0.025/画像（高品質）
- **Stable Diffusion XL**: 約$0.005/画像

詳細は [Replicate Pricing](https://replicate.com/pricing) を確認してください。

## ライセンス

MIT

## 注意事項

- Replicate API の利用には API トークンが必要です
- 生成された画像は `public/generated/` ディレクトリに保存されます
- 初回利用時はモデルの起動に時間がかかる場合があります（コールドスタート）
