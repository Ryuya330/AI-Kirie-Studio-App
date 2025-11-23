# 🎨 Ryuya AI Chat

AIを活用した画像生成Webアプリケーション。テキストプロンプトや画像から美しいアート作品を生成できます。

![Version](https://img.shields.io/badge/version-7.0.0-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ 特徴

- 🤖 **高性能AI** - Gemini 2.5 Flash & Gemini 2.5 Flash Image
- 🎨 **多様なスタイル** - アニメ、リアル、切り絵、風景など
- 📸 **画像アップロード** - 画像を元にした生成や会話が可能
- 🌐 **多言語対応** - 日本語/英語/中国語/韓国語
- 📱 **PWA対応** - スマホにインストール可能
- ⚡ **高速動作** - Vite + Netlify Functions

## 🚀 技術スタック

### フロントエンド
- **Vite**
- **Vanilla JavaScript** (ES Modules)
- **PWA** (Service Worker + Manifest)

### バックエンド
- **Node.js**
- **Netlify Functions**
- **Google Gemini API**

## 📦 インストール

```bash
# リポジトリをクローン
git clone https://github.com/Ryuya330/Ryuya-AI-Chat.git
cd Ryuya-AI-Chat

# 依存関係をインストール
npm install
```

## 🛠️ ローカル開発

```bash
# 開発サーバー起動
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

## 🔧 環境変数

`.env` ファイルまたはNetlifyの環境変数設定で以下を設定してください:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

## 📂 プロジェクト構造

```
Ryuya-AI-Chat/
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

## 📄 ライセンス

MIT License - 自由に使用・改変・配布可能

## 👨‍💻 開発者

**Ryuya330**
- GitHub: [@Ryuya330](https://github.com/Ryuya330)

## 🙏 謝辞

- [Google Gemini](https://deepmind.google/technologies/gemini/) - AIモデル
- [Netlify](https://www.netlify.com/) - ホスティング
- [Vite](https://vitejs.dev/) - ビルドツール

---

**Made with ❤️ by Ryuya**
