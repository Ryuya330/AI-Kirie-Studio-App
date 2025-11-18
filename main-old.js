// Global State
let currentImageUrl = null;
let uploadedImageData = null;
let imageHistory = JSON.parse(localStorage.getItem('kirieHistory') || '[]');
let currentLang = localStorage.getItem('language') || 'ja';

// Translations
const translations = {
    ja: {
        promptPlaceholder: '作品を描写してください (例: 満月の夜の桜と黒猫)',
        generateButton: 'アートワークを生成',
        imageToKirie: '画像を切り絵化',
        uploadImage: '画像をアップロード',
        uploadHint: 'PNG, JPG, WEBP',
        convertToKirie: '切り絵化する',
        converting: '変換中...',
        resultPlaceholder: 'ここにあなたの作品が表示されます',
        generating: '生成中...',
        history: '最近の作品',
        clearHistory: 'クリア',
        noHistory: 'まだ作品がありません',
        download: 'ダウンロード',
        errorNoPrompt: 'プロンプトを入力してください',
        errorNoImage: '画像をアップロードしてください'
    },
    en: {
        promptPlaceholder: 'Describe your artwork',
        generateButton: 'Generate Artwork',
        imageToKirie: 'Convert Image to Paper-Cut',
        uploadImage: 'Upload Image',
        uploadHint: 'PNG, JPG, WEBP',
        convertToKirie: 'Convert to Paper-Cut',
        converting: 'Converting...',
        resultPlaceholder: 'Your artwork will appear here',
        generating: 'Generating...',
        history: 'Recent Creations',
        clearHistory: 'Clear',
        noHistory: 'No creations yet',
        download: 'Download',
        errorNoPrompt: 'Please enter a prompt',
        errorNoImage: 'Please upload an image'
    },
    zh: {
        promptPlaceholder: '描述您的作品',
        generateButton: '生成艺术品',
        imageToKirie: '将图像转换为剪纸',
        uploadImage: '上传图像',
        uploadHint: 'PNG, JPG, WEBP',
        convertToKirie: '转换为剪纸',
        converting: '转换中...',
        resultPlaceholder: '您的作品将显示在这里',
        generating: '生成中...',
        history: '最近作品',
        clearHistory: '清除',
        noHistory: '还没有作品',
        download: '下载',
        errorNoPrompt: '请输入提示',
        errorNoImage: '请上传图像'
    },
    ko: {
        promptPlaceholder: '작품 설명',
        generateButton: '작품 생성',
        imageToKirie: '이미지를 종이공예로 변환',
        uploadImage: '이미지 업로드',
        uploadHint: 'PNG, JPG, WEBP',
        convertToKirie: '종이공예로 변환',
        converting: '변환 중...',
        resultPlaceholder: '여기에 작품이 표시됩니다',
        generating: '생성 중...',
        history: '최근 작품',
        clearHistory: '지우기',
        noHistory: '아직 작품이 없습니다',
        download: '다운로드',
        errorNoPrompt: '프롬프트를 입력하세요',
        errorNoImage: '이미지를 업로드하세요'
    }
};

const ui = {
    promptInput: document.getElementById('prompt-input'),
    generateButton: document.getElementById('generate-button'),
    imageUpload: document.getElementById('image-upload'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImage: document.getElementById('remove-image'),
    convertButton: document.getElementById('convert-button'),
    placeholder: document.getElementById('placeholder'),
    loader: document.getElementById('loader'),
    imageDisplay: document.getElementById('image-display'),
    errorMessage: document.getElementById('error-message'),
    resultActions: document.getElementById('result-actions'),
    downloadButton: document.getElementById('download-button'),
    historyGrid: document.getElementById('history-grid'),
    historyPlaceholder: document.getElementById('history-placeholder'),
    clearHistoryButton: document.getElementById('clear-history-button'),
    languageSelector: document.getElementById('language-selector')
};

function initialize() {
    ui.languageSelector.value = currentLang;
    updateTranslations();
    
    ui.generateButton.addEventListener('click', handleGenerate);
    ui.imageUpload.addEventListener('change', handleImageUpload);
    ui.removeImage.addEventListener('click', removeUploadedImage);
    ui.convertButton.addEventListener('click', handleConvert);
    ui.downloadButton.addEventListener('click', handleDownload);
    ui.clearHistoryButton.addEventListener('click', clearHistory);
    ui.languageSelector.addEventListener('change', () => {
        currentLang = ui.languageSelector.value;
        localStorage.setItem('language', currentLang);
        updateTranslations();
    });
    
    document.querySelectorAll('.style-example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.getAttribute('data-style');
            const current = ui.promptInput.value.trim();
            ui.promptInput.value = current ? `${current}, ${style}` : style;
        });
    });
    
    ui.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGenerate();
    });
    
    renderHistory();
}

function updateTranslations() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
}

