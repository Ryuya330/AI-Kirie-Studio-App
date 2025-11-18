import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Replicate from 'replicate';
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

// Replicate API の初期化
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

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
 * Text-to-Image Generation (FLUX.1 Schnell - 高速生成)
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

        // FLUX.1 Schnellモデルで高速生成
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: prompt,
                    num_outputs: 1,
                    aspect_ratio: "1:1",
                    output_format: "png",
                    output_quality: 90
                }
            }
        );

        // 出力は画像URLの配列
        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        if (!imageUrl) {
            throw new Error('画像が生成されませんでした');
        }

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
 * Image-to-Image Generation (FLUX.1 Schnell with image prompt)
 */
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, base64ImageData, mimeType } = req.body;
        
        if (!prompt || !base64ImageData || !mimeType) {
            return res.status(400).json({ 
                success: false,
                message: 'プロンプト、画像データ、MIMEタイプが必要です' 
            });
        }

        console.log('[Image-to-Image] Converting with prompt:', prompt);

        // Base64をデータURIに変換
        const imageDataUri = `data:${mimeType};base64,${base64ImageData}`;

        // FLUX.1 Devモデルでimage-to-image変換
        const output = await replicate.run(
            "black-forest-labs/flux-dev",
            {
                input: {
                    prompt: prompt,
                    image: imageDataUri,
                    num_outputs: 1,
                    aspect_ratio: "1:1",
                    output_format: "png",
                    output_quality: 90,
                    prompt_strength: 0.8
                }
            }
        );

        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        if (!imageUrl) {
            throw new Error('画像が生成されませんでした');
        }

        // 画像をダウンロードして保存
        const fileName = `image-${Date.now()}.png`;
        const localUrl = await downloadAndSaveImage(imageUrl, fileName);

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
 * Special Generation (SDXL with LoRA for paper cut art)
 */
app.post('/api/generate-special', async (req, res) => {
    try {
        console.log('[Special] Generating special paper-cut banana...');

        const prompt = 'A cute smiling banana character wearing a colorful costume, paper cut art style, kirigami, layered paper craft, vibrant colors, whimsical and cheerful, highly detailed, masterpiece';

        // SDXL with paper-cut style
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                    negative_prompt: "ugly, blurry, low quality, distorted, realistic photo, 3d render",
                    num_outputs: 1,
                    aspect_ratio: "1:1",
                    output_format: "png",
                    output_quality: 90
                }
            }
        );

        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        if (!imageUrl) {
            throw new Error('画像が生成されませんでした');
        }

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