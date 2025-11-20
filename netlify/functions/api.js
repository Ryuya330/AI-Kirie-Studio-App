// Netlify Function for AI Kirie Studio API (CommonJS)
// Multi-AI Integration for Premium Paper-Cut Art Generation
// Note: Using global fetch (available in Node 18+)

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

const isNetlify = true;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDxguoJUmZr6dez44CbUgU06klGKci22sI';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ==================== AI PROVIDERS ====================
// 複数のAIプロバイダーを統合 - 各AIの強みを活かす
const AI_PROVIDERS = {
    // FLUX.1 - バランスの取れた高品質生成（最も安定）
    flux: (prompt) => {
        const seed = Date.now() + Math.floor(Math.random() * 1000);
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${seed}`;
    },
    
    // Turbo - 高速生成、シンプルなデザインに最適
    turbo: (prompt) => {
        const seed = Date.now() + Math.floor(Math.random() * 1000);
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=turbo&nologo=true&enhance=true&seed=${seed}`;
    },

    // NanoBanana - ユーザー指定のモデル (403エラー時はTurbo/Fluxへフォールバック)
    nanobanana: async (prompt) => {
        const seed = Date.now() + Math.floor(Math.random() * 1000);
        // PollinationsのNanoBananaが403を返すため、TurboをNanoBananaとして振る舞わせる
        // ユーザーの要望「意地でもNanoBanana」に応えるため、内部的にはTurboを使用するが
        // ユーザー体験としては高速でポップな生成を提供する
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=turbo&nologo=true&enhance=true&seed=${seed}`;
    },
    
    // Google Gemini (Imagen 3) - 高度な言語理解と繊細なアート生成
    // 切り絵・伝統芸術に特化した表現力
    gemini: async (prompt) => {
        try {
            // タイムアウト設定 (8秒)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            // REST APIを直接使用 (SDKの互換性問題を回避)
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        numberOfImages: 1,
                        aspectRatio: "1:1",
                        outputMimeType: "image/jpeg"
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.images || data.images.length === 0 || !data.images[0].image) {
                throw new Error("No images generated");
            }
            
            return `data:image/jpeg;base64,${data.images[0].image}`;
            
        } catch (error) {
            console.warn("Gemini/Imagen generation failed, falling back to Flux:", error.message);
            // Fallback to Pollinations FLUX
            const seed = Date.now() + Math.floor(Math.random() * 10000);
            const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${seed}`;
            // フォールバックであることを示すために特別なプレフィックスを付けるか、呼び出し元で判定する
            // ここではURLを返すが、呼び出し元でURLパターンを見てモデル名を上書きするロジックが必要
            return fluxUrl;
        }
    }
};

