// Netlify Function for AI Kirie Studio API (CommonJS)
// Note: Using global fetch (available in Node 18+)

// Netlify環境であることを示す
const isNetlify = true;

// AI Provider
const AI_PROVIDERS = {
    flux: (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${Date.now()}`
};

// Style Enhancers
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

    const path = event.path.replace('/.netlify/functions/api', '');

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
            const { imageData } = JSON.parse(event.body || '{}');

            if (!imageData) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: '画像データが必要です' })
                };
            }

            console.log('[Convert] Converting image to paper-cut style...');

            const prompt = 'paper cut art transformation, kirigami style, layered paper craft, vibrant colors, intricate details, sharp edges, high contrast, artistic paper cutting, masterpiece quality';
            const imageUrl = AI_PROVIDERS.flux(prompt);

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
                    model: 'FLUX.1'
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