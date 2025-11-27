/**
 * AI Assistant Component
 * Integrates with ChatGPT API for DM assistance
 */

import api from './api.js';
import state from './state.js';

class AIAssistant {
    constructor() {
        this.container = document.getElementById('ai-content');
        this.conversationHistory = [];
        this.apiKey = null;
        this.isProcessing = false;
        this.init();
    }

    init() {
        // Load API key from localStorage
        this.apiKey = localStorage.getItem('openai_api_key');
        
        this.render();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            // Update context when game state changes
            if (newState.siegeState !== oldState.siegeState ||
                newState.combatants !== oldState.combatants) {
                // Context has changed, could update system prompt
            }
        });
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
     * Send message to ChatGPT API
     */
    async sendMessage(userMessage) {
        if (!this.apiKey) {
            alert('Please configure your OpenAI API key first');
            this.showApiKeyDialog();
            return;
        }

        if (!userMessage || userMessage.trim() === '') {
            return;
        }

        this.isProcessing = true;
        
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        this.render();

        try {
            const response = await this.callChatGPT(userMessage);
            
            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });
            
            this.isProcessing = false;
            this.render();
        } catch (error) {
            console.error('Failed to get AI response:', error);
            
            // Add error message to history
            this.conversationHistory.push({
                role: 'assistant',
                content: `Error: ${error.message}. Please check your API key and try again.`
            });
            
            this.isProcessing = false;
            this.render();
        }
    }

    /**
     * Call ChatGPT API
     */
    async callChatGPT(userMessage) {
        const messages = [
            {
                role: 'system',
                content: this.getSystemPrompt()
            },
            ...this.conversationHistory
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                presence_penalty: 0.3,
                frequency_penalty: 0.3
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait and try again.');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from API');
        }

        return data.choices[0].message.content;
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
        const currentKey = this.apiKey || '';
        const maskedKey = currentKey ? `${currentKey.substring(0, 7)}...${currentKey.substring(currentKey.length - 4)}` : 'Not set';
        
        const newKey = prompt(`Enter your OpenAI API key:\n\nCurrent key: ${maskedKey}\n\nLeave blank to keep current key.`);
        
        if (newKey && newKey.trim()) {
            this.apiKey = newKey.trim();
            localStorage.setItem('openai_api_key', this.apiKey);
            alert('API key saved successfully');
        }
    }

    /**
     * Format message for display
     */
    formatMessage(message) {
        // Simple markdown-like formatting
        let formatted = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n/g, '<br>'); // Line breaks
        
        return formatted;
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
                ${this.conversationHistory.map((msg, index) => `
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
                ${!hasApiKey ? `
                    <div class="api-key-warning">
                        <p>⚠️ OpenAI API key not configured</p>
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

        // Add event listeners
        this.setupEventListeners();
        
        // Scroll to bottom of conversation
        const conversation = this.container.querySelector('.conversation-history');
        if (conversation) {
            conversation.scrollTop = conversation.scrollHeight;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
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
