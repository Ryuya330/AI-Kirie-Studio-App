// --- Global State ---
let uploadedFile = null;

// --- DOM Element Cache ---
const ui = {
    tabText: document.getElementById('tab-text'),
    tabImage: document.getElementById('tab-image'),
    textModeContent: document.getElementById('text-mode-content'),
    imageModeContent: document.getElementById('image-mode-content'),
    promptInput: document.getElementById('prompt-input'),
    styleDropdown: document.getElementById('style-dropdown'),
    generateButton: document.getElementById('generate-button'),
    convertButton: document.getElementById('convert-button'),
    bananaButton: document.getElementById('banana-button'),
    imageUpload: document.getElementById('image-upload'),
    imageUploadLabel: document.getElementById('image-upload-label'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImageButton: document.getElementById('remove-image-button'),
    resultContainer: document.getElementById('result-container'),
    placeholder: document.getElementById('placeholder'),
    loader: document.getElementById('loader'),
    imageDisplay: document.getElementById('image-display'),
    errorMessage: document.getElementById('error-message'),
};

// --- Application Initialization ---
function initialize() {
    ui.tabText.addEventListener('click', () => switchTab('text'));
    ui.tabImage.addEventListener('click', () => switchTab('image'));
    ui.generateButton.addEventListener('click', handleGenerateClick);
    ui.convertButton.addEventListener('click', handleConvertClick);
    ui.bananaButton.addEventListener('click', handleBananaClick);
    ui.imageUpload.addEventListener('change', handleImageUpload);
    ui.removeImageButton.addEventListener('click', removeImage);
    setLoadingState(false); // Initialize button text
}

// --- Event Handlers ---
function switchTab(mode) {
    const isTextMode = mode === 'text';
    ui.tabText.classList.toggle('tab-active', isTextMode);
    ui.tabImage.classList.toggle('tab-active', !isTextMode);
    ui.textModeContent.classList.toggle('hidden', !isTextMode);
    ui.imageModeContent.classList.toggle('hidden', isTextMode);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError("ファイルサイズは5MBまでです。");
        event.target.value = '';
        return;
    }
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        ui.imagePreview.src = e.target.result;
        ui.imagePreviewContainer.classList.remove('hidden');
        ui.imageUploadLabel.classList.add('hidden');
        resetResultView();
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    uploadedFile = null;
    ui.imageUpload.value = '';
    ui.imagePreviewContainer.classList.add('hidden');
    ui.imageUploadLabel.classList.remove('hidden');
}

async function handleGenerateClick() {
    const userPrompt = ui.promptInput.value.trim();
    if (!userPrompt) {
        showError("イラストのテーマを入力してください。");
        return;
    }
    setLoadingState(true);
    const finalPrompt = buildTextPrompt(userPrompt, ui.styleDropdown.value);
    try {
        const base64Data = await callImagenAPI(finalPrompt);
        displayImage(base64Data, true);
    } catch (error) {
        handleApiError(error, "Text-to-Image Generation");
    } finally {
        setLoadingState(false);
    }
}

async function handleConvertClick() {
    if (!uploadedFile) {
        showError("画像をアップロードしてください。");
        return;
    }
    setLoadingState(true);
    const base64ImageData = await fileToBase64(uploadedFile);
    const finalPrompt = buildImagePrompt(ui.styleDropdown.value);
    try {
        const resultBase64 = await callNanobananaAPI(finalPrompt, base64ImageData, uploadedFile.type);
        displayImage(resultBase64, true);
    } catch (error) {
        handleApiError(error, "Image-to-Image Conversion");
    } finally {
        setLoadingState(false);
    }
}

async function handleBananaClick() {
    setLoadingState(true);
    try {
        const { imageUrl } = await callBananaAPI();
        displayImage(imageUrl, false);
    } catch (error) {
        handleApiError(error, "Special Generation");
    } finally {
        setLoadingState(false);
    }
}

