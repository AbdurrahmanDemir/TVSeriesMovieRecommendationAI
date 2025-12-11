/**
 * AI Chat Component
 * Provides an interactive chat interface for AI-powered recommendations
 */

import geminiAPI from '../api/gemini.js';

class AIChat {
    constructor() {
        this.chatHistory = [];
        this.isOpen = false;
        this.context = {};
    }

    /**
     * Initialize chat interface
     */
    init() {
        this.createChatUI();
        this.attachEventListeners();
    }

    /**
     * Create chat UI elements
     */
    createChatUI() {
        const chatHTML = `
            <div id="aiChatContainer" class="ai-chat-container hidden">
                <div class="ai-chat-header">
                    <div class="ai-chat-title">
                        <span class="ai-icon">🤖</span>
                        <span>AI Film Asistanı</span>
                    </div>
                    <button id="closeChatBtn" class="close-chat-btn">×</button>
                </div>
                <div id="chatMessages" class="chat-messages">
                    <div class="chat-message ai-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            Merhaba! Ben senin AI film asistanınım. Film ve dizi önerileri, karşılaştırmalar ve analizler hakkında sorularını yanıtlayabilirim. Nasıl yardımcı olabilirim?
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <input 
                        type="text" 
                        id="chatInput" 
                        class="chat-input" 
                        placeholder="Bir soru sor veya yorum yaz..."
                    />
                    <button id="sendChatBtn" class="send-chat-btn">
                        <span>📤</span>
                    </button>
                </div>
                <div class="chat-quick-actions">
                    <button class="quick-action-btn" data-action="mood">🎭 Ruh Halime Göre Öner</button>
                    <button class="quick-action-btn" data-action="compare">⚖️ İki İçeriği Karşılaştır</button>
                    <button class="quick-action-btn" data-action="surprise">🎲 Beni Şaşırt</button>
                </div>
            </div>

            <button id="openChatBtn" class="floating-chat-btn">
                <span class="chat-icon">💬</span>
                <span class="chat-badge">AI</span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const openBtn = document.getElementById('openChatBtn');
        const closeBtn = document.getElementById('closeChatBtn');
        const sendBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');

        openBtn.addEventListener('click', () => this.openChat());
        closeBtn.addEventListener('click', () => this.closeChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
        });
    }

    /**
     * Open chat
     */
    openChat() {
        const container = document.getElementById('aiChatContainer');
        container.classList.remove('hidden');
        this.isOpen = true;

        // Check if API key is set
        if (!geminiAPI.hasApiKey()) {
            this.showApiKeyPrompt();
        }
    }

    /**
     * Close chat
     */
    closeChat() {
        const container = document.getElementById('aiChatContainer');
        container.classList.add('hidden');
        this.isOpen = false;
    }

    /**
     * Show API key prompt
     */
    showApiKeyPrompt() {
        const apiKey = prompt(
            '🔑 Google Gemini API Key Gerekli\n\n' +
            'AI özelliklerini kullanmak için Google Gemini API key\'inizi girin.\n\n' +
            'API key almak için: https://makersuite.google.com/app/apikey\n\n' +
            'Not: API key\'iniz tarayıcınızda saklanır ve sadece sizin cihazınızdan kullanılır.'
        );

        if (apiKey && apiKey.trim()) {
            geminiAPI.setApiKey(apiKey.trim());
            this.addAIMessage('✅ API key başarıyla kaydedildi! Artık AI özelliklerini kullanabilirsiniz.');
        } else {
            this.addAIMessage('⚠️ API key girilmedi. AI özellikleri çalışmayacak. Ayarlardan API key ekleyebilirsiniz.');
        }
    }

    /**
     * Send message
     */
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addUserMessage(message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response
            const response = await geminiAPI.chat(message, this.context);
            this.removeTypingIndicator();
            this.addAIMessage(response);
        } catch (error) {
            this.removeTypingIndicator();
            this.addAIMessage('❌ Üzgünüm, bir hata oluştu: ' + error.message);
        }
    }

    /**
     * Handle quick actions
     */
    async handleQuickAction(action) {
        switch (action) {
            case 'mood':
                this.showMoodSelector();
                break;
            case 'compare':
                this.addAIMessage('İki içeriği karşılaştırmak için önce bir film veya dizi seçin, ardından detay sayfasında "Karşılaştır" butonuna tıklayın.');
                break;
            case 'surprise':
                this.addUserMessage('Beni şaşırt! 🎲');
                this.showTypingIndicator();
                try {
                    const response = await geminiAPI.chat(
                        'Bana beklenmedik, az bilinen ama harika bir film veya dizi öner. Neden önerdiğini de açıkla.',
                        this.context
                    );
                    this.removeTypingIndicator();
                    this.addAIMessage(response);
                } catch (error) {
                    this.removeTypingIndicator();
                    this.addAIMessage('❌ Hata: ' + error.message);
                }
                break;
        }
    }

    /**
     * Show mood selector
     */
    showMoodSelector() {
        const moods = [
            { id: 'happy', emoji: '😊', label: 'Mutlu' },
            { id: 'sad', emoji: '😢', label: 'Üzgün' },
            { id: 'excited', emoji: '🤩', label: 'Heyecanlı' },
            { id: 'relaxed', emoji: '😌', label: 'Rahat' },
            { id: 'thoughtful', emoji: '🤔', label: 'Düşünceli' },
            { id: 'romantic', emoji: '💕', label: 'Romantik' }
        ];

        const moodHTML = `
            <div class="mood-selector">
                <p>Şu anda nasıl hissediyorsun?</p>
                <div class="mood-grid">
                    ${moods.map(mood => `
                        <button class="mood-btn" data-mood="${mood.id}">
                            <span class="mood-emoji">${mood.emoji}</span>
                            <span class="mood-label">${mood.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.insertAdjacentHTML('beforeend', moodHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add click listeners
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleMoodSelection(btn.dataset.mood));
        });
    }

    /**
     * Handle mood selection
     */
    async handleMoodSelection(mood) {
        // Remove mood selector
        document.querySelector('.mood-selector')?.remove();

        const moodLabels = {
            happy: 'Mutlu 😊',
            sad: 'Üzgün 😢',
            excited: 'Heyecanlı 🤩',
            relaxed: 'Rahat 😌',
            thoughtful: 'Düşünceli 🤔',
            romantic: 'Romantik 💕'
        };

        this.addUserMessage(`Ruh halim: ${moodLabels[mood]}`);
        this.addAIMessage('Harika! Ruh haline göre öneriler hazırlıyorum... Bu özellik ana uygulamaya entegre edilecek.');
    }

    /**
     * Add user message
     */
    addUserMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageHTML = `
            <div class="chat-message user-message">
                <div class="message-avatar">👤</div>
                <div class="message-content">${this.escapeHtml(message)}</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.chatHistory.push({ role: 'user', content: message });
    }

    /**
     * Add AI message
     */
    addAIMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageHTML = `
            <div class="chat-message ai-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">${this.escapeHtml(message)}</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.chatHistory.push({ role: 'ai', content: message });
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingHTML = `
            <div class="chat-message ai-message typing-indicator">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator() {
        document.querySelector('.typing-indicator')?.remove();
    }

    /**
     * Set context
     */
    setContext(context) {
        this.context = context;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export singleton instance
const aiChat = new AIChat();
export default aiChat;