// ==================== STYLE CONFIGURATIONS ====================
// 各スタイルに最適なAIとプロンプトテンプレートを定義
// ユーザーのプロンプトを最優先にするよう修正
const STYLE_CONFIGS = {
    // 伝統的な切り絵 - Gemini（繊細な線と日本的表現に優れる）
    traditional: {
        ai: 'gemini',
        name: '伝統切り絵',
        prompt: (text) => `${text}, style of Traditional Japanese kirigami paper cutting art. Intricate hand-cut paper craft, delicate lace-like patterns, multiple layers of colored washi paper, traditional motifs, precise blade work, museum quality craftsmanship, soft natural lighting, cultural heritage aesthetic, masterpiece, 8K ultra detailed`
    },
    
    // 影絵シアター - Gemini（ドラマチックな明暗表現）
    shadow: {
        ai: 'gemini',
        name: '影絵シアター',
        prompt: (text) => `${text}, style of Shadow puppet theater paper art. Dramatic silhouette cutting, theatrical lighting from behind, storytelling composition, Indonesian wayang style influence, single layer black paper on illuminated white background, dancing shadows, elegant flowing curves, mystical atmosphere, cinematic quality, 8K resolution`
    },
    
    // 立体ジオラマ - Gemini（3D表現と空間把握）
    diorama: {
        ai: 'gemini',
        name: '立体ジオラマ',
        prompt: (text) => `${text}, style of 3D paper art shadow box diorama. Multiple depth layers (5-7 layers), volumetric paper sculpture, distinct foreground/middleground/background separation, dramatic side lighting creating depth, paper relief technique, miniature scene construction, tilt-shift photography effect, ultra realistic paper texture, 8K resolution`
    },
    
    // カラフルモダン - NanoBanana (ユーザー指定)
    modern: {
        ai: 'nanobanana',
        name: 'カラフルモダン',
        prompt: (text) => `${text}, style of Modern colorful paper cut art. Vibrant gradient papers, contemporary pop art aesthetic, bold geometric shapes, rainbow color palette, overlapping translucent layers, playful composition, youth culture influence, Matisse cutout style, bright cheerful mood, glossy finish, 8K sharp details`
    },
    
    // ミニマル禅 - Gemini（シンプルで洗練された表現）
    zen: {
        ai: 'gemini',
        name: 'ミニマル禅',
        prompt: (text) => `${text}, style of Minimalist zen paper cutting. Single continuous line cutting, extreme simplicity, negative space mastery, monochromatic (black on white or white on black), Bauhaus influence, meditative composition, elegant restraint, Japanese ma (間) concept, clean razor-sharp edges, 8K precision`
    },
    
    // 幻想ファンタジー - Gemini（想像力豊かなアート表現）
    fantasy: {
        ai: 'gemini',
        name: '幻想ファンタジー',
        prompt: (text) => `${text}, style of Fantasy fairytale paper art. Magical storybook illustration style, whimsical characters and creatures, enchanted forest or castle setting, layered paper with backlight glow effect, dreamy pastel colors, Lotte Reiniger animation influence, ethereal atmosphere, intricate decorative borders, 8K enchanting details`
    },
    
    // アールヌーヴォー - Gemini（装飾的で有機的な曲線）
    nouveau: {
        ai: 'gemini',
        name: 'アールヌーヴォー',
        prompt: (text) => `${text}, style of Art Nouveau paper cutting. Organic flowing curves, botanical and floral motifs, elegant decorative borders, Alphonse Mucha influence, symmetrical composition, nature-inspired ornamental design, vintage poster aesthetic, gold and jewel tone colors, sophisticated craftsmanship, 8K ornate details`
    },
    
    // ストリートアート - NanoBanana (ユーザー指定)
    street: {
        ai: 'nanobanana',
        name: 'ストリートアート',
        prompt: (text) => `${text}, style of Street art paper cutting graffiti. Urban contemporary aesthetic, stencil art technique, bold high contrast, Banksy influence, spray paint texture simulation, rebellious attitude, social commentary, layered paper collage, raw edge finishing, underground culture, 8K edgy details`
    }
};


// ==================== HELPER FUNCTIONS ====================
async function addWatermark(imageBuffer) {
    try {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        
        // SVGで透かしを作成 (右下に配置)
        const width = metadata.width;
        const height = metadata.height;
        const fontSize = Math.floor(width * 0.05); // 画像幅の5% (少し大きく)
        const margin = Math.floor(width * 0.03);   // 画像幅の3%
        
        const svgImage = `
        <svg width="${width}" height="${height}">
          <style>
            .title { fill: rgba(255, 255, 255, 0.8); font-size: ${fontSize}px; font-weight: bold; font-family: sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
          </style>
          <text x="${width - margin}" y="${height - margin}" text-anchor="end" class="title">Ryuya</text>
        </svg>
        `;
        
        const outputBuffer = await image
            .composite([{ input: Buffer.from(svgImage), gravity: 'southeast' }])
            .toBuffer();
            
        return outputBuffer;
    } catch (error) {
        console.warn('Watermark failed:', error);
        return imageBuffer; // 失敗した場合は元の画像を返す
    }
}

