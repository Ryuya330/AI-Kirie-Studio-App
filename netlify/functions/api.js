import serverless from 'serverless-http';
import app from '../../server.js';

// ExpressアプリをNetlify Functionsで扱えるようにラップします
export const handler = serverless(app);
