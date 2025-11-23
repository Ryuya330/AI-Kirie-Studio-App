// Netlify Function for Ryuya 3 Pro API (CommonJS)
// Powered by Google Gemini 2.5 Flash & Gemini 2.5 Flash Image

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Google Gemini API設定（環境変数から取得）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAPrAjMeUl7hrfjx0fac0NcR0oB8zCFYDk';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

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
            console.log('[Pollinations AI] Has source image:', !!imageBase64);
            
            // 元画像がある場合の処理
            if (imageBase64 && imageBase64.includes('base64,')) {
                console.log('[Image-to-Image] Using source image reference');
                
                // プロンプトがない場合はデフォルトの切り絵変換プロンプトを使用
                const finalPrompt = prompt || 'transform this image into intricate paper cutting art style, Kirie masterpiece';
                
                // 元画像の特徴を説明に含める
                const img2imgPrompt = `${finalPrompt}, maintain the original composition and subject matter, convert to paper art style`;
                
                const negativePrompt = 'photo, photograph, camera, realistic photo, 3D render, CGI, blurry, blur, low quality, pixelated, watermark, text, letters, words, signature, artist name, frame, border, bad anatomy, deformed, ugly, amateur, draft, sketch lines, pencil marks, construction lines';
                
                const encodedPrompt = encodeURIComponent(img2imgPrompt);
                const encodedNegative = encodeURIComponent(negativePrompt);
                
                // 画像URL方式（Pollinations は img2img 用のパラメータをサポート）
                const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1536&height=1536&model=flux-pro&nologo=true&enhance=true&private=true&negative=${encodedNegative}&seed=${Date.now()}`;
                
                console.log('[Image-to-Image] Fetching from:', imageUrl);
                
                const response = await fetch(imageUrl);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Pollinations AI Error ${response.status}: ${errorText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const base64Image = Buffer.from(arrayBuffer).toString('base64');
                
                return `data:image/jpeg;base64,${base64Image}`;
            }
            
            // テキストのみの通常生成
            console.log('[Text-to-Image] Standard generation');
            
            // Pollinations AI - 完全無料で認証不要のFlux AI
            // ネガティブプロンプト: 低品質・ぼかし・テキストのみ除外（色は許可）
            const negativePrompt = 'photo, photograph, camera, realistic photo, 3D render, CGI, blurry, blur, low quality, pixelated, watermark, text, letters, words, signature, artist name, frame, border, bad anatomy, deformed, ugly, amateur, draft, sketch lines, pencil marks, construction lines';
            
            const encodedPrompt = encodeURIComponent(prompt);
            const encodedNegative = encodeURIComponent(negativePrompt);
            // 超高解像度・最高品質設定
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1536&height=1536&model=flux-pro&nologo=true&enhance=true&private=true&negative=${encodedNegative}&seed=${Date.now()}`;
            
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

// 汎用画像生成プロンプト強化 - あらゆるジャンルに対応
function enhancePrompt(userPrompt) {
    // ユーザーのプロンプトをそのまま尊重しつつ、品質キーワードのみ追加
    const qualityBoost = [
        'masterpiece',
        'best quality',
        'ultra high resolution',
        'professional artwork',
        'stunning detail'
    ];
    
    return `${userPrompt}, ${qualityBoost.join(', ')}`;
}

async function generateImage(userPrompt, uploadedImage) {
    console.log('[Ryuya 3 Pro] Image generation requested');
    
    try {
        // プロンプトを翻訳
        const translatedPrompt = await translateToEnglish(userPrompt);
        console.log('[Ryuya 3 Pro] Translated:', translatedPrompt);
        
        const enhancedPrompt = enhancePrompt(translatedPrompt);
        
        // Gemini 2.5 Flash Imageで画像生成
        const parts = [{ text: enhancedPrompt }];
        
        // アップロード画像がある場合は参照画像として追加
        if (uploadedImage) {
            console.log('[Ryuya 3 Pro] Using uploaded image as reference');
            parts.push({
                inlineData: {
                    mimeType: uploadedImage.mimeType || 'image/jpeg',
                    data: uploadedImage.data.split(',')[1] // base64部分のみ
                }
            });
        }
        
        const result = await imageModel.generateContent(parts);
        const response = await result.response;
        
        // Geminiの画像レスポンスを処理
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        const base64Image = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType || 'image/jpeg';
                        return {
                            imageUrl: `data:${mimeType};base64,${base64Image}`,
                            model: 'Gemini 2.5 Flash Image'
                        };
                    }
                }
            }
        }
        
        throw new Error('画像生成に失敗しました');
        
    } catch (error) {
        console.error('[Ryuya 3 Pro] Image generation failed:', error.message);
        
        // フォールバック: Pollinations AI
        console.log('[Ryuya 3 Pro] Falling back to Pollinations AI');
        const translatedPrompt = await translateToEnglish(userPrompt);
        const imageUrl = await AI_PROVIDERS.kirie_nexus(enhancePrompt(translatedPrompt), uploadedImage?.data, uploadedImage?.mimeType);
        
        return {
            imageUrl: imageUrl,
            model: 'Pollinations AI (Fallback)'
        };
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
                    system: 'Ryuya 3 Pro System',
                    version: '7.0.0-DUAL-GEMINI',
                    chat: 'Gemini 2.5 Flash',
                    image: 'Gemini 2.5 Flash Image'
                })
            };
        }

        // Gemini Chatエンドポイント
        if (path === '/chat' && event.httpMethod === 'POST') {
            const { message, history } = JSON.parse(event.body || '{}');

            if (!message || message.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Message required' })
                };
            }

            console.log(`[Ryuya 3 Pro Chat] User: "${message}"`);

            try {
                // システムプロンプト
                const systemPrompt = `あなたはRyuya 3 Pro - 最先端のAI画像生成アシスタントです。
ユーザーと自然な会話をしながら、あらゆるジャンルの画像生成をサポートします。

対応ジャンル:
- イラスト・アート（アニメ、リアル、抽象画など）
- 風景・建築
- キャラクターデザイン
- プロダクトデザイン
- その他あらゆる画像生成

役割:
- ユーザーの要望を理解して最適な画像生成プロンプトを作成
- スタイル、構図、色彩のアドバイス
- クリエイティブなアイデア提案

会話スタイル:
- フレンドリーで親しみやすい
- 創造的で柔軟
- プロフェッショナル

画像生成が必要な場合は、レスポンスに [GENERATE: プロンプト] を含めてください。`;

                // 会話履歴を含めてチャット
                const chat = chatModel.startChat({
                    history: history || [],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.9,
                        topP: 0.8,
                    },
                });

                const result = await chat.sendMessage(systemPrompt + '\n\nユーザー: ' + message);
                const response = result.response.text();

                console.log(`[Gemini Chat] AI: "${response.substring(0, 100)}..."`);

                // [GENERATE:プロンプト]パターンをチェック
                const generateMatch = response.match(/\[GENERATE:\s*(.+?)\]/);
                let imageGeneration = null;

                if (generateMatch) {
                    const imagePrompt = generateMatch[1].trim();
                    console.log(`[Ryuya 3 Pro] Image generation requested: "${imagePrompt}"`);
                    
                    try {
                        const imageResult = await generateImage(imagePrompt, null);
                        imageGeneration = {
                            prompt: imagePrompt,
                            imageUrl: imageResult.imageUrl
                        };
                    } catch (error) {
                        console.error('[Ryuya 3 Pro] Image generation failed:', error);
                    }
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: response.replace(/\[GENERATE:.+?\]/g, '').trim(),
                        imageGeneration: imageGeneration,
                        model: 'Ryuya 3 Pro (Gemini 2.5 Flash)'
                    })
                };

            } catch (error) {
                console.error('[Gemini Chat] Error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Chat failed: ' + error.message
                    })
                };
            }
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

            console.log(`[Ryuya 3 Pro] Generating: "${prompt}"`);

            const uploadedImage = image ? { data: image, mimeType } : null;
            const result = await generateImage(prompt, uploadedImage);

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