// --- Prompt Engineering ---
function buildTextPrompt(prompt, style) {
    return `A masterpiece paper-cut art of "${prompt}". Style: ${getStyleKeywords(style)}. High detail, clean cuts, paper craft aesthetic.`;
}

function buildImagePrompt(style) {
    return `Inspired by the provided image, create a completely new paper-cut artwork. Do not trace or copy. Re-imagine the subject and composition in this specific paper-cut style: ${getStyleKeywords(style)}.`;
}

function getStyleKeywords(style) {
    switch (style) {
        case 'シンプル': return 'minimalist, flat design, few solid colors, clean cuts';
        case 'カラフル': return 'vibrant colors, multi-colored layered paper, graphic style';
        case 'ジオラマ風': return 'layered papercut diorama, 3D, depth, shadow box, volumetric lighting';
        case '影絵風': return 'silhouette style, single solid color paper, against a contrasting background, backlit';
        default: return 'layered paper, intricate details';
    }
}

// --- API Integration ---
async function callImagenAPI(prompt) {
    // Call our own backend server, not Google's directly.
    const backendUrl = '/api/generate-text'; // Vite will proxy this
    const payload = { prompt };

    const response = await fetchWithRetry(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.predictions?.[0]?.bytesBase64Encoded) return result.predictions[0].bytesBase64Encoded;
    throw new Error(result.message || "バックエンドサーバーから画像データが返されませんでした。");
}

async function callNanobananaAPI(prompt, base64ImageData, mimeType) {
    // Call our own backend server
    const backendUrl = '/api/generate-image'; // Vite will proxy this
    const payload = {
        prompt,
        base64ImageData,
        mimeType
    };
    const response = await fetchWithRetry(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return part.inlineData.data;
    throw new Error(result.message || "バックエンドサーバーから画像データが返されませんでした。");
}

async function callBananaAPI() {
    const backendUrl = '/api/generate-special';
    const response = await fetchWithRetry(backendUrl, { method: 'POST' });
    const result = await response.json();
    if (result.imageUrl) return result;
    throw new Error(result.message || "Special generation failed.");
}

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 && i < retries - 1) { // Rate limit handling
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
                    if (!response.ok) {
                        const errorBody = await response.text();
                        console.error("API Error Body:", errorBody);
                        throw new Error(`API Error ${response.status}`);
                    }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
        }
    }
}

// --- UI State Management & Utilities ---
function setLoadingState(isLoading) {
    [ui.generateButton, ui.convertButton, ui.bananaButton].forEach(btn => btn.disabled = isLoading);
    ui.errorMessage.textContent = '';
    const genBtnContent = ui.generateButton.querySelector('.btn-content');
    const convBtnContent = ui.convertButton.querySelector('.btn-content');
    const bananaBtnContent = ui.bananaButton.querySelector('.btn-content');
    
    if (isLoading) {
        resetResultView();
        ui.loader.classList.remove('hidden');
        genBtnContent.textContent = '生成中...';
        convBtnContent.textContent = '変換中...';
        bananaBtnContent.textContent = '生成中...';
    } else {
        genBtnContent.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>テキストから生成！`;
        convBtnContent.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M5 5l14 14M19 19v-5h-5"></path></svg>画像を切り絵化！`;
        bananaBtnContent.innerHTML = `🍌 Special Generation`;
    }
}

function displayImage(src, isBase64 = true) {
    ui.imageDisplay.src = isBase64 ? `data:image/png;base64,${src}` : src;
    ui.imageDisplay.classList.remove('hidden');
    ui.placeholder.classList.add('hidden');
    ui.loader.classList.add('hidden');
}

function resetResultView() {
    ui.imageDisplay.classList.add('hidden');
    ui.imageDisplay.src = '';
    ui.placeholder.classList.remove('hidden');
    ui.loader.classList.add('hidden');
    ui.errorMessage.textContent = '';
}

function showError(message) {
    ui.errorMessage.textContent = message;
    resetResultView();
}

function handleApiError(error, context) {
    console.error(`[${context}] API Error:`, error);
    showError("画像の生成に失敗しました。時間をおいて再試行してください。");
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', initialize);