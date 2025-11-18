import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Netlify環境かローカル環境かを判定
const isNetlify = process.env.NETLIFY === 'true';

// ローカル環境のみファイルシステムを使用
let generatedDir;
if (!isNetlify) {
    generatedDir = path.join(__dirname, 'public', 'generated');
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }
}

// 複数のAIプロバイダー
const AI_PROVIDERS = {
    // FLUX.1 - 最高品質の一般生成
    flux: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`,
    
    // Stable Diffusion XL - 詳細な生成
    sdxl: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=sdxl&nologo=true&enhance=true&seed=${Date.now()}`,
    
    // Turbo - 高速生成
    turbo: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=turbo&nologo=true&seed=${Date.now()}`
};

// スタイル別のプロンプトエンハンサー
const STYLE_ENHANCERS = {
    classic: (prompt) => `${prompt}, traditional paper cut art, kirigami style, layered paper craft, intricate details, sharp edges, clean cuts, elegant design, high contrast shadows, professional paper cutting, masterpiece quality, 8k resolution`,
    
    colorful: (prompt) => `${prompt}, vibrant multi-colored paper cut art, rainbow gradient layers, cheerful and bright colors, playful paper craft, pop art style, bold color blocks, modern paper cutting, joyful aesthetic, highly detailed, 8k resolution`,
    
    '3d': (prompt) => `${prompt}, 3D layered paper cut diorama, shadow box effect, multiple depth layers, volumetric paper craft, dimensional paper art, foreground middle ground background, dramatic lighting, depth of field, cinematic composition, ultra realistic, 8k resolution`,
    
    minimal: (prompt) => `${prompt}, minimalist paper cut silhouette, simple clean design, monochromatic, single layer cutting, elegant negative space, zen aesthetic, modern minimalism, geometric shapes, flat design, 2-3 colors maximum, sharp precision, 8k resolution`,
    
    silhouette: (prompt) => `${prompt}, dramatic paper cut silhouette art, black paper on white background, shadow puppet style, bold contrast, elegant curves, theatrical lighting effect, narrative storytelling, single continuous cut, artistic shadow play, museum quality, 8k resolution`
};

async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
    return await response.arrayBuffer();
}

async function saveImage(buffer, filename) {
    if (isNetlify) {
        // Netlify環境ではbase64で返す
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:image/png;base64,${base64}`;
    } else {
        // ローカル環境ではファイルに保存
        const filepath = path.join(generatedDir, filename);
        fs.writeFileSync(filepath, Buffer.from(buffer));
        return `/generated/${filename}`;
    }
}

// テキストから切り絵生成
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, style = 'classic' } = req.body;
        
        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'プロンプトを入力してください' 
            });
        }

        console.log(`[Generate] Prompt: "${prompt}", Style: ${style}`);
        
        // スタイルに応じてプロンプトを強化
        const enhancedPrompt = STYLE_ENHANCERS[style] 
            ? STYLE_ENHANCERS[style](prompt) 
            : STYLE_ENHANCERS.classic(prompt);
        
        // FLUX.1 を使用（最高品質）
        const imageUrl = AI_PROVIDERS.flux(enhancedPrompt);
        console.log(`[Generate] Fetching from FLUX.1...`);
        
        const imageBuffer = await downloadImage(imageUrl);
        const filename = `kirie-${style}-${Date.now()}.png`;
        const localUrl = await saveImage(imageBuffer, filename);
        
        console.log(`[Generate] Success: ${filename}`);
        
        res.json({
            success: true,
            imageUrl: localUrl,
            style: style,
            model: 'FLUX.1'
        });
        
    } catch (error) {
        console.error('[Generate] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || '生成に失敗しました' 
        });
    }
});

// 画像から切り絵変換
app.post('/api/convert', async (req, res) => {
    try {
        const { imageData } = req.body;
        
        if (!imageData) {
            return res.status(400).json({ 
                success: false, 
                error: '画像データが必要です' 
            });
        }

        console.log('[Convert] Converting image to paper-cut style...');
        
        // 画像変換用のプロンプト
        const prompt = 'paper cut art transformation, kirigami style, layered paper craft, vibrant colors, intricate details, sharp edges, high contrast, artistic paper cutting, masterpiece quality';
        
        // FLUX.1で新しい切り絵として生成（より確実）
        const imageUrl = AI_PROVIDERS.flux(prompt);
        console.log('[Convert] Generating with FLUX.1...');
        
        const imageBuffer = await downloadImage(imageUrl);
        const filename = `convert-${Date.now()}.png`;
        const localUrl = await saveImage(imageBuffer, filename);
        
        console.log(`[Convert] Success: ${filename}`);
        
        res.json({
            success: true,
            imageUrl: localUrl,
            model: 'FLUX.1'
        });
        
    } catch (error) {
        console.error('[Convert] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || '変換に失敗しました' 
        });
    }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        models: Object.keys(AI_PROVIDERS),
        styles: Object.keys(STYLE_ENHANCERS)
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AI Kirie Studio Server running on http://localhost:${PORT}`);
    console.log(`📁 Generated images: ${generatedDir}`);
    console.log(`🎨 Available styles: ${Object.keys(STYLE_ENHANCERS).join(', ')}`);
});

export default app;
