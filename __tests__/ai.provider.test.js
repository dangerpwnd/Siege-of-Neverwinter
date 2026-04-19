/**
 * Unit Tests for AI Provider Switching Endpoints
 * Tests GET /api/ai/provider and PUT /api/ai/provider
 * Validates: Requirements 12.4, 12.5, 12.6
 */

// Mock the database module
jest.mock('../database/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() }
}));

// Mock the provider services to avoid real API calls
jest.mock('../server/services/ChatGPTProvider', () => {
  return class MockChatGPTProvider {
    get name() { return 'chatgpt'; }
    async sendMessage() { return 'mock response'; }
    async validateApiKey(key) {
      if (key === 'valid-key') return { valid: true };
      return { valid: false, error: 'Invalid key' };
    }
  };
});

jest.mock('../server/services/ClaudeProvider', () => {
  return class MockClaudeProvider {
    get name() { return 'claude'; }
    async sendMessage() { return 'mock response'; }
    async validateApiKey(key) {
      if (key === 'valid-key') return { valid: true };
      return { valid: false, error: 'Invalid key' };
    }
  };
});

const db = require('../database/db');

// We need to require the router after mocks are set up
let router;
beforeAll(() => {
  router = require('../server/routes/ai');
});

// Helper to find a route handler from the Express router
function findRouteHandler(method, path) {
  const layer = router.stack.find(l =>
    l.route &&
    l.route.path === path &&
    l.route.methods[method]
  );
  if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  return layer.route.stack[0].handle;
}

// Helper to create mock req/res
function createMockReqRes(options = {}) {
  const req = {
    query: options.query || {},
    body: options.body || {},
    ...options
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    _getStatus: () => res.status.mock.calls[0]?.[0] || 200,
    _getBody: () => res.json.mock.calls[0]?.[0]
  };
  return { req, res };
}

describe('AI Provider Switching Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai/provider', () => {
    let handler;
    beforeAll(() => {
      handler = findRouteHandler('get', '/provider');
    });

    test('returns default provider (chatgpt) when no preference is stored', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const { req, res } = createMockReqRes({ query: { campaign_id: '1' } });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ provider: 'chatgpt' });
    });

    test('returns stored provider preference', async () => {
      db.query.mockResolvedValue({
        rows: [{ preference_value: '"claude"' }]
      });
      const { req, res } = createMockReqRes({ query: { campaign_id: '1' } });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ provider: 'claude' });
    });

    test('defaults to campaign_id 1 when not specified', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const { req, res } = createMockReqRes({ query: {} });

      await handler(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'aiProvider']
      );
    });

    test('returns 500 on database error', async () => {
      db.query.mockRejectedValue(new Error('DB connection failed'));
      const { req, res } = createMockReqRes({ query: { campaign_id: '1' } });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });

  describe('PUT /api/ai/provider', () => {
    let handler;
    beforeAll(() => {
      handler = findRouteHandler('put', '/provider');
    });

    test('sets provider to claude and returns clearHistory true when changing', async () => {
      // First call: check current provider
      db.query.mockResolvedValueOnce({
        rows: [{ preference_value: '"chatgpt"' }]
      });
      // Second call: upsert preference
      db.query.mockResolvedValueOnce({ rows: [] });

      const { req, res } = createMockReqRes({
        body: { provider: 'claude', campaign_id: 1 }
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        provider: 'claude',
        clearHistory: true
      });
    });

    test('returns clearHistory false when provider does not change', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ preference_value: '"chatgpt"' }]
      });
      db.query.mockResolvedValueOnce({ rows: [] });

      const { req, res } = createMockReqRes({
        body: { provider: 'chatgpt', campaign_id: 1 }
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        provider: 'chatgpt',
        clearHistory: false
      });
    });

    test('returns clearHistory true when no previous preference exists (default chatgpt -> claude)', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // no existing preference
      db.query.mockResolvedValueOnce({ rows: [] });

      const { req, res } = createMockReqRes({
        body: { provider: 'claude', campaign_id: 1 }
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        provider: 'claude',
        clearHistory: true
      });
    });

    test('rejects invalid provider', async () => {
      const { req, res } = createMockReqRes({
        body: { provider: 'invalid', campaign_id: 1 }
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Invalid provider') })
      );
    });

    test('rejects missing provider', async () => {
      const { req, res } = createMockReqRes({
        body: { campaign_id: 1 }
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Invalid provider') })
      );
    });

    test('persists provider preference in database with correct params', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [] });

      const { req, res } = createMockReqRes({
        body: { provider: 'claude', campaign_id: 2 }
      });

      await handler(req, res);

      // Second call should be the upsert
      expect(db.query).toHaveBeenCalledTimes(2);
      const upsertCall = db.query.mock.calls[1];
      expect(upsertCall[0]).toContain('INSERT INTO user_preferences');
      expect(upsertCall[1]).toEqual([2, 'aiProvider', '"claude"']);
    });

    test('defaults to campaign_id 1 when not specified', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [] });

      const { req, res } = createMockReqRes({
        body: { provider: 'chatgpt' }
      });

      await handler(req, res);

      const checkCall = db.query.mock.calls[0];
      expect(checkCall[1]).toEqual([1, 'aiProvider']);
    });

    test('returns 500 on database error', async () => {
      db.query.mockRejectedValue(new Error('DB write failed'));

      const { req, res } = createMockReqRes({
        body: { provider: 'claude', campaign_id: 1 }
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });
});
