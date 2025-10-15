const serverless = require('serverless-http');
const app = require('../../server'); // 修正したserver.jsをインポート

// ExpressアプリをNetlify Functionsで扱えるようにラップします
module.exports.handler = serverless(app);