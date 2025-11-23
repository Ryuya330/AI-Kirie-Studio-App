// Netlify Function for AI Kirie Studio API (CommonJS)
// Powered by Pollinations AI (完全無料・認証不要)

// ==================== 多言語翻訳システム (完全無料) ====================
// MyMemory Translation API - 完全無料の翻訳API
async function translateToEnglish(text) {
    try {
        // 英語のみの場合はそのまま返す
        if (/^[a-zA-Z\s\-,\.]+$/.test(text)) {
            console.log('[Translation] Already in English:', text);
            return text;
        }

        console.log('[Translation] Translating to English:', text);
        
        const encodedText = encodeURIComponent(text);
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ja|en`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            const translated = data.responseData.translatedText;
            console.log('[Translation] Translated:', translated);
            return translated;
        }
        
        // 翻訳失敗時は元のテキストを返す
        console.log('[Translation] Failed, using original text');
        return text;
        
    } catch (error) {
        console.error('[Translation] Error:', error.message);
        return text; // エラー時は元のテキストを使用
    }
}

// ==================== AI PROVIDER: Pollinations AI (完全無料) ====================
const AI_PROVIDERS = {
    kirie_nexus: async (prompt, imageBase64, mimeType) => {
        try {
            console.log('[Pollinations AI] Generating with prompt:', prompt);
            
            // Pollinations AI - 完全無料で認証不要のFlux AI
            // ネガティブプロンプトで不要な要素を除外（より強力に）
            const negativePrompt = 'color, colorful, colored, photo, photograph, realistic, 3D render, gradient, soft edges, blur, blurry, watermark, text, letters, signature, username, frame, border, low contrast, grey, gray, faded, dull, messy, chaotic, unclear, low quality, jpeg artifacts, noise';
            
            const encodedPrompt = encodeURIComponent(prompt);
            const encodedNegative = encodeURIComponent(negativePrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=false&negative=${encodedNegative}&seed=${Date.now()}`;
            
            console.log('[Pollinations AI] Fetching from:', imageUrl);
            
            const response = await fetch(imageUrl);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Pollinations AI Error ${response.status}: ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString('base64');
            
            return `data:image/jpeg;base64,${base64Image}`;
            
        } catch (error) {
            console.error('[Pollinations AI] Generation Failed:', error.message);
            throw new Error(`画像生成に失敗しました: ${error.message}`);
        }
    }
};

// ==================== PROCEDURAL FALLBACK ENGINE ====================
// AIが利用できない場合でも、美しい幾何学的な切り絵を生成するエンジン
function generateProceduralKirie(prompt) {
    const size = 1024;
    const seed = prompt.length; // Simple seed
    
    // Generate random geometric shapes
    let paths = '';
    const numShapes = 20 + (seed % 30);
    
    for (let i = 0; i < numShapes; i++) {
        const cx = (Math.sin(i * seed) * 0.4 + 0.5) * size;
        const cy = (Math.cos(i * seed) * 0.4 + 0.5) * size;
        const r = (Math.abs(Math.sin(i * seed * 2)) * 0.1 + 0.05) * size;
        
        // Create complex paths (simulating paper cuts)
        paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="black" />`;
        paths += `<rect x="${cx - r/2}" y="${cy - r/2}" width="${r}" height="${r}" transform="rotate(${i*15} ${cx} ${cy})" fill="black" />`;
    }
    
    // Add a central motif
    paths += `<circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="none" stroke="black" stroke-width="20" />`;
    paths += `<text x="50%" y="95%" text-anchor="middle" fill="black" font-size="40" font-family="sans-serif">Kirie Nexus Demo: ${prompt.substring(0, 20)}...</text>`;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
            <rect width="100%" height="100%" fill="white"/>
            <g opacity="0.9">
                ${paths}
            </g>
        </svg>
    `;
    
    const base64Svg = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64Svg}`;
}

// 切り絵専用プロンプト生成（Flux AI最適化版）
function createKiriePrompt(userPrompt) {
    // Flux AIが得意とする詳細なスタイル指定
    // - 高コントラスト
    // - 精密なディテール
    // - ドラマチックな構図
    // - プロフェッショナルなライティング
    return `${userPrompt}, intricate Japanese Kirie paper cutting art, bold black silhouette on pure white background, extremely detailed ornamental patterns, laser-cut precision, symmetrical traditional motifs, decorative filigree borders, elegant negative space design, masterful papercraft technique, studio photography lighting, 8K ultra sharp details, professional art documentation, museum quality, dramatic shadows, perfect contrast ratio, fine line work, complex geometric patterns`;
}

async function generateKirieArt(userPrompt, imageBase64, mimeType) {
    // 日本語を英語に翻訳（AIは英語プロンプトの方が精度が高い）
    const translatedPrompt = await translateToEnglish(userPrompt);
    console.log('[Kirie] Original:', userPrompt, '→ Translated:', translatedPrompt);
    
    const enhancedPrompt = createKiriePrompt(translatedPrompt);
    
    try {
        const imageUrl = await AI_PROVIDERS.kirie_nexus(enhancedPrompt, imageBase64, mimeType);
        
        return {
            imageUrl: imageUrl,
            model: 'Kirie Studio AI'
        };
    } catch (error) {
        console.error('Kirie generation failed:', error.message);
        throw error;
    }
}

// ==================== NETLIFY HANDLER ====================
exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');

    try {
        // Health check
        if (path === '/health' && event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'ok',
                    system: 'Kirie Studio AI System',
                    version: '5.0.0-KIRIE-FOCUSED'
                })
            };
        }

        // 生成エンドポイント
        if (path === '/generate' && event.httpMethod === 'POST') {
            const { prompt, image, mimeType } = JSON.parse(event.body || '{}');

            if (!prompt || prompt.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Prompt required' })
                };
            }

            console.log(`[Kirie Studio] Generating: "${prompt}"`);

            const result = await generateKirieArt(prompt, image, mimeType);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    ...result,
                    prompt: prompt,
                    model: 'Pollinations AI (Flux)'
                })
            };
        }

        // 変換エンドポイント (画像to画像)
        if (path === '/convert' && event.httpMethod === 'POST') {
             const { imageData, style = 'ultimate_kirie' } = JSON.parse(event.body || '{}');
             
             const basePrompt = 'Masterpiece, Kirie Nexus artistic reconstruction, preserving composition, paper cut style';
             const result = await generateWithStyle(basePrompt, style);
             
             return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    ...result,
                    note: 'Kirie Nexus Reconstruction'
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        console.error('[Kirie Nexus Error]:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Kirie Nexus System Error' 
            })
        };
    }
};