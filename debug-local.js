
const { handler } = require('./netlify/functions/api.js');

async function run() {
    const event = {
        httpMethod: 'POST',
        path: '/generate',
        body: JSON.stringify({
            prompt: 'test',
            style: 'ultimate_kirie'
        })
    };
    
    const context = {};
    
    try {
        const result = await handler(event, context);
        console.log('Status:', result.statusCode);
        console.log('Body:', result.body);
    } catch (e) {
        console.error('Local Run Error:', e);
    }
}

run();
