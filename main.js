// --- Global State ---
let uploadedFile = null;
let currentImageUrl = null;
let imageHistory = JSON.parse(localStorage.getItem('kirieHistory') || '[]');
let currentLang = localStorage.getItem('language') || 'ja';
let currentTheme = localStorage.getItem('theme') || 'light';

// --- Translations ---
const translations = {
    ja: {
        title: 'AI Kirie Studio',
        subtitle: 'あなたのアイデアや画像を、美しい切り絵風イラストに',
        specialGeneration: 'スペシャル生成',
        textToImage: 'テキストから作成',
        imageToImage: '画像から作成',
        promptPlaceholder: 'イラストのテーマ (例: 月夜の桜と、眠る黒猫)',
        generateButton: 'テキストから生成！',
        convertButton: '画像を切り絵化！',
        uploadClick: 'クリック or ドラッグ&ドロップ',
        uploadFormat: 'PNG, JPG, WEBP (5MBまで)',
        styleExamples: 'スタイル例（プロンプトに追加）',
        styleMinimalist: '🎨 ミニマル',
        styleColorful: '🌈 カラフル',
        styleDiorama: '📦 ジオラマ',
        styleSilhouette: '🌑 シルエット',
        styleHint: '💡 クリックでスタイルキーワードを追加、または自由に記述！',
        errorNoPrompt: 'プロンプトを入力してください',
        errorNoImage: '画像をアップロードしてください',
        resultPlaceholder: 'ここに生成された画像が表示されます',
        generating: '生成中...',
        converting: '変換中...',
        history: '生成履歴',
        clearHistory: '履歴を消去',
        noHistory: 'まだ履歴はありません。作成を開始しましょう！',
        download: 'ダウンロード'
    },
    en: {
        title: 'AI Kirie Studio',
        subtitle: 'Transform your ideas and images into beautiful paper-cut art',
        specialGeneration: 'Special Generation',
        textToImage: 'Text to Image',
        imageToImage: 'Image to Image',
        promptPlaceholder: 'Describe your artwork (e.g., Cherry blossoms under moonlight with a sleeping black cat)',
        generateButton: 'Generate from Text!',
        convertButton: 'Transform to Paper-Cut!',
        uploadClick: 'Click or Drag & Drop',
        uploadFormat: 'PNG, JPG, WEBP (Max 5MB)',
        styleExamples: 'Style Examples (Add to your prompt)',
        styleMinimalist: '🎨 Minimalist',
        styleColorful: '🌈 Colorful',
        styleDiorama: '📦 Diorama',
        styleSilhouette: '🌑 Silhouette',
        styleHint: '💡 Click to add style keywords, or write your own!',
        errorNoPrompt: 'Please enter a description',
        errorNoImage: 'Please upload an image',
        resultPlaceholder: 'Your masterpiece will appear here',
        generating: 'Generating...',
        converting: 'Converting...',
        history: 'Generation History',
        clearHistory: 'Clear All',
        noHistory: 'No history yet. Start creating!',
        download: 'Download'
    },
    zh: {
        title: 'AI 剪纸工作室',
        subtitle: '将您的想法和图像转换为美丽的剪纸艺术',
        specialGeneration: '特殊生成',
        textToImage: '文字转图像',
        imageToImage: '图像转图像',
        promptPlaceholder: '描述您的作品（例如：月光下的樱花和睡着的黑猫）',
        generateButton: '从文字生成！',
        convertButton: '转换为剪纸！',
        uploadClick: '点击或拖放',
        uploadFormat: 'PNG, JPG, WEBP (最大5MB)',
        styleExamples: '风格示例（添加到提示）',
        styleMinimalist: '🎨 极简',
        styleColorful: '🌈 多彩',
        styleDiorama: '📦 立体',
        styleSilhouette: '🌑 剪影',
        styleHint: '💡 点击添加风格关键词，或自由描述！',
        errorNoPrompt: '请输入描述',
        errorNoImage: '请上传图像',
        resultPlaceholder: '您的杰作将在这里显示',
        generating: '生成中...',
        converting: '转换中...',
        history: '生成历史',
        clearHistory: '清除全部',
        noHistory: '还没有历史记录。开始创作吧！',
        download: '下载'
    },
    ko: {
        title: 'AI 종이 공예 스튜디오',
        subtitle: '아이디어와 이미지를 아름다운 종이 공예로 변환',
        specialGeneration: '특별 생성',
        textToImage: '텍스트에서 이미지',
        imageToImage: '이미지에서 이미지',
        promptPlaceholder: '작품 설명 (예: 달빛 아래 벚꽃과 잠자는 검은 고양이)',
        generateButton: '텍스트에서 생성!',
        convertButton: '종이 공예로 변환!',
        uploadClick: '클릭 또는 드래그 앤 드롭',
        uploadFormat: 'PNG, JPG, WEBP (최대 5MB)',
        styleExamples: '스타일 예시 (프롬프트에 추가)',
        styleMinimalist: '🎨 미니멀',
        styleColorful: '🌈 컬러풀',
        styleDiorama: '📦 디오라마',
        styleSilhouette: '🌑 실루엣',
        styleHint: '💡 클릭하여 스타일 키워드 추가, 또는 자유롭게 작성!',
        errorNoPrompt: '설명을 입력하세요',
        errorNoImage: '이미지를 업로드하세요',
        resultPlaceholder: '여기에 걸작이 표시됩니다',
        generating: '생성 중...',
        converting: '변환 중...',
        history: '생성 기록',
        clearHistory: '모두 지우기',
        noHistory: '아직 기록이 없습니다. 제작을 시작하세요!',
        download: '다운로드'
    }
};

