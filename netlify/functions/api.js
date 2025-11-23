// Netlify Function for AI Kirie Studio API (CommonJS)
// Powered by Kirie Nexus AI (Gemini 3 Pro Edition)
// Note: Using global fetch (available in Node 18+)

const { GoogleGenerativeAI } = require('@google/generative-ai');

const isNetlify = true;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDxguoJUmZr6dez44CbUgU06klGKci22sI';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ==================== AI PROVIDER: Kirie Nexus AI ====================
// Google Gemini Image Generation API (Imagen 3)
const AI_PROVIDERS = {
    kirie_nexus: async (prompt, imageBase64, mimeType) => {
        try {
            console.log('[Kirie Nexus] Generating with prompt:', prompt);
            
            // Use Google Gemini Imagen 3 API directly
            const model = genAI.getGenerativeModel({ 
                model: 'imagen-3.0-generate-001'
            });
            
            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
            });
            
            const response = result.response;
            
            // Extract image from response
            if (response.candidates && response.candidates[0]) {
                const candidate = response.candidates[0];
                
                // Check for image in parts
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const mimeType = part.inlineData.mimeType || 'image/jpeg';
                            return `data:${mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                }
            }
            
            throw new Error('No image data found in Gemini response');
            
        } catch (error) {
            console.error('[Kirie Nexus] Generation Failed:', error.message);
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


// ==================== STYLE CONFIGURATIONS (Kirie Nexus Optimized) ====================
// Kirie Nexus AIの能力を最大限に引き出す新スタイル定義
const STYLE_CONFIGS = {
    // 究極の切り絵 - Kirie Nexus AIの基本スタイル
    ultimate_kirie: {
        ai: 'kirie_nexus',
        name: 'Ultimate Kirie',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, Kirie Nexus style, ultimate paper cutting art, single sheet paper cut, intricate lace-like patterns, hyper-detailed, 8k resolution, museum quality, dramatic lighting, deep shadows, high contrast, black and white with subtle gold accents, svg style, clean lines, negative space`
    },
    
    // ネオン・フラックス - 未来的な発光切り絵
    neon_flux: {
        ai: 'kirie_nexus',
        name: 'Neon Flux',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, Kirie Nexus style, bioluminescent paper art, cyberpunk aesthetic, glowing edges, deep black background, vibrant neon colors (cyan, magenta, electric yellow), futuristic composition, volumetric lighting, ray tracing, kirie style, paper cut art, svg style`
    },
    
    // クロノ・シャドウ - 時間と空間を超える影絵
    chrono_shadow: {
        ai: 'kirie_nexus',
        name: 'Chrono Shadow',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, Kirie Nexus style, multidimensional shadow art, ethereal silhouette, time-lapse effect, cinematic lighting, mystical atmosphere, fog, mystery, monochrome with sepia tones, 8k, kirie style, paper cut art, svg style`
    },
    
    // クォンタム・ジオラマ - 量子的な深みを持つ立体
    quantum_diorama: {
        ai: 'kirie_nexus',
        name: 'Quantum Diorama',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, Kirie Nexus style, quantum depth diorama, impossible geometry, layered paper sculpture, volumetric 3d, hyper-realistic texture, optical illusion, macro photography, depth of field, 8k, kirie style`
    },

    // アニメ・ヴィヴィッド - 日本のアニメスタイル
    anime_vivid: {
        ai: 'kirie_nexus',
        name: 'Anime Vivid',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, anime style, makoto shinkai style, ufotable style, vibrant colors, detailed background, lens flare, atmospheric lighting, 8k resolution, cinematic composition, highly detailed, expressive`
    },

    // オイル・マスターピース - 油絵・印象派
    oil_masterpiece: {
        ai: 'kirie_nexus',
        name: 'Oil Masterpiece',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, oil painting, impasto, thick textured brushstrokes, classical art style, dramatic lighting, chiaroscuro, museum quality, detailed, 8k, rich colors, traditional media`
    },

    // ウォーターカラー・ドリーム - 水彩画
    watercolor_dream: {
        ai: 'kirie_nexus',
        name: 'Watercolor Dream',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, watercolor painting, wet on wet technique, soft edges, dreamy atmosphere, pastel colors, artistic, splashing ink, detailed, 8k, paper texture, ethereal`
    },

    // サイバー・リアリズム - フォトリアル
    cyber_realism: {
        ai: 'kirie_nexus',
        name: 'Cyber Realism',
        prompt: (text) => `(Subject: ${text}), masterpiece, best quality, photorealistic, 8k, unreal engine 5 render, ray tracing, global illumination, cyberpunk, futuristic, highly detailed, cinematic camera, sharp focus, professional photography`
    }
};

// 指定されたスタイルに最適なAIとプロンプトを生成
async function generateWithStyle(userPrompt, styleKey, imageBase64, mimeType) {
    const config = STYLE_CONFIGS[styleKey] || STYLE_CONFIGS.ultimate_kirie;
    
    // プロンプト強化
    let enhancedPrompt = config.prompt(userPrompt);
    
    try {
        const aiProvider = AI_PROVIDERS[config.ai];
        const imageUrl = await aiProvider(enhancedPrompt, imageBase64, mimeType);
        
        return {
            imageUrl: imageUrl,
            model: 'Kirie Nexus AI',
            styleName: config.name
        };
    } catch (error) {
        console.error(`Generation failed for ${styleKey}:`, error.message);
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
                    system: 'Kirie Nexus AI System',
                    version: '4.0.0-GLOBAL',
                    styles: Object.keys(STYLE_CONFIGS).map(key => ({
                        id: key,
                        name: STYLE_CONFIGS[key].name
                    }))
                })
            };
        }

        // 生成エンドポイント
        if (path === '/generate' && event.httpMethod === 'POST') {
            const { prompt, style = 'ultimate_kirie', image, mimeType } = JSON.parse(event.body || '{}');

            if (!prompt || prompt.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Prompt required' })
                };
            }

            console.log(`[Kirie Nexus] Generating: "${prompt}" (${style})`);

            const result = await generateWithStyle(prompt, style, image, mimeType);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    ...result,
                    prompt: prompt
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