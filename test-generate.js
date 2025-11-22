
async function testGenerate() {
    console.log('Testing NanoBanana Pro Generation...');
    const url = 'https://ai-kirie-studio-app.netlify.app/.netlify/functions/api/generate';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'A simple red apple, paper cut style',
                style: 'ultimate_kirie'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Generation Successful!');
            console.log('Model:', data.model);
            console.log('Style:', data.styleName);
            console.log('Image Data Length:', data.imageUrl.length);
            if (data.imageUrl.startsWith('data:image/jpeg;base64,')) {
                console.log('✅ Image format is correct (Base64 JPEG)');
            } else {
                console.log('❌ Unexpected image format');
            }
        } else {
            console.error('❌ Generation Failed:', data.error);
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

testGenerate();