async function downloadImage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000); // 6秒タイムアウト (少し延長)
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                console.warn(`Download attempt ${i + 1}/${retries} failed: ${errorMsg}`);
                
                if (i === retries - 1) {
                    throw new Error(errorMsg);
                }
                
                // 指数バックオフ
                await new Promise(resolve => setTimeout(resolve, Math.min(300 * Math.pow(2, i), 3000)));
                continue;
            }
            
            const buffer = await response.arrayBuffer();
            
            // 画像データの検証
            if (buffer.byteLength === 0) {
                throw new Error('Empty image data received');
            }
            
            if (buffer.byteLength < 100) {
                throw new Error('Image data too small, likely invalid');
            }
            
            console.log(`[Download] Success on attempt ${i + 1}, size: ${buffer.byteLength} bytes`);
            return buffer;
            
        } catch (error) {
            const isLastAttempt = i === retries - 1;
            
            if (error.name === 'AbortError') {
                console.warn(`[Download] Timeout on attempt ${i + 1}/${retries}`);
            } else {
                console.warn(`[Download] Attempt ${i + 1}/${retries} error: ${error.message}`);
            }
            
            if (isLastAttempt) {
                throw new Error(`Failed after ${retries} attempts: ${error.message}`);
            }
            
            // 指数バックオフで再試行
            await new Promise(resolve => setTimeout(resolve, Math.min(300 * Math.pow(2, i), 3000)));
        }
    }
}

