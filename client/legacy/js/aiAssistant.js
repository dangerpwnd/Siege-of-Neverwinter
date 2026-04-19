/**
 * AI Assistant Component
 * Integrates with ChatGPT and Claude APIs for DM assistance
 */

import api from './api.js';
import state from './state.js';

const PROVIDERS = {
    openai: {
        name: 'OpenAI (GPT-4)',
        keyName: 'openai_api_key',
        keyPrefix: 'sk-',
        endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    anthropic: {
        name: 'Anthropic (Claude)',
        keyName: 'anthropic_api_key',
        keyPrefix: 'sk-ant-',
        endpoint: 'https://api.anthropic.com/v1/messages'
    }
};

class AIAssistant {
    constructor() {
        this.container = document.getElementById('ai-content');
        this.conversationHistory = [];
        this.isProcessing = false;
        this.provider = localStorage.getItem('ai_provider') || 'openai';
        this.apiKeys = {
            openai: localStorage.getItem('openai_api_key'),
            anthropic: localStorage.getItem('anthropic_api_key')
        };
        this.init();
    }

    init() {
        this.render();

        state.subscribe((newState, oldState) => {
            if (newState.siegeState !== oldState.siegeState ||
                newState.combatants !== oldState.combatants) {
                // Context has changed, could update system prompt
            }
        });
    }

    /**
     * Get the current API key for the active provider
     */
    get apiKey() {
        return this.apiKeys[this.provider];
    }

    /**
     * Set provider and persist choice
     */
    setProvider(provider) {
        if (PROVIDERS[provider]) {
            this.provider = provider;
            localStorage.setItem('ai_provider', provider);
            this.render();
        }
    }

    /**
     * Get system prompt with campaign context
     */
    getSystemPrompt() {
        const siegeState = state.get('siegeState');
        const combatants = state.get('combatants');

        let contextInfo = '';

        if (siegeState) {
            contextInfo += `\nCurrent Siege Status:
- Day ${siegeState.day_of_siege} of the siege
- Wall Integrity: ${siegeState.wall_integrity}%
- Defender Morale: ${siegeState.defender_morale}%
- Supplies: ${siegeState.supplies}%`;
        }

        if (combatants && combatants.length > 0) {
            const activeCombatants = combatants.filter(c => c.current_hp > 0);
            contextInfo += `\n\nActive Combatants: ${activeCombatants.length}`;
            contextInfo += `\n- PCs: ${activeCombatants.filter(c => c.type === 'PC').length}`;
            contextInfo += `\n- NPCs: ${activeCombatants.filter(c => c.type === 'NPC').length}`;
            contextInfo += `\n- Monsters: ${activeCombatants.filter(c => c.type === 'Monster').length}`;
        }

        return `You are an experienced Dungeon Master running a D&D 5th edition campaign. 
The party of 5 adventurers is currently defending Neverwinter during a siege 
by the forces of Tiamat. Your role is to provide:

1. Narrative descriptions that enhance the siege atmosphere
2. Mechanical rulings consistent with D&D 5e rules
3. Tactical suggestions for both players and enemies
4. Descriptions of siege events and their consequences

Maintain a tone that is dramatic but not overwhelming, helpful but not 
hand-holding. The siege is desperate but not hopeless. Focus on making 
the players feel like heroes defending their city.
${contextInfo}

Provide concise, actionable responses that help the DM run an engaging game.`;
    }

    /**
     * Send message to the active AI provider
     */
    async sendMessage(userMessage) {
        if (!this.apiKey) {
            alert(`Please configure your ${PROVIDERS[this.provider].name} API key first`);
            this.showApiKeyDialog();
            return;
        }

        if (!userMessage || userMessage.trim() === '') {
            return;
        }

        this.isProcessing = true;

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        this.render();

        try {
            const response = this.provider === 'anthropic'
                ? await this.callClaude(userMessage)
                : await this.callChatGPT(userMessage);

            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

            this.isProcessing = false;
            this.render();
        } catch (error) {
            console.error('Failed to get AI response:', error);

            this.conversationHistory.push({
                role: 'assistant',
                content: `Error: ${error.message}. Please check your API key and try again.`
            });

            this.isProcessing = false;
            this.render();
        }
    }

    /**
     * Call OpenAI ChatGPT API
     */
    async callChatGPT(userMessage) {
        const messages = [
            { role: 'system', content: this.getSystemPrompt() },
            ...this.conversationHistory
        ];

        const response = await fetch(PROVIDERS.openai.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKeys.openai}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages,
                temperature: 0.7,
                max_tokens: 500,
                presence_penalty: 0.3,
                frequency_penalty: 0.3
            })
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error('Invalid API key');
            if (response.status === 429) throw new Error('Rate limit exceeded. Please wait and try again.');
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from API');
        }
        return data.choices[0].message.content;
    }

    /**
     * Call Anthropic Claude API
     */
    async callClaude(userMessage) {
        // Claude uses a separate system param and expects alternating user/assistant messages
        const messages = this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const response = await fetch(PROVIDERS.anthropic.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKeys.anthropic,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                system: this.getSystemPrompt(),
                messages
            })
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error('Invalid API key');
            if (response.status === 429) throw new Error('Rate limit exceeded. Please wait and try again.');
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.content || data.content.length === 0) {
            throw new Error('No response from API');
        }
        return data.content[0].text;
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        if (confirm('Clear conversation history?')) {
            this.conversationHistory = [];
            this.render();
        }
    }

    /**
     * Show API key configuration dialog
     */
    showApiKeyDialog() {
        const providerConfig = PROVIDERS[this.provider];
        const currentKey = this.apiKeys[this.provider] || '';
        const maskedKey = currentKey
            ? `${currentKey.substring(0, 7)}...${currentKey.substring(currentKey.length - 4)}`
            : 'Not set';

        const newKey = prompt(
            `Enter your ${providerConfig.name} API key:\n\nCurrent key: ${maskedKey}\n\nLeave blank to keep current key.`
        );

        if (newKey && newKey.trim()) {
            this.apiKeys[this.provider] = newKey.trim();
            localStorage.setItem(providerConfig.keyName, newKey.trim());
            alert('API key saved successfully');
            this.render();
        }
    }

    /**
     * Format message for display
     */
    formatMessage(message) {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Render conversation history
     */
    renderConversation() {
        if (this.conversationHistory.length === 0) {
            return `
                <div class="conversation-empty">
                    <p>No messages yet. Ask the AI DM Assistant for help!</p>
                    <p class="hint">Try asking about:</p>
                    <ul>
                        <li>Siege event ideas</li>
                        <li>D&D 5e rule clarifications</li>
                        <li>Tactical suggestions</li>
                        <li>Narrative descriptions</li>
                    </ul>
                </div>
            `;
        }

        return `
            <div class="conversation-history">
                ${this.conversationHistory.map(msg => `
                    <div class="message ${msg.role}">
                        <div class="message-header">
                            <span class="message-role">${msg.role === 'user' ? 'You' : 'AI DM'}</span>
                        </div>
                        <div class="message-content">${this.formatMessage(msg.content)}</div>
                    </div>
                `).join('')}
                ${this.isProcessing ? `
                    <div class="message assistant processing">
                        <div class="message-header">
                            <span class="message-role">AI DM</span>
                        </div>
                        <div class="message-content">
                            <div class="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render the AI assistant component
     */
    render() {
        const hasApiKey = !!this.apiKey;

        this.container.innerHTML = `
            <div class="ai-assistant">
                <div class="provider-selector">
                    <label for="ai-provider-select">AI Provider:</label>
                    <select id="ai-provider-select">
                        ${Object.entries(PROVIDERS).map(([key, p]) => `
                            <option value="${key}" ${this.provider === key ? 'selected' : ''}>
                                ${p.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                ${!hasApiKey ? `
                    <div class="api-key-warning">
                        <p>⚠️ ${PROVIDERS[this.provider].name} API key not configured</p>
                        <button class="btn btn-primary" data-action="configure-api-key">Configure API Key</button>
                    </div>
                ` : ''}

                ${this.renderConversation()}

                <div class="message-input">
                    <textarea
                        id="ai-message-input"
                        placeholder="Ask the AI DM Assistant..."
                        rows="3"
                        ${!hasApiKey || this.isProcessing ? 'disabled' : ''}
                    ></textarea>
                    <div class="input-controls">
                        <button
                            class="btn btn-primary"
                            data-action="send-message"
                            ${!hasApiKey || this.isProcessing ? 'disabled' : ''}
                        >
                            Send
                        </button>
                        <button
                            class="btn btn-secondary"
                            data-action="clear-history"
                            ${this.conversationHistory.length === 0 ? 'disabled' : ''}
                        >
                            Clear History
                        </button>
                        <button
                            class="btn btn-secondary"
                            data-action="configure-api-key"
                        >
                            ${hasApiKey ? 'Change' : 'Set'} API Key
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();

        const conversation = this.container.querySelector('.conversation-history');
        if (conversation) {
            conversation.scrollTop = conversation.scrollHeight;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Provider selector
        const providerSelect = this.container.querySelector('#ai-provider-select');
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.setProvider(e.target.value);
            });
        }

        // Send message button
        const sendBtn = this.container.querySelector('[data-action="send-message"]');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const input = document.getElementById('ai-message-input');
                if (input && input.value.trim()) {
                    this.sendMessage(input.value.trim());
                    input.value = '';
                }
            });
        }

        // Clear history button
        const clearBtn = this.container.querySelector('[data-action="clear-history"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHistory());
        }

        // Configure API key buttons
        const configBtns = this.container.querySelectorAll('[data-action="configure-api-key"]');
        configBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showApiKeyDialog());
        });

        // Enter key to send (Shift+Enter for new line)
        const input = document.getElementById('ai-message-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.value.trim() && !this.isProcessing && this.apiKey) {
                        this.sendMessage(input.value.trim());
                        input.value = '';
                    }
                }
            });
        }
    }
}

// Export singleton instance
export default new AIAssistant();
