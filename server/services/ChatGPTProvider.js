/**
 * ChatGPTProvider - OpenAI ChatGPT implementation of AIProviderService.
 * Sends messages to the OpenAI Chat Completions API.
 * Includes retry logic with exponential backoff for transient errors.
 */
const AIProviderService = require('./AIProviderService');

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 500;
const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

class ChatGPTProvider extends AIProviderService {
  get name() {
    return 'chatgpt';
  }

  /**
   * Determine if an error is transient and should be retried.
   */
  _isRetryableError(error) {
    if (error.name === 'AbortError') return true;
    if (error.message && error.message.includes('rate limit')) return true;
    if (error.statusCode === 429) return true;
    return false;
  }

  /**
   * Calculate delay for exponential backoff with jitter.
   * @param {number} attempt - The retry attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  _getBackoffDelay(attempt) {
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    // Add jitter: ±25% of the delay
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a single API request to the OpenAI ChatGPT API.
   * @returns {Promise<string>} The response text
   * @throws {Error} With statusCode property for HTTP errors
   */
  async _makeRequest(messages, systemPrompt, apiKey) {
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: apiMessages,
          temperature: DEFAULT_TEMPERATURE,
          max_tokens: DEFAULT_MAX_TOKENS
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key');
        }
        if (response.status === 429) {
          const err = new Error('OpenAI rate limit exceeded. Please wait and try again, or switch to Claude.');
          err.statusCode = 429;
          throw err;
        }
        throw new Error(`OpenAI API error (${response.status}): ${errorBody || 'Unknown error'}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error.name === 'AbortError') {
        const err = new Error('OpenAI API request timed out. Please try again or switch to Claude.');
        err.name = 'AbortError';
        throw err;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Send a message to the OpenAI ChatGPT API with retry logic.
   * Retries up to MAX_RETRIES times with exponential backoff for transient errors
   * (429 rate limit, timeouts).
   * Non-retryable errors (401, other errors) are thrown immediately.
   */
  async sendMessage(messages, systemPrompt, apiKey) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this._makeRequest(messages, systemPrompt, apiKey);
      } catch (error) {
        lastError = error;

        // Don't retry non-transient errors
        if (!this._isRetryableError(error)) {
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < MAX_RETRIES) {
          const delay = this._getBackoffDelay(attempt);
          await this._sleep(delay);
        }
      }
    }

    // All retries exhausted, throw the last error
    throw lastError;
  }

  /**
   * Validate an OpenAI API key by making a lightweight models list request.
   */
  async validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 401) {
        return { valid: false, error: 'Invalid OpenAI API key' };
      }

      return { valid: false, error: `OpenAI API returned status ${response.status}` };
    } catch (error) {
      return { valid: false, error: `Failed to validate key: ${error.message}` };
    }
  }
}

module.exports = ChatGPTProvider;
