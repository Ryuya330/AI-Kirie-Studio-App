// NanoBanana Pro Studio - Client Logic
// Powered by Gemini 3 Pro

const el = {
    prompt: document.getElementById('prompt'),
    generateBtn: document.getElementById('generate-btn'),
    styleCards: document.querySelectorAll('.style-card'),
    loader: document.getElementById('loader'),
    resultArea: document.getElementById('result-area'),
    resultImg: document.getElementById('result-img'),
    downloadBtn: document.getElementById('download-btn')
};

let currentStyle = 'ultimate_kirie';
let currentImageUrl = null;

// Initialize
function init() {
    // Style Selection
    el.styleCards.forEach(card => {
        card.addEventListener('click', () => {
            el.styleCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentStyle = card.dataset.style;
        });
    });

    // Generate Action
    el.generateBtn.addEventListener('click', handleGenerate);

    // Download Action
    el.downloadBtn.addEventListener('click', () => {
        if (currentImageUrl) {
            const link = document.createElement('a');
            link.href = currentImageUrl;
            link.download = `nanobanana-pro-${Date.now()}.jpg`;
            link.click();
        }
    });

    // Embed Mode Check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('embed') === 'true') {
        document.body.classList.add('embed-mode');
    }
}

async function handleGenerate() {
    const prompt = el.prompt.value.trim();
    if (!prompt) {
        alert('Please enter a creative prompt.');
        return;
    }

    setLoading(true);
    el.resultArea.style.display = 'none';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                style: currentStyle
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Generation failed');
        }

        // Apply Watermark (Client-side)
        const watermarkedUrl = await addWatermark(data.imageUrl);
        
        currentImageUrl = watermarkedUrl;
        el.resultImg.src = watermarkedUrl;
        el.resultImg.onload = () => {
            el.resultImg.style.opacity = '1';
        };
        
        el.resultArea.style.display = 'block';
        el.resultArea.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        alert('NanoBanana Pro System Error: ' + error.message);
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        el.generateBtn.disabled = true;
        el.generateBtn.textContent = 'PROCESSING...';
        el.loader.style.display = 'block';
    } else {
        el.generateBtn.disabled = false;
        el.generateBtn.textContent = 'INITIALIZE GENERATION';
        el.loader.style.display = 'none';
    }
}

// Watermark Logic (Ryuya Signature)
function addWatermark(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Pro Watermark Style
            const fontSize = Math.floor(img.width * 0.04);
            const margin = Math.floor(img.width * 0.03);
            
            ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
            ctx.textAlign = 'end';
            ctx.textBaseline = 'bottom';
            
            // Glow effect
            ctx.shadowColor = '#FFE135'; // NanoBanana Yellow
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText('Ryuya', img.width - margin, img.height - margin);
            
            try {
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch (e) {
                reject(e);
            }
        };
        
        img.onerror = (e) => {
            console.warn('Watermark skipped due to load error');
            resolve(url);
        };
        
        img.src = url;
    });
}

// Start
init();
