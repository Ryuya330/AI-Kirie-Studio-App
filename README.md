# 🎨 AI Kirie Studio

AIを活用した切り絵アート生成Webアプリケーション。テキストプロンプトや画像から美しい切り絵スタイルのアート作品を生成できます。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ 特徴

- 🤖 **無料AI生成** - Pollinations AI & Hugging Face を使用
- 🎨 **5つのスタイル** - Classic, Colorful, 3D, Minimal, Silhouette
- 📸 **画像変換** - アップロードした画像を切り絵化
- 🌐 **多言語対応** - 日本語/英語/中国語/韓国語
- 📱 **PWA対応** - スマホにインストール可能
- 💾 **履歴機能** - 最大50件の作品を保存
- ⚡ **高速動作** - Vite + Express.js

## 🚀 技術スタック

### フロントエンド
- **Vite** 5.4.20
- **Tailwind CSS**
- **Vanilla JavaScript** (ES Modules)
- **PWA** (Service Worker + Manifest)

### バックエンド
- **Node.js** + **Express.js** 4.21.0
- **Pollinations AI** (テキスト→画像)
- **Hugging Face Inference API** (画像→画像)

### デプロイ
- **Netlify** (推奨) - 無料ホスティング
- **Netlify Functions** - サーバーレスAPI

## 📦 インストール

```bash
# リポジトリをクローン
git clone https://github.com/Ryuya330/AI-Kirie-Studio-App.git
cd AI-Kirie-Studio-App

# 依存関係をインストール
npm install
```

## 🛠️ ローカル開発

```bash
# バックエンドサーバー起動 (ターミナル1)
npm run server
# → http://localhost:3000

# フロントエンド開発サーバー起動 (ターミナル2)
npm run dev
# → http://localhost:5173
```

## 🌐 デプロイ (Netlify)

### 方法1: Netlify CLI (推奨)

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# Netlifyにログイン
netlify login

# デプロイ
netlify deploy --prod
```

### 方法2: GitHub連携

1. GitHubにプッシュ
2. [Netlify](https://app.netlify.com) にログイン
3. "New site from Git" をクリック
4. リポジトリを選択
5. ビルド設定:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### デプロイ後の確認

✅ PWAとして動作  
✅ スマホのホーム画面に追加可能  
✅ オフラインキャッシュ有効  
✅ 多言語対応  

## 📱 PWA機能

このアプリはPWA(Progressive Web App)として動作します:

- **インストール可能** - ホーム画面に追加
- **オフライン対応** - Service Workerでキャッシュ
- **アプリライク** - スタンドアロンモード
- **高速起動** - 事前キャッシュ

### スマホにインストール

#### iPhone/iPad
1. Safariでアクセス
2. 共有ボタン → "ホーム画面に追加"

#### Android
1. Chromeでアクセス
2. メニュー → "ホーム画面に追加"
3. または自動でインストールプロンプト表示

## 🎨 使い方

### 1. テキストから生成
1. プロンプトを入力 (例: "満月の夜の桜と黒猫")
2. スタイルボタンでスタイル追加 (任意)
3. "アートワークを生成" をクリック
4. AI生成完了 → ダウンロード可能

### 2. 画像から変換
1. "画像をアップロード" をクリック
2. 画像を選択 (PNG/JPG/WEBP)
3. プレビュー確認
4. "切り絵化する" をクリック
5. AI変換完了 → ダウンロード可能

### 3. 履歴から再利用
- 履歴グリッドから過去の作品をクリック
- 再表示 & ダウンロード可能

## 🔧 環境変数

現在、APIキーは不要です(無料AIを使用)。将来的にHugging Face APIキーを設定する場合:

```bash
# .env ファイル作成
HUGGINGFACE_API_KEY=your_api_key_here
```

## 📂 プロジェクト構造

```
AI-Kirie-Studio-App/
├── public/               # 静的ファイル
│   ├── generated/       # AI生成画像保存先
│   ├── manifest.json    # PWAマニフェスト
│   ├── sw.js           # Service Worker
│   ├── icon-192.png    # PWAアイコン
│   └── icon-512.png    # PWAアイコン
├── netlify/
│   └── functions/      # Netlify Functions
│       └── api.js      # サーバーレスAPI
├── index.html          # メインHTML
├── main.js             # フロントエンドJS
├── style.css           # スタイル
├── server.js           # Express.jsサーバー
├── vite.config.js      # Vite設定
├── netlify.toml        # Netlify設定
└── package.json        # 依存関係
```

## 🐛 トラブルシューティング

### ポートが使用中
```bash
# プロセスを停止
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Service Workerが更新されない
1. ブラウザの開発者ツールを開く
2. Application → Service Workers → "Unregister"
3. ページをリロード

### 画像生成が遅い
- Pollinations AIは無料のため、混雑時に遅延する場合があります
- Hugging Face APIキーを設定すると高速化します

## 📄 ライセンス

MIT License - 自由に使用・改変・配布可能

## 👨‍💻 開発者

**Ryuya330**
- GitHub: [@Ryuya330](https://github.com/Ryuya330)

## 🙏 謝辞

- [Pollinations AI](https://pollinations.ai/) - 無料AI画像生成
- [Hugging Face](https://huggingface.co/) - AI/MLモデル
- [Tailwind CSS](https://tailwindcss.com/) - UIフレームワーク
- [Vite](https://vitejs.dev/) - ビルドツール

---

**Made with ❤️ and AI**
