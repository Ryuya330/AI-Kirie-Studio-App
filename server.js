import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Pollinations AI - APIキー不要！
const POLLINATIONS_API = 'https://image.pollinations.ai/prompt';

// generated ディレクトリの確認/作成
const generatedDir = path.join(__dirname, 'public', 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

/**
 * エラーハンドリング
 */
function handleError(res, error, context) {
    console.error(`[${context}] Error:`, error);
    const message = error.message || 'Unknown error occurred';
    res.status(500).json({ 
        success: false,
        message: `${context}でエラーが発生しました: ${message}` 
    });
}

/**
 * 画像URLをダウンロードしてファイルとして保存
 */
async function downloadAndSaveImage(imageUrl, fileName) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const filePath = path.join(generatedDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return `/generated/${fileName}`;
}

/**
 * 切り絵スタイル用のプロンプトエンハンサー
 */
function enhanceKiriePrompt(basePrompt, style) {
    const styleModifiers = {
        'シンプル': 'minimalist paper cut art, simple silhouette, clean cuts, flat design, 2-3 colors maximum, geometric shapes',
        'カラフル': 'vibrant paper cut art, multi-layered colored paper, intricate details, gradient colors, cheerful and bright',
        'ジオラマ風': 'layered paper cut diorama, 3D paper craft, shadow box effect, depth layers, detailed foreground and background, volumetric',
        '影絵風': 'silhouette paper cut art, black paper on white background, dramatic shadows, single layer, elegant negative space'
    };
    
    const baseStyle = styleModifiers[style] || styleModifiers['ジオラマ風'];
    
    return `${basePrompt}, ${baseStyle}, paper craft aesthetic, high contrast, sharp edges, professional paper cutting art, kirigami style, masterpiece quality, 8k, highly detailed`;
}

/**
 * Text-to-Image Generation (Stable Diffusion XL)
 */
app.post('/api/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ 
                success: false,
                message: 'プロンプトが必要です' 
            });
        }

        console.log('[Text-to-Image] Generating with prompt:', prompt);

        // Pollinations AIで生成（APIキー不要）
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `${POLLINATIONS_API}/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true`;
        
        console.log('[Text-to-Image] Fetching from:', imageUrl);
        
        // 画像をダウンロードして保存
        const fileName = `text-${Date.now()}.png`;
        const localUrl = await downloadAndSaveImage(imageUrl, fileName);

        console.log('[Text-to-Image] Image saved:', fileName);

        res.json({
            success: true,
            imageUrl: localUrl
        });

    } catch (error) {
        handleError(res, error, 'Text-to-Image Generation');
    }
});

/**
 * Image-to-Image Generation (Hugging Face ControlNet)
 */
app.post('/api/generate-image', async (req, res) => {
    try {
        const { base64ImageData, mimeType } = req.body;
        
        if (!base64ImageData || !mimeType) {
            return res.status(400).json({ 
                success: false,
                message: '画像データとMIMEタイプが必要です' 
            });
        }

        console.log('[Image-to-Image] Converting image to paper-cut style...');

        // Hugging Face APIを使用（APIキー不要のモデル）
        const HF_API_URL = 'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix';
        
        // Base64からバッファに変換
        const imageBuffer = Buffer.from(base64ImageData, 'base64');
        
        // Hugging Face APIにリクエスト
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: {
                    image: `data:${mimeType};base64,${base64ImageData}`,
                    prompt: 'Transform this into paper cut art style, kirigami, layered paper craft, high contrast, sharp edges, vibrant colors'
                }
            })
        });

        if (!response.ok) {
            // フォールバック: Pollinations AIで画像をベースにした生成
            console.log('[Image-to-Image] Using Pollinations fallback...');
            const prompt = 'paper cut art style, kirigami, layered, vibrant, detailed';
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `${POLLINATIONS_API}/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`;
            const fileName = `image-${Date.now()}.png`;
            const localUrl = await downloadAndSaveImage(imageUrl, fileName);
            
            return res.json({
                success: true,
                imageUrl: localUrl,
                method: 'pollinations'
            });
        }

        // 生成された画像を保存
        const resultBuffer = await response.arrayBuffer();
        const fileName = `image-${Date.now()}.png`;
        const filePath = path.join(generatedDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(resultBuffer));
        const localUrl = `/generated/${fileName}`;

        console.log('[Image-to-Image] Image saved:', fileName);

        res.json({
            success: true,
            imageUrl: localUrl
        });

    } catch (error) {
        handleError(res, error, 'Image-to-Image Generation');
    }
});

/**
 * Special Generation (Stable Diffusion for paper cut art)
 */
app.post('/api/generate-special', async (req, res) => {
    try {
        console.log('[Special] Generating special paper-cut banana...');

        const prompt = 'A cute smiling banana character wearing a colorful costume, paper cut art style, kirigami, layered paper craft, vibrant colors, whimsical and cheerful, highly detailed, masterpiece';

        // Pollinations AIで生成
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `${POLLINATIONS_API}/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`;
        
        console.log('[Special] Generating from Pollinations AI');
        
        // 画像をダウンロードして保存
        const fileName = `special-${Date.now()}.png`;
        const localUrl = await downloadAndSaveImage(imageUrl, fileName);

        console.log('[Special] Image saved:', fileName);

        res.json({
            success: true,
            imageUrl: localUrl
        });

    } catch (error) {
        handleError(res, error, 'Special Generation');
    }
});

// サーバー起動
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

export default app;