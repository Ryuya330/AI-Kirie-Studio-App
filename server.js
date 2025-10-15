// 1. 必要なモジュールをインポート
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); // .envファイルから環境変数を読み込む

// 2. Expressアプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 3000; // サーバーがリッスンするポート

// 3. ミドルウェアの設定
app.use(cors()); // CORSを有効にし、フロントエンドからのリクエストを許可
app.use(express.json({ limit: '10mb' })); // リクエストボディのJSONをパースする（画像データのために上限を増やす）

const API_KEY = process.env.GOOGLE_API_KEY;

/**
 * エラーハンドリング用の共通関数
 * @param {Response} res - Expressのレスポンスオブジェクト
 * @param {Error} error - 発生したエラー
 * @param {string} context - エラーが発生したコンテキスト（デバッグ用）
 */
function handleError(res, error, context) {
    console.error(`[${context}] Error:`, error);
    res.status(500).json({ message: `Error in ${context}: ${error.message}` });
}

// 4. APIエンドポイントの定義

// Text-to-Image (Imagen) 用のエンドポイント
app.post('/api/generate-text', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;
    const payload = { instances: [{ prompt }], parameters: { sampleCount: 1 } };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!apiResponse.ok) throw new Error(`API request failed with status ${apiResponse.status}`);
        
        const result = await apiResponse.json();
        res.json(result);
    } catch (error) {
        handleError(res, error, 'Text-to-Image Generation');
    }
});

// Image-to-Image (Gemini) 用のエンドポイント
app.post('/api/generate-image', async (req, res) => {
    const { prompt, base64ImageData, mimeType } = req.body;
    if (!prompt || !base64ImageData || !mimeType) {
        return res.status(400).json({ message: 'Prompt, base64ImageData, and mimeType are required' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64ImageData } }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
    };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!apiResponse.ok) throw new Error(`API request failed with status ${apiResponse.status}`);

        const result = await apiResponse.json();
        res.json(result);
    } catch (error) {
        handleError(res, error, 'Image-to-Image Generation');
    }
});

// 5. サーバーの起動
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});