// Netlify Function for AI Kirie Studio API (CommonJS)
// Note: Using global fetch (available in Node 18+)

// Netlify環境であることを示す
const isNetlify = true;

// AI Provider
const AI_PROVIDERS = {
    flux: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`
};

// Style Enhancers - 切り絵スタイルの強化プロンプト
const STYLE_ENHANCERS = {
    classic: (prompt) => `Japanese paper cut art (kirigami): ${prompt}. Traditional layered paper craft style, intricate cut details, sharp precise edges, elegant silhouette design, high contrast black and white shadows, delicate patterns, professional paper cutting technique, fine craftsmanship, masterpiece quality, 8k resolution`,
    colorful: (prompt) => `Colorful paper cut art: ${prompt}. Vibrant multi-layered paper craft, rainbow gradient colors, cheerful bright palette, playful overlapping layers, pop art aesthetic, bold color blocks, modern paper cutting style, joyful composition, highly detailed patterns, 8k resolution`,
    '3d': (prompt) => `3D layered paper art diorama: ${prompt}. Multiple depth layers creating shadow box effect, volumetric paper craft, dimensional paper sculpture, distinct foreground middle ground background layers, dramatic side lighting, deep shadows, cinematic depth of field, ultra realistic paper texture, 8k resolution`,
    minimal: (prompt) => `Minimalist paper cut silhouette: ${prompt}. Simple clean line design, monochromatic black on white, single layer cutting, elegant negative space, zen aesthetic, modern minimalism, geometric simplified shapes, flat graphic design, 2-3 colors maximum, razor sharp precision, 8k resolution`,
    silhouette: (prompt) => `Dramatic paper cut silhouette: ${prompt}. Black paper on white background, shadow puppet theater style, bold high contrast, elegant flowing curves, theatrical lighting effect, storytelling composition, single continuous cut technique, artistic shadow play, museum quality craftsmanship, 8k resolution`
};

async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
    return await response.arrayBuffer();
}

exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // OPTIONS request for CORS
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
                    timestamp: new Date().toISOString(),
                    models: Object.keys(AI_PROVIDERS),
                    styles: Object.keys(STYLE_ENHANCERS)
                })
            };
        }

        // Generate from text
        if (path === '/generate' && event.httpMethod === 'POST') {
            const { prompt, style = 'classic' } = JSON.parse(event.body || '{}');

            if (!prompt || prompt.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'プロンプトを入力してください' })
                };
            }

            console.log(`[Generate] Prompt: "${prompt}", Style: ${style}`);

            const enhancedPrompt = STYLE_ENHANCERS[style] 
                ? STYLE_ENHANCERS[style](prompt) 
                : STYLE_ENHANCERS.classic(prompt);

            const imageUrl = AI_PROVIDERS.flux(enhancedPrompt);
            console.log(`[Generate] Fetching from FLUX.1...`);

            const imageBuffer = await downloadImage(imageUrl);
            const base64 = Buffer.from(imageBuffer).toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

            console.log(`[Generate] Success`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    imageUrl: dataUrl,
                    style: style,
                    model: 'FLUX.1'
                })
            };
        }

        // Convert image
        if (path === '/convert' && event.httpMethod === 'POST') {
            const { imageData, style = 'classic' } = JSON.parse(event.body || '{}');

            if (!imageData) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: '画像データが必要です' })
                };
            }

            console.log('[Convert] Converting image to paper-cut style...');

            // 画像変換用の汎用プロンプト（元画像の内容に基づく切り絵化）
            const basePrompt = 'Transform this image into paper cut art style';
            const enhancedPrompt = STYLE_ENHANCERS[style] 
                ? STYLE_ENHANCERS[style](basePrompt) 
                : STYLE_ENHANCERS.classic(basePrompt);
            
            const imageUrl = AI_PROVIDERS.flux(enhancedPrompt);

            const imageBuffer = await downloadImage(imageUrl);
            const base64 = Buffer.from(imageBuffer).toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

            console.log('[Convert] Success');

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    imageUrl: dataUrl,
                    style: style,
                    model: 'FLUX.1',
                    note: 'Image conversion generates a new paper-cut style image based on generic prompts'
                })
            };
        }

        // 404 for unknown paths
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
            body: JSON.stringify({ success: false, error: error.message || 'Internal server error' })
        };
    }
};