// --- DOM Element Cache ---
const ui = {
    tabText: document.getElementById('tab-text'),
    tabImage: document.getElementById('tab-image'),
    textModeContent: document.getElementById('text-mode-content'),
    imageModeContent: document.getElementById('image-mode-content'),
    promptInput: document.getElementById('prompt-input'),
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
    resultActions: document.getElementById('result-actions'),
    downloadButton: document.getElementById('download-button'),
    historyGrid: document.getElementById('history-grid'),
    historyPlaceholder: document.getElementById('history-placeholder'),
    clearHistoryButton: document.getElementById('clear-history-button'),
    languageSelector: document.getElementById('language-selector'),
    themeToggle: document.getElementById('theme-toggle'),
};

// --- Application Initialization ---
function initialize() {
    // Initialize theme
    initializeTheme();
    
    // Initialize language
    initializeLanguage();
    
    // Event listeners
    ui.tabText.addEventListener('click', () => switchTab('text'));
    ui.tabImage.addEventListener('click', () => switchTab('image'));
    ui.generateButton.addEventListener('click', handleGenerateClick);
    ui.convertButton.addEventListener('click', handleConvertClick);
    ui.bananaButton.addEventListener('click', handleBananaClick);
    ui.imageUpload.addEventListener('change', handleImageUpload);
    ui.removeImageButton.addEventListener('click', removeImage);
    ui.downloadButton.addEventListener('click', handleDownload);
    ui.clearHistoryButton.addEventListener('click', clearHistory);
    ui.languageSelector.addEventListener('change', handleLanguageChange);
    ui.themeToggle.addEventListener('click', toggleTheme);
    
    // Style example buttons
    document.querySelectorAll('.style-example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.getAttribute('data-style');
            const currentPrompt = ui.promptInput.value.trim();
            if (currentPrompt) {
                ui.promptInput.value = `${currentPrompt}, ${style}`;
            } else {
                ui.promptInput.value = style;
            }
            ui.promptInput.focus();
        });
    });
    
    setLoadingState(false);
    renderHistory();
}

// --- Theme Management ---
function initializeTheme() {
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// --- Language Management ---
function initializeLanguage() {
    ui.languageSelector.value = currentLang;
    updateLanguage();
}

function handleLanguageChange(event) {
    currentLang = event.target.value;
    localStorage.setItem('language', currentLang);
    updateLanguage();
}

function updateLanguage() {
    const t = translations[currentLang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            element.placeholder = t[key];
        }
    });
    
    // Update button texts
    updateButtonTexts();
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
    if (file.size > 5 * 1024 * 1024) {
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
        const t = translations[currentLang];
        showError(t.errorNoPrompt || "Please enter a description.");
        return;
    }
    setLoadingState(true);
    const finalPrompt = buildTextPrompt(userPrompt);
    try {
        const result = await callTextAPI(finalPrompt);
        if (result.success) {
            displayImage(result.imageUrl, false);
            addToHistory(result.imageUrl, userPrompt, 'text');
        } else {
            throw new Error(result.message || '生成に失敗しました');
        }
    } catch (error) {
        handleApiError(error, "テキストから画像生成");
    } finally {
        setLoadingState(false);
    }
}

async function handleConvertClick() {
    if (!uploadedFile) {
        const t = translations[currentLang];
        showError(t.errorNoImage || "Please upload an image.");
        return;
    }
    setLoadingState(true);
    const base64ImageData = await fileToBase64(uploadedFile);
    const userPrompt = ui.promptInput.value.trim(); // オプションで追加スタイル指定可能
    const finalPrompt = buildImagePrompt(userPrompt);
    try {
        const result = await callImageAPI(finalPrompt, base64ImageData, uploadedFile.type);
        if (result.success) {
            displayImage(result.imageUrl, false);
            addToHistory(result.imageUrl, '画像から変換', 'image');
        } else {
            throw new Error(result.message || '変換に失敗しました');
        }
    } catch (error) {
        handleApiError(error, "画像から画像変換");
    } finally {
        setLoadingState(false);
    }
}

