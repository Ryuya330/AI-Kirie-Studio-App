# Netlifyデプロイ手順

## 🚀 デプロイ方法

### 1. Netlify CLIでデプロイ (推奨)

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# Netlifyにログイン
netlify login

# 初回デプロイ (サイト作成)
netlify deploy

# 本番デプロイ
netlify deploy --prod
```

### 2. GitHub連携でデプロイ

1. GitHubにプッシュ
```bash
git add .
git commit -m "Fix Netlify deployment"
git push origin main
```

2. [Netlify](https://app.netlify.com)にログイン

3. "New site from Git" → リポジトリ選択

4. ビルド設定:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

## ✅ デプロイ後の確認

### 動作確認
- [ ] トップページが表示される
- [ ] テキスト生成が動作する
- [ ] 画像変換が動作する
- [ ] 履歴が保存される
- [ ] ダウンロードができる
- [ ] 多言語切り替えが動作する

### PWA確認
- [ ] スマホでホーム画面に追加できる
- [ ] オフラインで基本機能が動作する
- [ ] Service Workerが登録される

## 🔧 トラブルシューティング

### Functions が動作しない場合

1. Netlify管理画面 → Functions タブを確認
2. ログを確認
3. 環境変数を確認（必要に応じて）

### 画像が表示されない場合

- Base64形式で返されるため、ブラウザの開発者ツールで確認
- Network タブで `/api/generate` のレスポンスを確認

### CORS エラーが出る場合

- Netlifyでは自動的にCORSが設定されます
- カスタムドメインの場合、設定を確認

## 📊 パフォーマンス最適化

Netlifyは自動的に以下を最適化します:
- CDN配信
- 画像最適化
- HTTPSの自動設定
- Gzip圧縮
- キャッシュ最適化

## 🌐 カスタムドメイン設定

1. Netlify管理画面 → Domain settings
2. "Add custom domain" をクリック
3. ドメインを入力して設定

## 📱 モバイル動作確認

1. デプロイ後のURLをスマホで開く
2. ブラウザメニュー → "ホーム画面に追加"
3. アプリアイコンから起動
4. 全機能をテスト

## 💡 ヒント

- **ビルド時間**: 通常30-60秒
- **Functions起動**: 初回は少し遅い（コールドスタート）
- **画像生成**: Pollinations AIに依存（無料）
- **容量制限**: Netlify無料プランは月100GBまで
