
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 環境変数またはハードコードされたキー（テスト用）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAPrAjMeUl7hrfjx0fac0NcR0oB8zCFYDk';

async function testConnection() {
    console.log('=== Gemini 2.5 Connection Test ===');
    console.log('API Key Length:', GEMINI_API_KEY.length);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 1. Test Chat Model (Gemini 2.5 Flash)
    console.log('\nTesting Chat Model: gemini-2.5-flash ...');
    try {
        const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await chatModel.generateContent('Hello, are you active?');
        const response = await result.response;
        console.log('✅ Chat Model Success:', response.text());
    } catch (error) {
        console.error('❌ Chat Model Failed:', error.message);
        if (error.message.includes('404') || error.message.includes('not found')) {
            console.log('   -> Hint: The model name "gemini-2.5-flash" might be incorrect. Try "gemini-1.5-flash".');
        }
    }

    // 2. Test Image Model (Gemini 2.5 Flash Image)
    console.log('\nTesting Image Model: gemini-2.5-flash-image ...');
    try {
        const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
        // Note: Image generation requires specific prompt handling, but we just check model existence here
        // Usually image models are accessed via specific methods or might not support generateContent with text only in the same way
        // But for "flash-image", let's try a simple prompt.
        const result = await imageModel.generateContent('A simple red circle');
        const response = await result.response;
        console.log('✅ Image Model Success (Response received)');
    } catch (error) {
        console.error('❌ Image Model Failed:', error.message);
        if (error.message.includes('404') || error.message.includes('not found')) {
            console.log('   -> Hint: The model name "gemini-2.5-flash-image" might be incorrect.');
        }
    }
}

testConnection();
