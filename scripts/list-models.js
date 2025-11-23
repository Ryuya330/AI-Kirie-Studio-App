const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use the same key as in api.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDxguoJUmZr6dez44CbUgU06klGKci22sI';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
  try {
    // Note: The SDK doesn't have a direct listModels method exposed easily in the main client sometimes,
    // but we can try to use the model to generate content and see if it works, 
    // OR use the raw fetch to list models.
    
    console.log("Checking key:", GEMINI_API_KEY.substring(0, 10) + "...");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    
    if (!response.ok) {
        console.error("List Models Failed:", response.status, await response.text());
        return;
    }
    
    const data = await response.json();
    console.log("Available Models:");
    data.models.forEach(m => {
        console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();