async function handleBananaClick() {
    setLoadingState(true);
    try {
        const result = await callSpecialAPI();
        if (result.success) {
            displayImage(result.imageUrl, false);
            addToHistory(result.imageUrl, 'バナナスペシャル', 'special');
        } else {
            throw new Error(result.message || '生成に失敗しました');
        }
    } catch (error) {
        handleApiError(error, "スペシャル生成");
    } finally {
        setLoadingState(false);
    }
}

function handleDownload() {
    if (!currentImageUrl) return;
    
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `kirie-art-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Prompt Engineering ---
function buildTextPrompt(userPrompt) {
    // ユーザーのプロンプトに切り絵の基本要素を追加
    return `${userPrompt}, paper cut art style, kirigami, layered paper craft, high contrast, sharp edges, professional paper cutting, masterpiece quality, highly detailed, 8k`;
}

function buildImagePrompt(userPrompt = '') {
    // 画像変換用の基本プロンプト
    const basePrompt = 'Transform this image into paper cut art style, kirigami aesthetic, layered paper craft';
    return userPrompt ? `${basePrompt}, ${userPrompt}, highly detailed, masterpiece quality` : `${basePrompt}, highly detailed, masterpiece quality`;
}

// --- API Integration ---
async function callTextAPI(prompt) {
    const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
}

async function callImageAPI(prompt, base64ImageData, mimeType) {
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, base64ImageData, mimeType })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
}

async function callSpecialAPI() {
    const response = await fetch('/api/generate-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
}

// --- UI State Management & Utilities ---
function setLoadingState(isLoading) {
    [ui.generateButton, ui.convertButton, ui.bananaButton].forEach(btn => btn.disabled = isLoading);
    ui.errorMessage.textContent = '';
    
    const t = translations[currentLang];
    const genBtnContent = ui.generateButton.querySelector('.btn-content');
    const convBtnContent = ui.convertButton.querySelector('.btn-content');
    const bananaBtnContent = ui.bananaButton.querySelector('.btn-content');
    
    if (isLoading) {
        resetResultView();
        ui.loader.classList.remove('hidden');
        genBtnContent.textContent = t.generating;
        convBtnContent.textContent = t.converting;
        bananaBtnContent.textContent = t.generating;
    } else {
        updateButtonTexts();
    }
}

function updateButtonTexts() {
    const t = translations[currentLang];
    const genBtnContent = ui.generateButton.querySelector('.btn-content');
    const convBtnContent = ui.convertButton.querySelector('.btn-content');
    
    genBtnContent.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>${t.generateButton}`;
    convBtnContent.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M5 5l14 14M19 19v-5h-5"></path></svg>${t.convertButton}`;
}

function displayImage(imageUrl, isBase64 = false) {
    currentImageUrl = imageUrl;
    ui.imageDisplay.src = isBase64 ? `data:image/png;base64,${imageUrl}` : imageUrl;
    ui.imageDisplay.classList.remove('hidden');
    ui.placeholder.classList.add('hidden');
    ui.loader.classList.add('hidden');
    ui.resultActions.classList.remove('hidden');
}

function resetResultView() {
    ui.imageDisplay.classList.add('hidden');
    ui.imageDisplay.src = '';
    ui.placeholder.classList.remove('hidden');
    ui.loader.classList.add('hidden');
    ui.resultActions.classList.add('hidden');
    ui.errorMessage.textContent = '';
}

function showError(message) {
    ui.errorMessage.textContent = message;
    resetResultView();
}

function handleApiError(error, context) {
    console.error(`[${context}] API Error:`, error);
    showError(`${context}に失敗しました: ${error.message}`);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// --- History Management ---
function addToHistory(imageUrl, prompt, type) {
    const historyItem = {
        imageUrl,
        prompt,
        type,
        timestamp: Date.now()
    };
    
    imageHistory.unshift(historyItem);
    
    // 最大20件まで保存
    if (imageHistory.length > 20) {
        imageHistory = imageHistory.slice(0, 20);
    }
    
    localStorage.setItem('kirieHistory', JSON.stringify(imageHistory));
    renderHistory();
}

function renderHistory() {
    if (imageHistory.length === 0) {
        ui.historyPlaceholder.classList.remove('hidden');
        ui.clearHistoryButton.classList.add('hidden');
        ui.historyGrid.innerHTML = '';
        return;
    }
    
    ui.historyPlaceholder.classList.add('hidden');
    ui.clearHistoryButton.classList.remove('hidden');
    
    ui.historyGrid.innerHTML = imageHistory.map((item, index) => `
        <div class="history-item cursor-pointer hover:opacity-75 transition-opacity" data-index="${index}">
            <img src="${item.imageUrl}" alt="${item.prompt}" class="w-full h-24 object-cover rounded-lg border border-gray-300">
        </div>
    `).join('');
    
    // 履歴アイテムのクリックイベント
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const historyItem = imageHistory[index];
            displayImage(historyItem.imageUrl, false);
        });
    });
}

function clearHistory() {
    if (confirm('履歴を全て削除しますか?')) {
        imageHistory = [];
        localStorage.removeItem('kirieHistory');
        renderHistory();
    }
}

// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', initialize);