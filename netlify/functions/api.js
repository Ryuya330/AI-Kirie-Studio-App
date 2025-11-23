// Netlify Function for Ryuya 3 Pro API (CommonJS)
// Powered by Google Gemini 2.5 Flash & Gemini 2.5 Flash Image

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Google Gemini API設定（環境変数から取得）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAPrAjMeUl7hrfjx0fac0NcR0oB8zCFYDk';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

// ==================== Gemini Core Logic ====================

async function generateImage(userPrompt, uploadedImage) {
    console.log('[Ryuya 3 Pro] Image generation requested');
    
    try {
        // Gemini 2.5 Flash Imageで画像生成
        // プロンプトはChatモデルによって既に最適化された英語プロンプトが渡される前提
        const parts = [{ text: userPrompt }];
        
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
        
        throw new Error('No image data in response');
        
    } catch (error) {
        console.error('[Ryuya 3 Pro] Image generation failed:', error.message);
        
        // クォータエラーのハンドリング
        if (error.message.includes('429') || error.message.includes('Quota')) {
            throw new Error('画像生成の利用制限(Quota)に達しました。しばらく待ってから再試行するか、プランを確認してください。(Model: Gemini 2.5 Flash Image)');
        }
        
        throw new Error(`画像生成に失敗しました: ${error.message}`);
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
                    version: '7.1.0-GEMINI-ONLY',
                    chat: 'Gemini 2.5 Flash',
                    image: 'Gemini 2.5 Flash Image'
                })
            };
        }

        // Gemini Chatエンドポイント
        if (path === '/chat' && event.httpMethod === 'POST') {
            const { message, history, image, mimeType } = JSON.parse(event.body || '{}');

            if ((!message || message.trim() === '') && !image) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Message or image required' })
                };
            }

            console.log(`[Ryuya 3 Pro Chat] User: "${message}" (Image: ${!!image})`);

            try {
                // システムプロンプト
                const systemPrompt = `あなたはRyuya 3 Pro - 最先端のAI画像生成アシスタントです。
ユーザーと自然な会話をしながら、あらゆるジャンルの画像生成をサポートします。

役割:
1. ユーザーの要望を深く理解する（文脈、雰囲気、スタイル）。
2. 画像生成が必要な場合、**画像生成モデルに渡すための最適な英語プロンプト**を作成する。
3. 会話はユーザーの言語（主に日本語）で行う。

重要: 画像生成を行う場合は、レスポンスの最後に必ず以下の形式でコマンドを含めてください。
[GENERATE: <ここに詳細な英語プロンプト>]

プロンプト作成のコツ:
- 具体的で描写的にする (例: "A futuristic city at sunset, cyberpunk style, neon lights, high detail, 8k resolution")
- 品質向上キーワードを含める (masterpiece, best quality, photorealistic など)
- ユーザーの意図を汲み取って補完する

会話スタイル:
- フレンドリーで親しみやすい
- 創造的で柔軟
- プロフェッショナル

ユーザーが画像をアップロードした場合、その画像を参考に新しい画像を生成したり、画像についてコメントしたりしてください。`;

                // 会話履歴を含めてチャット
                const chat = chatModel.startChat({
                    history: history || [],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.9,
                        topP: 0.8,
                    },
                });

                // メッセージパーツの構築
                let messageParts = [];
                if (message) {
                    messageParts.push(systemPrompt + '\n\nユーザー: ' + message);
                } else {
                    messageParts.push(systemPrompt + '\n\nユーザー: (画像を送信しました)');
                }

                // 画像がある場合は追加
                if (image && mimeType) {
                    messageParts.push({
                        inlineData: {
                            data: image,
                            mimeType: mimeType
                        }
                    });
                }

                const result = await chat.sendMessage(messageParts);
                const response = result.response.text();

                console.log(`[Gemini Chat] AI: "${response.substring(0, 100)}..."`);

                // [GENERATE:プロンプト]パターンをチェック
                const generateMatch = response.match(/\[GENERATE:\s*(.+?)\]/);
                let imageGeneration = null;

                if (generateMatch) {
                    const imagePrompt = generateMatch[1].trim();
                    console.log(`[Ryuya 3 Pro] Image generation requested: "${imagePrompt}"`);
                    
                    try {
                        // アップロードされた画像がある場合は、画像生成にも使用する
                        const uploadedImage = image ? { data: image, mimeType } : null;
                        const imageResult = await generateImage(imagePrompt, uploadedImage);
                        
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

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        console.error('[Ryuya 3 Pro Error]:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Ryuya 3 Pro System Error' 
            })
        };
    }
};