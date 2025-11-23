const { handler } = require('../netlify/functions/api');

async function test() {
    console.log('=== Multi-Model Test ===');

    // 1. Test Chat (Gemini)
    console.log('\n1. Testing Chat (Agent: Gemini)...');
    const chatEvent = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
            message: 'Hello',
            agent: 'gemini',
            imageModel: 'flux'
        })
    };
    
    try {
        const response = await handler(chatEvent, {});
        const body = JSON.parse(response.body);
        if (body.success) {
            console.log('✅ Chat Success:', body.message.substring(0, 50) + '...');
        } else {
            console.error('❌ Chat Failed:', body.error);
        }
    } catch (e) {
        console.error('❌ Chat Exception:', e.message);
    }

    // 2. Test Image Generation Trigger (Gemini -> Flux)
    console.log('\n2. Testing Image Generation Trigger (Gemini -> Flux)...');
    const genEvent = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
            message: 'Generate an image of a red apple',
            agent: 'gemini',
            imageModel: 'flux'
        })
    };

    try {
        const response = await handler(genEvent, {});
        const body = JSON.parse(response.body);
        
        if (body.success) {
            console.log('✅ Chat Response:', body.message.substring(0, 50) + '...');
            if (body.imageGeneration) {
                console.log('✅ Image Generation Success!');
                console.log('   Model:', body.imageGeneration.model);
                console.log('   URL:', body.imageGeneration.imageUrl.substring(0, 50) + '...');
            } else {
                console.warn('⚠️ No image generation triggered. The model might not have outputted [GENERATE: ...]');
                console.log('   Full Response:', body.message);
            }
        } else {
            console.error('❌ Generation Failed:', body.error);
        }
    } catch (e) {
        console.error('❌ Generation Exception:', e.message);
    }
}

test();