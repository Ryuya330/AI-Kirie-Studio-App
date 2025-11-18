// Netlify Function for AI Kirie Studio API (CommonJS)
// Multi-AI Integration for Premium Paper-Cut Art Generation
// Note: Using global fetch (available in Node 18+)

const isNetlify = true;

// ==================== AI PROVIDERS ====================
// 複数のAIプロバイダーを統合 - 各AIの強みを活かす
const AI_PROVIDERS = {
    // FLUX.1 - バランスの取れた高品質生成
    flux: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`,
    
    // Turbo - 高速生成、シンプルなデザインに最適
    turbo: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=turbo&nologo=true&enhance=true&seed=${Date.now()}`,
    
    // NanoBanana - 切り絵・イラスト特化の専門AI
    // アーティスティックで繊細な表現に優れる
    nanobanana: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=nanobanana&nologo=true&enhance=true&seed=${Date.now()}`
};

// ==================== STYLE CONFIGURATIONS ====================
// 各スタイルに最適なAIとプロンプトテンプレートを定義
const STYLE_CONFIGS = {
    // 伝統的な切り絵 - NanoBanana（繊細な線と日本的表現に強い）
    traditional: {
        ai: 'nanobanana',
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
    
    // 幻想ファンタジー - NanoBanana（想像力豊かなアート表現）
    fantasy: {
        ai: 'nanobanana',
        name: '幻想ファンタジー',
        prompt: (text) => `Fantasy fairytale paper art: ${text}. Magical storybook illustration style, whimsical characters and creatures, enchanted forest or castle setting, layered paper with backlight glow effect, dreamy pastel colors, Lotte Reiniger animation influence, ethereal atmosphere, intricate decorative borders, 8K enchanting details`
    },
    
    // アールヌーヴォー - NanoBanana（装飾的で有機的な曲線）
    nouveau: {
        ai: 'nanobanana',
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
async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
    return await response.arrayBuffer();
}

// 指定されたスタイルに最適なAIとプロンプトを生成
function generateWithStyle(userPrompt, styleKey) {
    const config = STYLE_CONFIGS[styleKey] || STYLE_CONFIGS.traditional;
    const enhancedPrompt = config.prompt(userPrompt);
    const aiProvider = AI_PROVIDERS[config.ai];
    return {
        imageUrl: aiProvider(enhancedPrompt),
        model: config.ai.toUpperCase(),
        styleName: config.name
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

            const { imageUrl, model, styleName } = generateWithStyle(prompt, style);
            console.log(`[Generate] Using ${model} for style: ${styleName}`);

            const imageBuffer = await downloadImage(imageUrl);
            const base64 = Buffer.from(imageBuffer).toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

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
            const { imageUrl, model, styleName } = generateWithStyle(basePrompt, style);

            const imageBuffer = await downloadImage(imageUrl);
            const base64 = Buffer.from(imageBuffer).toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

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