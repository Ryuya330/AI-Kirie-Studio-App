// 1. 必要なモジュールをインポート
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); // .envファイルから環境変数を読み込む
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime');


// 2. Expressアプリケーションの初期化
const app = express();

// 3. ミドルウェアの設定
app.use(cors()); // CORSを有効にし、フロントエンドからのリクエストを許可
app.use(express.json({ limit: '10mb' })); // リクエストボディのJSONをパースする（画像データのために上限を増やす）
app.use(express.static('public')); // publicディレクトリ内の静的ファイルを提供

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

// Special Text-to-Image (Gemini 2.5 Flash) endpoint
app.post('/api/generate-special', async (req, res) => {
    try {
        const ai = new GoogleGenAI(API_KEY);
        const config = {
            responseModalities: ['IMAGE', 'TEXT'],
        };
        const model = 'gemini-2.5-flash-image';
        const contents = [{
            role: 'user',
            parts: [{
                text: `Generate an image of a banana wearing a costume.`,
            }, ],
        }, ];

        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });

        let fileIndex = 0;
        for await (const chunk of response) {
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                const fileExtension = mime.getExtension(inlineData.mimeType || '');
                const buffer = Buffer.from(inlineData.data || '', 'base64');
                
                const fileName = `special-${Date.now()}-${fileIndex++}.${fileExtension}`;
                const filePath = path.join('public', 'generated', fileName);
                
                await fs.writeFile(filePath, buffer);
                
                const imageUrl = `/generated/${fileName}`;
                return res.json({ imageUrl });
            }
        }
    } catch (error) {
        handleError(res, error, 'Special Image Generation');
    }
});


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

module.exports = app; // Expressアプリをエクスポート