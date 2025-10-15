const serverless = require('serverless-http');
const app = require('../../server'); // 2つ上の階層にあるserver.jsをインポート

// ExpressアプリをNetlify Functionsで扱えるようにラップします
module.exports.handler = serverless(app);
