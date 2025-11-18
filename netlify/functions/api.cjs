const serverless = require('serverless-http');

// Netlify環境を設定
process.env.NETLIFY = 'true';

// 動的インポート
let handler;

exports.handler = async (event, context) => {
    if (!handler) {
        const { default: app } = await import('../../server.js');
        handler = serverless(app);
    }
    return handler(event, context);
};
