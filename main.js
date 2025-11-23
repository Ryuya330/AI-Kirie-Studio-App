// Kirie Studio AI Chat - Client Logic
// Powered by Google Gemini 2.0 Flash

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

// サジェスチョンチップのクリック
document.addEventListener('click', (e) => {
    if (e.target.closest('.suggestion-chip')) {
        const prompt = e.target.closest('.suggestion-chip').dataset.prompt;
        chatInput.value = prompt;
        chatInput.focus();
    }
});

// メッセージ送信
sendBtn.addEventListener('click', () => sendMessage());
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 自動リサイズ
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // ユーザーメッセージを表示
    addMessage(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // ボタン無効化
    sendBtn.disabled = true;

    // タイピングインジケーター表示
    const typingDiv = addTypingIndicator();

    try {
        // APIに送信
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: conversationHistory
            })
        });

        const data = await response.json();

        // タイピングインジケーター削除
        typingDiv.remove();

        if (data.success) {
            // AIメッセージを表示
            addMessage(data.message, 'ai', data.imageGeneration);

            // 履歴に追加
            conversationHistory.push({
                role: 'user',
                parts: [{ text: message }]
            });
            conversationHistory.push({
                role: 'model',
                parts: [{ text: data.message }]
            });

        } else {
            addMessage('エラーが発生しました: ' + data.error, 'ai');
        }

    } catch (error) {
        typingDiv.remove();
        addMessage('通信エラーが発生しました。もう一度お試しください。', 'ai');
        console.error('Chat error:', error);
    }

    // ボタン有効化
    sendBtn.disabled = false;
    chatInput.focus();
}

function addMessage(text, sender, imageGeneration = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    
    // テキストを段落に分割
    const paragraphs = text.split('\n').filter(p => p.trim());
    paragraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.textContent = p;
        textDiv.appendChild(pEl);
    });

    content.appendChild(textDiv);

    // 画像生成がある場合
    if (imageGeneration) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'message-image';
        
        const img = document.createElement('img');
        img.src = imageGeneration.imageUrl;
        img.alt = imageGeneration.prompt;
        
        imageWrapper.appendChild(img);
        content.appendChild(imageWrapper);

        // アクションボタン
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'message-action-btn';
        downloadBtn.textContent = '💾 ダウンロード';
        downloadBtn.onclick = () => downloadImage(imageGeneration.imageUrl);
        
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'message-action-btn';
        regenerateBtn.textContent = '🔄 再生成';
        regenerateBtn.onclick = () => {
            chatInput.value = imageGeneration.prompt;
            sendMessage();
        };
        
        actions.appendChild(downloadBtn);
        actions.appendChild(regenerateBtn);
        content.appendChild(actions);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

    content.appendChild(textDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

function downloadImage(dataUrl) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `kirie-art-${Date.now()}.jpg`;
    link.click();
}

// ページロード時のウェルカムメッセージアニメーション
window.addEventListener('load', () => {
    const firstMessage = document.querySelector('.ai-message');
    if (firstMessage) {
        firstMessage.style.opacity = '0';
        firstMessage.style.transform = 'translateY(20px)';
        setTimeout(() => {
            firstMessage.style.transition = 'all 0.5s ease';
            firstMessage.style.opacity = '1';
            firstMessage.style.transform = 'translateY(0)';
        }, 300);
    }
});
