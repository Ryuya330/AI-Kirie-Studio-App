// Netlify Function for Ryuya 3 Pro API (CommonJS)
// Powered by Google Gemini 2.5 Flash & Gemini 2.5 Flash Image

const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Keys (Environment Variables)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAPrAjMeUl7hrfjx0fac0NcR0oB8zCFYDk';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ==================== Image Generation Logic ====================

async function generateImage(prompt, modelType, uploadedImage) {
    console.log(`[Image Gen] Requesting generation with model: ${modelType}`);

    // 1. Gemini 2.5 Flash Image
    if (modelType === 'gemini') {
        try {
            const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
            const parts = [{ text: prompt }];
            
            if (uploadedImage) {
                parts.push({
                    inlineData: {
                        mimeType: uploadedImage.mimeType || 'image/jpeg',
                        data: uploadedImage.data.split(',')[1]
                    }
                });
            }
            
            const result = await imageModel.generateContent(parts);
            const response = await result.response;
            
            if (response.candidates && response.candidates[0]) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData) {
                            return {
                                imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                                model: 'Gemini 2.5 Flash Image'
                            };
                        }
                    }
                }
            }
            throw new Error('No image data in Gemini response');
        } catch (error) {
            if (error.message.includes('429') || error.message.includes('Quota')) {
                throw new Error('Gemini Quota Exceeded. Please check billing in Google AI Studio.');
            }
            throw error;
        }
    }

    // 2. DALL-E 3 (OpenAI)
    if (modelType === 'dalle') {
        if (!OPENAI_API_KEY) throw new Error('OpenAI API Key is missing.');
        
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        return {
            imageUrl: `data:image/png;base64,${data.data[0].b64_json}`,
            model: 'DALL-E 3'
        };
    }

    // 3. Flux.1 (Pollinations - Free Fallback)
    if (modelType === 'flux') {
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true`;
        // Pollinations returns the image directly, so we return the URL
        return {
            imageUrl: url,
            model: 'Flux.1 (Pollinations)'
        };
    }

    throw new Error(`Unknown image model: ${modelType}`);
}

// ==================== Chat Logic ====================

async function chatWithAgent(agentType, message, history, systemPrompt, image) {
    console.log(`[Chat] Agent: ${agentType}`);

    // 1. Gemini
    if (agentType === 'gemini') {
        const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const chat = chatModel.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 1000 }
        });
        
        let parts = [systemPrompt + '\n\nUser: ' + message];
        if (image) {
            parts.push({ inlineData: { data: image, mimeType: 'image/jpeg' } }); // Simplified
        }
        
        const result = await chat.sendMessage(parts);
        return result.response.text();
    }

    // 2. GPT-4o
    if (agentType === 'gpt') {
        if (!OPENAI_API_KEY) throw new Error('OpenAI API Key is missing.');
        
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(h => ({ 
                role: h.role === 'model' ? 'assistant' : 'user', 
                content: h.parts[0].text 
            })),
            { role: "user", content: message }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: messages
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    }

    // 3. Claude 3.5 Sonnet
    if (agentType === 'claude') {
        if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API Key is missing.');
        
        // Anthropic API format is different, simplified here
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: systemPrompt,
                messages: [
                    ...history.map(h => ({ 
                        role: h.role === 'model' ? 'assistant' : 'user', 
                        content: h.parts[0].text 
                    })),
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.content[0].text;
    }

    // 4. Grok (xAI)
    if (agentType === 'grok') {
        if (!XAI_API_KEY) throw new Error('xAI API Key is missing.');
        
        // xAI is OpenAI compatible
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ];

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: messages
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    }

    throw new Error(`Unknown agent: ${agentType}`);
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
        if (path === '/chat' && event.httpMethod === 'POST') {
            const { message, history, image, mimeType, agent = 'gemini', imageModel = 'gemini' } = JSON.parse(event.body || '{}');

            if ((!message || message.trim() === '') && !image) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Message required' }) };
            }

            const systemPrompt = `あなたはRyuya AI - 最先端のAIアシスタントです。
現在のAgent: ${agent}
現在のImage Model: ${imageModel}

役割:
1. ユーザーの要望を深く理解する。
2. 画像生成が必要な場合、**英語プロンプト**を作成し、以下の形式で出力する。
[GENERATE: <English Prompt>]

会話スタイル: フレンドリー、創造的、プロフェッショナル。`;

            // Chat with selected Agent
            let responseText;
            try {
                responseText = await chatWithAgent(agent, message, history, systemPrompt, image);
            } catch (err) {
                console.error('Chat Error:', err);
                return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: `Agent Error (${agent}): ${err.message}` }) };
            }

            // Check for generation command
            const generateMatch = responseText.match(/\[GENERATE:\s*(.+?)\]/);
            let imageGeneration = null;

            if (generateMatch) {
                const imagePrompt = generateMatch[1].trim();
                try {
                    const uploadedImage = image ? { data: image, mimeType } : null;
                    const imageResult = await generateImage(imagePrompt, imageModel, uploadedImage);
                    
                    imageGeneration = {
                        prompt: imagePrompt,
                        imageUrl: imageResult.imageUrl,
                        model: imageResult.model
                    };
                } catch (error) {
                    console.error('Image Gen Error:', error);
                    responseText += `\n\n(画像生成エラー: ${error.message})`;
                }
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: responseText.replace(/\[GENERATE:.+?\]/g, '').trim(),
                    imageGeneration: imageGeneration,
                    agent: agent,
                    model: imageModel
                })
            };
        }

        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

    } catch (error) {
        console.error('System Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
};