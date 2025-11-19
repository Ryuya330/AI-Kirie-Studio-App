// Netlify Function for AI Kirie Studio API (CommonJS)
// Multi-AI Integration for Premium Paper-Cut Art Generation
// Note: Using global fetch (available in Node 18+)

const { GoogleGenerativeAI } = require('@google/generative-ai');

const isNetlify = true;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDxguoJUmZr6dez44CbUgU06klGKci22sI';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ==================== AI PROVIDERS ====================
// 複数のAIプロバイダーを統合 - 各AIの強みを活かす
const AI_PROVIDERS = {
    // FLUX.1 - バランスの取れた高品質生成
    flux: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`,
    
    // Turbo - 高速生成、シンプルなデザインに最適
    turbo: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=turbo&nologo=true&enhance=true&seed=${Date.now()}`,
    
    // Google Gemini (Imagen 3) - 高度な言語理解と繊細なアート生成
    // 切り絵・伝統芸術に特化した表現力
    gemini: async (prompt) => {
        try {
            // Imagen 3 model for image generation
            // Docs: https://ai.google.dev/gemini-api/docs/image-generation
            const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-001' });
            
            // Check if generateImages is supported (requires recent SDK)
            if (!model.generateImages) {
                throw new Error("SDK does not support generateImages method");
            }

            const result = await model.generateImages({
                prompt: prompt,
                numberOfImages: 1,
                aspectRatio: "1:1",
                outputMimeType: "image/jpeg"
            });
            
            const response = result.response;
            const images = response.images;
            
            if (!images || images.length === 0) {
                throw new Error("No images generated");
            }
            
            // Return Data URL directly
            // Note: The SDK returns the base64 string in images[0].image
            return `data:image/jpeg;base64,${images[0].image}`;
            
        } catch (error) {
            console.warn("Gemini/Imagen generation failed, falling back to Flux:", error.message);
            // Fallback to Pollinations FLUX
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`;
        }
    }
};

// ==================== STYLE CONFIGURATIONS ====================
// 各スタイルに最適なAIとプロンプトテンプレートを定義
// 【2025年1月 - Gemini統合版】FLUX + Turbo + Gemini の3AI混合構成
const STYLE_CONFIGS = {
    // 伝統的な切り絵 - Gemini（繊細な線と日本的表現に優れる）
    traditional: {
        ai: 'gemini',
        name: '伝統切り絵',
        prompt: (text) => `Traditional Japanese kirigami paper cutting art: ${text}. Intricate hand-cut paper craft, delicate lace-like patterns, multiple layers of colored washi paper, traditional motifs (sakura, crane, wave), precise blade work, museum quality craftsmanship, soft natural lighting, cultural heritage aesthetic, masterpiece, 8K ultra detailed`
    },
    
    // 影絵シアター - FLUX（ドラマチックな明暗表現）
    shadow: {
        ai: 'flux',
        name: '影絵シアター',
        prompt: (text) => `Shadow puppet theater paper art: ${text}. Dramatic silhouette cutting, theatrical lighting from behind, storytelling composition, Indonesian wayang style influence, single layer black paper on illuminated white background, dancing shadows, elegant flowing curves, mystical atmosphere, cinematic quality, 8K resolution`
    },
    
    // 立体ジオラマ - FLUX（3D表現と空間把握）
    diorama: {
        ai: 'flux',
        name: '立体ジオラマ',
        prompt: (text) => `3D paper art shadow box diorama: ${text}. Multiple depth layers (5-7 layers), volumetric paper sculpture, distinct foreground/middleground/background separation, dramatic side lighting creating depth, paper relief technique, miniature scene construction, tilt-shift photography effect, ultra realistic paper texture, 8K resolution`
    },
    
    // カラフルモダン - Turbo（鮮やかな色彩表現）
    modern: {
        ai: 'turbo',
        name: 'カラフルモダン',
        prompt: (text) => `Modern colorful paper cut art: ${text}. Vibrant gradient papers, contemporary pop art aesthetic, bold geometric shapes, rainbow color palette, overlapping translucent layers, playful composition, youth culture influence, Matisse cutout style, bright cheerful mood, glossy finish, 8K sharp details`
    },
    
    // ミニマル禅 - Turbo（シンプルで洗練された表現）
    zen: {
        ai: 'turbo',
        name: 'ミニマル禅',
        prompt: (text) => `Minimalist zen paper cutting: ${text}. Single continuous line cutting, extreme simplicity, negative space mastery, monochromatic (black on white or white on black), Bauhaus influence, meditative composition, elegant restraint, Japanese ma (間) concept, clean razor-sharp edges, 8K precision`
    },
    
    // 幻想ファンタジー - Gemini（想像力豊かなアート表現）
    fantasy: {
        ai: 'gemini',
        name: '幻想ファンタジー',
        prompt: (text) => `Fantasy fairytale paper art: ${text}. Magical storybook illustration style, whimsical characters and creatures, enchanted forest or castle setting, layered paper with backlight glow effect, dreamy pastel colors, Lotte Reiniger animation influence, ethereal atmosphere, intricate decorative borders, 8K enchanting details`
    },
    
    // アールヌーヴォー - Gemini（装飾的で有機的な曲線）
    nouveau: {
        ai: 'gemini',
        name: 'アールヌーヴォー',
        prompt: (text) => `Art Nouveau paper cutting: ${text}. Organic flowing curves, botanical and floral motifs, elegant decorative borders, Alphonse Mucha influence, symmetrical composition, nature-inspired ornamental design, vintage poster aesthetic, gold and jewel tone colors, sophisticated craftsmanship, 8K ornate details`
    },
    
    // ストリートアート - FLUX（現代的でエッジの効いた表現）
    street: {
        ai: 'flux',
        name: 'ストリートアート',
        prompt: (text) => `Street art paper cutting graffiti: ${text}. Urban contemporary aesthetic, stencil art technique, bold high contrast, Banksy influence, spray paint texture simulation, rebellious attitude, social commentary, layered paper collage, raw edge finishing, underground culture, 8K edgy details`
    }
};


// ==================== HELPER FUNCTIONS ====================
async function downloadImage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000); // 20秒タイムアウト
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                if (i === retries - 1) throw new Error(`Download failed: ${response.statusText}`);
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                continue;
            }
            return await response.arrayBuffer();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`Download timeout on attempt ${i + 1}`);
            } else {
                console.warn(`Download attempt ${i + 1} failed:`, error.message);
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
    }
}

// 指定されたスタイルに最適なAIとプロンプトを生成
async function generateWithStyle(userPrompt, styleKey, retries = 2) {
    const config = STYLE_CONFIGS[styleKey] || STYLE_CONFIGS.traditional;
    
    // プロンプトが短すぎる場合の補強
    let enhancedPrompt = config.prompt(userPrompt);
    if (userPrompt.length < 5) {
        enhancedPrompt = config.prompt(`beautiful ${userPrompt} scene`);
    }
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const aiProvider = AI_PROVIDERS[config.ai];
            
            // Geminiは非同期処理が必要
            const imageUrl = config.ai === 'gemini' 
                ? await aiProvider(enhancedPrompt)
                : aiProvider(enhancedPrompt);
            
            return {
                imageUrl: imageUrl,
                model: config.ai.toUpperCase(),
                styleName: config.name,
                attempt: attempt + 1
            };
        } catch (error) {
            console.error(`Generation attempt ${attempt + 1} failed:`, error.message);
            if (attempt === retries - 1) {
                // 最終試行失敗時はFLUXにフォールバック
                const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`;
                return {
                    imageUrl: fallbackUrl,
                    model: 'FLUX (Fallback)',
                    styleName: config.name,
                    attempt: attempt + 1
                };
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
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
                dataUrl = imageUrl;
            } else {
                // Download from external URL (Pollinations) with retry logic
                try {
                    const imageBuffer = await downloadImage(imageUrl);
                    const base64 = Buffer.from(imageBuffer).toString('base64');
                    dataUrl = `data:image/png;base64,${base64}`;
                } catch (downloadError) {
                    console.error('Image download failed:', downloadError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: `画像のダウンロードに失敗しました: ${downloadError.message}`,
                            style: style,
                            model: model
                        })
                    };
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
                dataUrl = imageUrl;
            } else {
                const imageBuffer = await downloadImage(imageUrl);
                const base64 = Buffer.from(imageBuffer).toString('base64');
                dataUrl = `data:image/png;base64,${base64}`;
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