/**
 * Unit Tests for AI Provider Error Handling and Retry Logic
 * Tests retry with exponential backoff for transient errors (429, 529, timeouts)
 * Tests provider-identifying error messages suggesting alternative provider
 * Validates: Requirements 12.7
 */

// Mock global fetch
const originalFetch = global.fetch;

beforeEach(() => {
  // Reset fetch mock before each test
});

afterEach(() => {
  global.fetch = originalFetch;
});

// We need fresh instances for each test to avoid module caching issues
function createClaudeProvider() {
  // Clear module cache to get fresh instances
  delete require.cache[require.resolve('../server/services/ClaudeProvider')];
  const ClaudeProvider = require('../server/services/ClaudeProvider');
  return new ClaudeProvider();
}

function createChatGPTProvider() {
  delete require.cache[require.resolve('../server/services/ChatGPTProvider')];
  const ChatGPTProvider = require('../server/services/ChatGPTProvider');
  return new ChatGPTProvider();
}

describe('ClaudeProvider Error Handling', () => {
  describe('Provider-specific error messages', () => {
    it('should return provider-identifying message for 429 rate limit', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });
      // Override _sleep to not actually wait
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude rate limit exceeded. Please wait and try again, or switch to ChatGPT.');
    });

    it('should return provider-identifying message for 529 overloaded', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 529,
        text: () => Promise.resolve('Overloaded')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude API is overloaded. Please try again later or switch to ChatGPT.');
    });

    it('should return provider-identifying message for timeout', async () => {
      const provider = createClaudeProvider();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude API request timed out. Please try again or switch to ChatGPT.');
    });

    it('should NOT suggest alternative for 401 invalid key', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Invalid Anthropic API key');
    });
  });

  describe('Retry logic with exponential backoff', () => {
    it('should retry on 429 rate limit up to MAX_RETRIES times', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude rate limit exceeded');

      // Initial attempt + 3 retries = 4 total calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should retry on 529 overloaded up to MAX_RETRIES times', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 529,
        text: () => Promise.resolve('Overloaded')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude API is overloaded');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should retry on timeout up to MAX_RETRIES times', async () => {
      const provider = createClaudeProvider();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude API request timed out');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should NOT retry on 401 invalid key', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Invalid Anthropic API key');

      // Only 1 call - no retries for auth errors
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should succeed on retry if transient error resolves', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limited')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ content: [{ text: 'Hello!' }] })
        });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      const result = await provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      );

      expect(result).toBe('Hello!');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff delays between retries', async () => {
      const provider = createClaudeProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow();

      // Should have called _sleep 3 times (between retries)
      expect(provider._sleep).toHaveBeenCalledTimes(3);

      // Verify exponential backoff pattern (base 1000ms)
      // Attempt 0: ~1000ms, Attempt 1: ~2000ms, Attempt 2: ~4000ms
      const delays = provider._sleep.mock.calls.map(c => c[0]);
      expect(delays[0]).toBeGreaterThanOrEqual(750);  // 1000 - 25% jitter
      expect(delays[0]).toBeLessThanOrEqual(1250);    // 1000 + 25% jitter
      expect(delays[1]).toBeGreaterThanOrEqual(1500); // 2000 - 25% jitter
      expect(delays[1]).toBeLessThanOrEqual(2500);    // 2000 + 25% jitter
      expect(delays[2]).toBeGreaterThanOrEqual(3000); // 4000 - 25% jitter
      expect(delays[2]).toBeLessThanOrEqual(5000);    // 4000 + 25% jitter
    });
  });

  describe('30 second timeout', () => {
    it('should pass AbortSignal to fetch for timeout control', async () => {
      const provider = createClaudeProvider();
      let capturedSignal = null;
      global.fetch = jest.fn().mockImplementation((_url, options) => {
        capturedSignal = options.signal;
        // Return a successful response
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: [{ text: 'response' }] })
        });
      });

      await provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      );

      // Verify AbortSignal was passed to fetch
      expect(capturedSignal).toBeDefined();
      expect(capturedSignal).toBeInstanceOf(AbortSignal);
    });

    it('should throw timeout error when fetch is aborted', async () => {
      const provider = createClaudeProvider();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Claude API request timed out. Please try again or switch to ChatGPT.');
    });
  });
});

describe('ChatGPTProvider Error Handling', () => {
  describe('Provider-specific error messages', () => {
    it('should return provider-identifying message for 429 rate limit', async () => {
      const provider = createChatGPTProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('OpenAI rate limit exceeded. Please wait and try again, or switch to Claude.');
    });

    it('should return provider-identifying message for timeout', async () => {
      const provider = createChatGPTProvider();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('OpenAI API request timed out. Please try again or switch to Claude.');
    });

    it('should NOT suggest alternative for 401 invalid key', async () => {
      const provider = createChatGPTProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Invalid OpenAI API key');
    });
  });

  describe('Retry logic with exponential backoff', () => {
    it('should retry on 429 rate limit up to MAX_RETRIES times', async () => {
      const provider = createChatGPTProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('OpenAI rate limit exceeded');

      // Initial attempt + 3 retries = 4 total calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should retry on timeout up to MAX_RETRIES times', async () => {
      const provider = createChatGPTProvider();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('OpenAI API request timed out');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should NOT retry on 401 invalid key', async () => {
      const provider = createChatGPTProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow('Invalid OpenAI API key');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should succeed on retry if transient error resolves', async () => {
      const provider = createChatGPTProvider();
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limited')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Hello from GPT!' } }]
          })
        });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      const result = await provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      );

      expect(result).toBe('Hello from GPT!');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff delays between retries', async () => {
      const provider = createChatGPTProvider();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });
      provider._sleep = jest.fn().mockResolvedValue(undefined);

      await expect(provider.sendMessage(
        [{ role: 'user', content: 'test' }], 'system', 'key'
      )).rejects.toThrow();

      expect(provider._sleep).toHaveBeenCalledTimes(3);

      const delays = provider._sleep.mock.calls.map(c => c[0]);
      expect(delays[0]).toBeGreaterThanOrEqual(750);
      expect(delays[0]).toBeLessThanOrEqual(1250);
      expect(delays[1]).toBeGreaterThanOrEqual(1500);
      expect(delays[1]).toBeLessThanOrEqual(2500);
      expect(delays[2]).toBeGreaterThanOrEqual(3000);
      expect(delays[2]).toBeLessThanOrEqual(5000);
    });
  });
});