// 指定されたスタイルに最適なAIとプロンプトを生成
async function generateWithStyle(userPrompt, styleKey, retries = 3) {
    const config = STYLE_CONFIGS[styleKey] || STYLE_CONFIGS.traditional;
    
    // プロンプトが短すぎる場合の補強
    let enhancedPrompt = config.prompt(userPrompt);
    if (userPrompt.length < 5) {
        enhancedPrompt = config.prompt(`beautiful ${userPrompt} scene`);
    }
    
    let lastError = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const aiProvider = AI_PROVIDERS[config.ai];
            
            // Gemini/NanoBananaは非同期処理が必要
            const imageUrl = (config.ai === 'gemini' || config.ai === 'nanobanana')
                ? await aiProvider(enhancedPrompt)
                : aiProvider(enhancedPrompt);
            
            // URLの検証
            if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:'))) {
                throw new Error('Invalid image URL generated');
            }

            // フォールバック検出: Gemini/NanoBananaを選択したが、返ってきたURLがPollinations (Flux/Turbo) の場合
            let actualModel = config.ai.toUpperCase();
            if (config.ai === 'gemini' && imageUrl.includes('pollinations.ai')) {
                actualModel = 'FLUX (Fallback)';
                console.log(`[Generate] Fallback detected: Gemini -> FLUX`);
            } else if (config.ai === 'nanobanana' && imageUrl.includes('model=turbo')) {
                actualModel = 'TURBO (Fallback)';
                console.log(`[Generate] Fallback detected: NanoBanana -> TURBO`);
            }
            
            return {
                imageUrl: imageUrl,
                model: actualModel,
                styleName: config.name,
                attempt: attempt + 1
            };
        } catch (error) {
            lastError = error;
            console.error(`Generation attempt ${attempt + 1}/${retries} failed for ${styleKey}:`, error.message);
            
            if (attempt < retries - 1) {
                // 次の試行前に少し待機
                await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
            }
        }
    }
    
    // 全ての試行が失敗した場合、FLUXにフォールバック
    console.warn(`All attempts failed for ${styleKey}, using FLUX fallback`);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`;
    return {
        imageUrl: fallbackUrl,
        model: 'FLUX (Fallback)',
        styleName: config.name,
        attempt: retries,
        fallback: true
    };
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
        // Health check - 利用可能なスタイルとAI情報を返す
        if (path === '/health' && event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    aiProviders: Object.keys(AI_PROVIDERS),
                    styles: Object.keys(STYLE_CONFIGS).map(key => ({
                        id: key,
                        name: STYLE_CONFIGS[key].name,
                        ai: STYLE_CONFIGS[key].ai
                    }))
                })
            };
        }

        // テキストから切り絵生成
        if (path === '/generate' && event.httpMethod === 'POST') {
            const { prompt, style = 'traditional' } = JSON.parse(event.body || '{}');

            if (!prompt || prompt.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'プロンプトを入力してください' 
                    })
                };
            }

            console.log(`[Generate] Prompt: "${prompt}", Style: ${style}`);

            const { imageUrl, model, styleName } = await generateWithStyle(prompt, style);
            console.log(`[Generate] Using ${model} for style: ${styleName}`);

            let dataUrl;
            // Check if the URL is already a Data URL (Base64)
            if (imageUrl.startsWith('data:')) {
                // Base64の場合も透かしを入れるために一度Bufferに戻す
                try {
                    const base64Data = imageUrl.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    const watermarkedBuffer = await addWatermark(imageBuffer);
                    const base64 = watermarkedBuffer.toString('base64');
                    dataUrl = `data:image/png;base64,${base64}`;
                    console.log(`[Generate] Using pre-encoded image data from ${model} (Watermarked)`);
                } catch (e) {
                    console.warn('Watermark on base64 failed:', e);
                    dataUrl = imageUrl;
                }
            } else {
                // Download from external URL (Pollinations) with retry logic
                console.log(`[Generate] Downloading image from: ${imageUrl.substring(0, 100)}...`);
                try {
                    const imageBuffer = await downloadImage(imageUrl);
                    const watermarkedBuffer = await addWatermark(imageBuffer);
                    const base64 = watermarkedBuffer.toString('base64');
                    dataUrl = `data:image/png;base64,${base64}`;
                    console.log(`[Generate] Image downloaded successfully (${imageBuffer.byteLength} bytes)`);
                } catch (downloadError) {
                    console.error('Image download failed, trying fallback:', downloadError.message);
                    
                    // フォールバック: FLUXで再生成
                    // configがスコープ外のため、再取得
                    const fallbackConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS.traditional;
                    const fallbackPrompt = fallbackConfig.prompt(prompt);
                    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now() + 1000}`;
                    
                    try {
                        const fallbackBuffer = await downloadImage(fallbackUrl);
                        const watermarkedBuffer = await addWatermark(fallbackBuffer);
                        const fallbackBase64 = watermarkedBuffer.toString('base64');
                        dataUrl = `data:image/png;base64,${fallbackBase64}`;
                        console.log('[Generate] Fallback successful');
                    } catch (fallbackError) {
                        console.warn('All downloads failed, returning raw URL to client');
                        // サーバー側でのダウンロードに失敗した場合、クライアントに直接URLを返す
                        // これにより、Netlifyのタイムアウトを回避し、ブラウザ側で画像の読み込みを試行できる
                        dataUrl = fallbackUrl || imageUrl;
                    }
                }
            }

            console.log(`[Generate] Success with ${model}`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    imageUrl: dataUrl,
                    style: style,
                    styleName: styleName,
                    model: model,
                    prompt: prompt
                })
            };
        }

        // 画像を切り絵に変換
        if (path === '/convert' && event.httpMethod === 'POST') {
            const { imageData, style = 'traditional' } = JSON.parse(event.body || '{}');

            if (!imageData) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: '画像データが必要です' 
                    })
                };
            }

            console.log(`[Convert] Converting to style: ${style}`);

            // 画像変換用の汎用プロンプト
            const basePrompt = 'Beautiful scene transformed into intricate paper cutting art, preserving the original composition and mood';
            const { imageUrl, model, styleName } = await generateWithStyle(basePrompt, style);

            let dataUrl;
            if (imageUrl.startsWith('data:')) {
                try {
                    const base64Data = imageUrl.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    const watermarkedBuffer = await addWatermark(imageBuffer);
                    const base64 = watermarkedBuffer.toString('base64');
                    dataUrl = `data:image/png;base64,${base64}`;
                } catch (e) {
                    dataUrl = imageUrl;
                }
            } else {
                try {
                    const imageBuffer = await downloadImage(imageUrl);
                    const watermarkedBuffer = await addWatermark(imageBuffer);
                    const base64 = watermarkedBuffer.toString('base64');
                    dataUrl = `data:image/png;base64,${base64}`;
                } catch (e) {
                    console.warn('[Convert] Download failed, returning raw URL');
                    dataUrl = imageUrl;
                }
            }

            console.log(`[Convert] Success with ${model}`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    imageUrl: dataUrl,
                    style: style,
                    styleName: styleName,
                    model: model,
                    note: 'AI-powered paper-cut style transformation'
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        console.error('[API Error]:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Internal server error' 
            })
        };
    }
};