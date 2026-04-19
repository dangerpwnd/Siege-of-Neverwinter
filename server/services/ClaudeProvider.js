/**
 * ClaudeProvider - Anthropic Claude implementation of AIProviderService.
 * Sends messages to the Anthropic Messages API.
 * Includes retry logic with exponential backoff for transient errors.
 */
const AIProviderService = require('./AIProviderService');

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 500;
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

class ClaudeProvider extends AIProviderService {
  get name() {
    return 'claude';
  }

  /**
   * Determine if an error is transient and should be retried.
   */
  _isRetryableError(error) {
    if (error.name === 'AbortError') return true;
    if (error.message && error.message.includes('rate limit')) return true;
    if (error.message && error.message.includes('overloaded')) return true;
    if (error.statusCode === 429 || error.statusCode === 529) return true;
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
   * Make a single API request to the Anthropic Claude API.
   * @returns {Promise<string>} The response text
   * @throws {Error} With statusCode property for HTTP errors
   */
  async _makeRequest(messages, systemPrompt, apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(ANTHROPIC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: DEFAULT_MAX_TOKENS,
          system: systemPrompt,
          messages: messages
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        if (response.status === 401) {
          throw new Error('Invalid Anthropic API key');
        }
        if (response.status === 429) {
          const err = new Error('Claude rate limit exceeded. Please wait and try again, or switch to ChatGPT.');
          err.statusCode = 429;
          throw err;
        }
        if (response.status === 529) {
          const err = new Error('Claude API is overloaded. Please try again later or switch to ChatGPT.');
          err.statusCode = 529;
          throw err;
        }
        throw new Error(`Claude API error (${response.status}): ${errorBody || 'Unknown error'}`);
      }

      const data = await response.json();
      if (!data.content || data.content.length === 0) {
        throw new Error('No response from Claude API');
      }

      return data.content[0].text;
    } catch (error) {
      if (error.name === 'AbortError') {
        const err = new Error('Claude API request timed out. Please try again or switch to ChatGPT.');
        err.name = 'AbortError';
        throw err;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Send a message to the Anthropic Claude API with retry logic.
   * Retries up to MAX_RETRIES times with exponential backoff for transient errors
   * (429 rate limit, 529 overloaded, timeouts).
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
   * Validate an Anthropic API key by making a minimal messages request.
   */
  async validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch(ANTHROPIC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });

      if (response.ok || response.status === 200) {
        return { valid: true };
      }

      if (response.status === 401) {
        return { valid: false, error: 'Invalid Anthropic API key' };
      }

      // A 400 with a valid key structure still means the key format is accepted
      // Other 2xx or even some 4xx (like 400 for bad request) can indicate a valid key
      if (response.status === 400) {
        return { valid: true };
      }

      return { valid: false, error: `Anthropic API returned status ${response.status}` };
    } catch (error) {
      return { valid: false, error: `Failed to validate key: ${error.message}` };
    }
  }
}

module.exports = ClaudeProvider;