async function handleGenerate() {
    const prompt = ui.promptInput.value.trim();
    if (!prompt) {
        ui.errorMessage.textContent = translations[currentLang].errorNoPrompt;
        setTimeout(() => ui.errorMessage.textContent = '', 3000);
        return;
    }

    const enhancedPrompt = `${prompt}, paper cut art style, kirigami, layered paper craft, high contrast, sharp edges, professional paper cutting, masterpiece quality, highly detailed`;
    
    ui.placeholder.classList.add('hidden');
    ui.imageDisplay.classList.add('hidden');
    ui.loader.classList.remove('hidden');
    ui.generateButton.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: enhancedPrompt })
        });

        const data = await response.json();
        
        if (data.success && data.imageUrl) {
            currentImageUrl = data.imageUrl;
            ui.imageDisplay.src = data.imageUrl;
            ui.imageDisplay.classList.remove('hidden');
            ui.resultActions.classList.remove('hidden');
            
            imageHistory.unshift({ imageUrl: data.imageUrl, prompt, timestamp: Date.now() });
            if (imageHistory.length > 50) imageHistory = imageHistory.slice(0, 50);
            localStorage.setItem('kirieHistory', JSON.stringify(imageHistory));
            renderHistory();
        } else {
            throw new Error(data.message || 'Generation failed');
        }
    } catch (error) {
        console.error(error);
        ui.errorMessage.textContent = error.message || 'エラーが発生しました';
        ui.placeholder.classList.remove('hidden');
    } finally {
        ui.loader.classList.add('hidden');
        ui.generateButton.disabled = false;
    }
}

function renderHistory() {
    if (imageHistory.length === 0) {
        ui.historyGrid.classList.add('hidden');
        ui.historyPlaceholder.classList.remove('hidden');
        ui.clearHistoryButton.classList.add('hidden');
    } else {
        ui.historyGrid.classList.remove('hidden');
        ui.historyPlaceholder.classList.add('hidden');
        ui.clearHistoryButton.classList.remove('hidden');
        
        ui.historyGrid.innerHTML = imageHistory.map(entry => `
            <div class="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:scale-105 hover:border-primary/50 transition-all duration-300" onclick="document.getElementById('image-display').src='${entry.imageUrl}';document.getElementById('image-display').classList.remove('hidden');document.getElementById('placeholder').classList.add('hidden');document.getElementById('result-actions').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})">
                <img src="${entry.imageUrl}" alt="${entry.prompt}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p class="text-xs text-white/80 line-clamp-2">${entry.prompt}</p>
                </div>
            </div>
        `).join('');
    }
}

function clearHistory() {
    if (confirm(currentLang === 'ja' ? '履歴を削除しますか？' : 'Clear all history?')) {
        imageHistory = [];
        localStorage.setItem('kirieHistory', JSON.stringify(imageHistory));
        renderHistory();
    }
}

function handleDownload() {
    if (!currentImageUrl) return;
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `kirie-art-${Date.now()}.png`;
    link.click();
}

// Image Upload Handlers
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert(translations[currentLang].errorNoImage);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedImageData = {
            base64: event.target.result,
            mimeType: file.type
        };
        ui.imagePreview.src = event.target.result;
        ui.imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeUploadedImage() {
    uploadedImageData = null;
    ui.imageUpload.value = '';
    ui.imagePreview.src = '';
    ui.imagePreviewContainer.classList.add('hidden');
}

async function handleConvert() {
    if (!uploadedImageData) {
        alert(translations[currentLang].errorNoImage);
        return;
    }
    
    ui.placeholder.classList.add('hidden');
    ui.imageDisplay.classList.add('hidden');
    ui.loader.classList.remove('hidden');
    ui.convertButton.disabled = true;
    ui.convertButton.textContent = translations[currentLang].converting;
    
    try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                base64ImageData: uploadedImageData.base64,
                mimeType: uploadedImageData.mimeType
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
            currentImageUrl = data.imageUrl;
            ui.imageDisplay.src = data.imageUrl;
            ui.imageDisplay.classList.remove('hidden');
            ui.resultActions.classList.remove('hidden');
            
            imageHistory.unshift({ 
                imageUrl: data.imageUrl, 
                prompt: translations[currentLang].imageToKirie, 
                timestamp: Date.now() 
            });
            if (imageHistory.length > 50) imageHistory = imageHistory.slice(0, 50);
            localStorage.setItem('kirieHistory', JSON.stringify(imageHistory));
            renderHistory();
            
            removeUploadedImage();
        } else {
            throw new Error(data.message || 'Conversion failed');
        }
    } catch (error) {
        console.error(error);
        ui.errorMessage.textContent = error.message || 'エラーが発生しました';
        ui.placeholder.classList.remove('hidden');
    } finally {
        ui.loader.classList.add('hidden');
        ui.convertButton.disabled = false;
        ui.convertButton.textContent = translations[currentLang].convertToKirie;
    }
}

initialize();
