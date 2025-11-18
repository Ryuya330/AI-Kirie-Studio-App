// ==================== グローバル状態 ====================
let currentImageUrl = null;
let uploadedImage = null;
let history = JSON.parse(localStorage.getItem('kirieHistory') || '[]');
let lang = localStorage.getItem('lang') || 'ja';

// ==================== 翻訳 ====================
const i18n = {
    ja: {
        title: 'AI切り絵スタジオ',
        subtitle: 'AIで切り絵アートを生成',
        promptLabel: 'プロンプト',
        promptPlaceholder: '例: 満月の夜の桜と黒猫',
        generate: '生成する',
        generating: '生成中...',
        styleClassic: 'クラシック',
        styleColorful: 'カラフル',
        style3d: '3Dレイヤー',
        styleMinimal: 'ミニマル',
        styleSilhouette: 'シルエット',
        uploadTab: '画像変換',
        uploadBtn: '画像を選択',
        convertBtn: '切り絵化する',
        converting: '変換中...',
        download: 'ダウンロード',
        history: '履歴',
        clearHistory: 'クリア',
        noHistory: '履歴なし',
        errorPrompt: 'プロンプトを入力してください',
        errorImage: '画像を選択してください',
        errorGen: '生成に失敗しました'
    },
    en: {
        title: 'AI Kirie Studio',
        subtitle: 'Create Paper-Cut Art with AI',
        promptLabel: 'Prompt',
        promptPlaceholder: 'e.g., Cherry blossoms and black cat under full moon',
        generate: 'Generate',
        generating: 'Generating...',
        styleClassic: 'Classic',
        styleColorful: 'Colorful',
        style3d: '3D Layers',
        styleMinimal: 'Minimal',
        styleSilhouette: 'Silhouette',
        uploadTab: 'Convert Image',
        uploadBtn: 'Select Image',
        convertBtn: 'Convert',
        converting: 'Converting...',
        download: 'Download',
        history: 'History',
        clearHistory: 'Clear',
        noHistory: 'No history',
        errorPrompt: 'Please enter a prompt',
        errorImage: 'Please select an image',
        errorGen: 'Generation failed'
    }
};

// ==================== DOM要素 ====================
const el = {
    promptInput: document.getElementById('prompt'),
    generateBtn: document.getElementById('generate-btn'),
    styleButtons: document.querySelectorAll('.style-btn'),
    uploadInput: document.getElementById('upload-input'),
    uploadBtn: document.getElementById('upload-btn'),
    uploadPreview: document.getElementById('upload-preview'),
    convertBtn: document.getElementById('convert-btn'),
    resultArea: document.getElementById('result'),
    resultImg: document.getElementById('result-img'),
    downloadBtn: document.getElementById('download-btn'),
    historyGrid: document.getElementById('history-grid'),
    clearHistoryBtn: document.getElementById('clear-history'),
    langSelector: document.getElementById('lang')
};

// ==================== 初期化 ====================
function init() {
    el.langSelector.value = lang;
    updateLang();
    renderHistory();
    
    // イベントリスナー
    el.generateBtn.addEventListener('click', handleGenerate);
    el.uploadBtn.addEventListener('click', () => el.uploadInput.click());
    el.uploadInput.addEventListener('change', handleUpload);
    el.convertBtn.addEventListener('click', handleConvert);
    el.downloadBtn.addEventListener('click', handleDownload);
    el.clearHistoryBtn.addEventListener('click', clearHistory);
    el.langSelector.addEventListener('change', (e) => {
        lang = e.target.value;
        localStorage.setItem('lang', lang);
        updateLang();
    });
    
    // スタイルボタン
    el.styleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            el.styleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Enter キー対応
    el.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    });
}

// ==================== 言語更新 ====================
function updateLang() {
    const t = i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
}

// ==================== テキストから生成 ====================
async function handleGenerate() {
    const prompt = el.promptInput.value.trim();
    
    if (!prompt) {
        showError(i18n[lang].errorPrompt);
        return;
    }
    
    const selectedStyle = document.querySelector('.style-btn.active')?.dataset.style || 'classic';
    
    setLoading(true, el.generateBtn, i18n[lang].generating);
    hideResult();
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, style: selectedStyle })
        });
        
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
            showResult(data.imageUrl);
            addToHistory(data.imageUrl, prompt, selectedStyle);
        } else {
            throw new Error(data.error || i18n[lang].errorGen);
        }
    } catch (error) {
        console.error('Generate error:', error);
        showError(error.message || i18n[lang].errorGen);
    } finally {
        setLoading(false, el.generateBtn, i18n[lang].generate);
    }
}

// ==================== 画像アップロード ====================
function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedImage = event.target.result;
        el.uploadPreview.src = uploadedImage;
        el.uploadPreview.classList.remove('hidden');
        el.convertBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

// ==================== 画像変換 ====================
async function handleConvert() {
    if (!uploadedImage) {
        showError(i18n[lang].errorImage);
        return;
    }
    
    setLoading(true, el.convertBtn, i18n[lang].converting);
    hideResult();
    
    try {
        const response = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: uploadedImage })
        });
        
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
            showResult(data.imageUrl);
            addToHistory(data.imageUrl, i18n[lang].uploadTab, 'convert');
            
            // リセット
            el.uploadPreview.classList.add('hidden');
            el.uploadInput.value = '';
            uploadedImage = null;
            el.convertBtn.disabled = true;
        } else {
            throw new Error(data.error || i18n[lang].errorGen);
        }
    } catch (error) {
        console.error('Convert error:', error);
        showError(error.message || i18n[lang].errorGen);
    } finally {
        setLoading(false, el.convertBtn, i18n[lang].convertBtn);
    }
}

// ==================== 結果表示 ====================
function showResult(imageUrl) {
    currentImageUrl = imageUrl;
    el.resultImg.src = imageUrl;
    el.resultArea.classList.remove('hidden');
    el.resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideResult() {
    el.resultArea.classList.add('hidden');
}

// ==================== ダウンロード ====================
function handleDownload() {
    if (!currentImageUrl) return;
    
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `kirie-${Date.now()}.png`;
    link.click();
}

// ==================== 履歴管理 ====================
function addToHistory(imageUrl, prompt, style) {
    history.unshift({ imageUrl, prompt, style, time: Date.now() });
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('kirieHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        el.historyGrid.innerHTML = `<p class="no-history" data-i18n="noHistory">${i18n[lang].noHistory}</p>`;
        el.clearHistoryBtn.classList.add('hidden');
        return;
    }
    
    el.clearHistoryBtn.classList.remove('hidden');
    el.historyGrid.innerHTML = history.map((item, i) => `
        <div class="history-item" onclick="showHistoryItem(${i})">
            <img src="${item.imageUrl}" alt="${item.prompt}" loading="lazy">
            <div class="history-info">
                <span class="history-style">${item.style}</span>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm(lang === 'ja' ? '履歴を削除しますか？' : 'Clear all history?')) {
        history = [];
        localStorage.setItem('kirieHistory', JSON.stringify(history));
        renderHistory();
    }
}

window.showHistoryItem = function(index) {
    const item = history[index];
    if (item) {
        showResult(item.imageUrl);
    }
};

// ==================== UI ヘルパー ====================
function setLoading(isLoading, button, text) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.textContent = text;
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = text;
    }
}

function showError(message) {
    // 簡易エラー表示
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

// ==================== 起動 ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
