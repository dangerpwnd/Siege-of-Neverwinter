/**
 * AIProviderService - Abstract base class for AI provider implementations.
 * All AI providers (ChatGPT, Claude) must implement this interface.
 */
class AIProviderService {
  /**
   * Send a message to the AI provider and get a response.
   * @param {Array<{role: string, content: string}>} messages - Conversation history
   * @param {string} systemPrompt - System prompt with campaign context
   * @param {string} apiKey - API key for the provider
   * @returns {Promise<string>} The AI response text
   */
  async sendMessage(messages, systemPrompt, apiKey) {
    throw new Error('sendMessage must be implemented by subclass');
  }

  /**
   * Validate that an API key is valid for this provider.
   * @param {string} apiKey - API key to validate
   * @returns {Promise<{valid: boolean, error?: string}>} Validation result
   */
  async validateApiKey(apiKey) {
    throw new Error('validateApiKey must be implemented by subclass');
  }

  /**
   * Get the provider name identifier.
   * @returns {string} Provider name (e.g., 'chatgpt', 'claude')
   */
  get name() {
    throw new Error('name getter must be implemented by subclass');
  }
}

module.exports = AIProviderService;
