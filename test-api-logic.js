
const STYLE_CONFIGS = {
    traditional: {
        ai: 'gemini',
        name: '伝統切り絵',
        prompt: (text) => `${text}, masterpiece, traditional japanese kirie paper cut style, intricate details, black paper on white background`
    },
    modern: {
        ai: 'nanobanana',
        name: 'カラフルモダン',
        prompt: (text) => `${text}, masterpiece, modern colorful paper cut art, vibrant colors, pop art style, matisse influence, clean edges`
    }
};

function testPrompt(style, input) {
    const config = STYLE_CONFIGS[style];
    const p = config.prompt(input);
    console.log(`[${style}] Input: "${input}" -> Prompt: "${p}"`);
}

testPrompt('traditional', 'cat');
testPrompt('modern', 'cityscape');

console.log("API Logic Test Complete");
