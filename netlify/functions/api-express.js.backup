import serverless from 'serverless-http';
import app from '../../server.js';

// Netlify環境を設定
process.env.NETLIFY = 'true';

// ExpressアプリをNetlify Functionsで扱えるようにラップ
export const handler = serverless(app);
