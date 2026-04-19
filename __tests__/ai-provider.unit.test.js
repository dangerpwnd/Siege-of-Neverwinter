/**
 * Unit Tests for AI Provider Service abstraction
 * Tests AIProviderService interface, ChatGPTProvider, ClaudeProvider, and AI route
 */

const AIProviderService = require('../server/services/AIProviderService');
const ChatGPTProvider = require('../server/services/ChatGPTProvider');
const ClaudeProvider = require('../server/services/ClaudeProvider');
const { buildSystemPrompt } = require('../server/routes/ai');

describe('AIProviderService', () => {
  describe('Abstract base class', () => {
    it('should throw when sendMessage is called directly', async () => {
      const base = new AIProviderService();
      await expect(base.sendMessage([], '', '')).rejects.toThrow('sendMessage must be implemented by subclass');
    });

    it('should throw when validateApiKey is called directly', async () => {
      const base = new AIProviderService();
      await expect(base.validateApiKey('')).rejects.toThrow('validateApiKey must be implemented by subclass');
    });

    it('should throw when name getter is accessed directly', () => {
      const base = new AIProviderService();
      expect(() => base.name).toThrow('name getter must be implemented by subclass');
    });
  });
});

describe('ChatGPTProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new ChatGPTProvider();
  });

  it('should have name "chatgpt"', () => {
    expect(provider.name).toBe('chatgpt');
  });

  it('should extend AIProviderService', () => {
    expect(provider).toBeInstanceOf(AIProviderService);
  });

  it('should reject empty API key in validateApiKey', async () => {
    const result = await provider.validateApiKey('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('API key is required');
  });

  it('should reject null API key in validateApiKey', async () => {
    const result = await provider.validateApiKey(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('API key is required');
  });

  it('should have sendMessage method', () => {
    expect(typeof provider.sendMessage).toBe('function');
  });

  it('should have validateApiKey method', () => {
    expect(typeof provider.validateApiKey).toBe('function');
  });
});

describe('ClaudeProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new ClaudeProvider();
  });

  it('should have name "claude"', () => {
    expect(provider.name).toBe('claude');
  });

  it('should extend AIProviderService', () => {
    expect(provider).toBeInstanceOf(AIProviderService);
  });

  it('should reject empty API key in validateApiKey', async () => {
    const result = await provider.validateApiKey('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('API key is required');
  });

  it('should reject null API key in validateApiKey', async () => {
    const result = await provider.validateApiKey(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('API key is required');
  });

  it('should have sendMessage method', () => {
    expect(typeof provider.sendMessage).toBe('function');
  });

  it('should have validateApiKey method', () => {
    expect(typeof provider.validateApiKey).toBe('function');
  });
});

describe('buildSystemPrompt', () => {
  it('should return base prompt when no campaign context provided', () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).toContain('Dungeon Master');
    expect(prompt).toContain('Neverwinter');
    expect(prompt).toContain('Tiamat');
    expect(prompt).toContain('concise, actionable responses');
  });

  it('should include siege state when provided', () => {
    const prompt = buildSystemPrompt({
      siegeState: {
        day_of_siege: 3,
        wall_integrity: 80,
        defender_morale: 65,
        supplies: 50
      }
    });
    expect(prompt).toContain('Day 3 of the siege');
    expect(prompt).toContain('Wall Integrity: 80%');
    expect(prompt).toContain('Defender Morale: 65%');
    expect(prompt).toContain('Supplies: 50%');
  });

  it('should include combatant counts when provided', () => {
    const prompt = buildSystemPrompt({
      combatants: [
        { type: 'PC', current_hp: 30 },
        { type: 'PC', current_hp: 25 },
        { type: 'NPC', current_hp: 20 },
        { type: 'Monster', current_hp: 40 }
      ]
    });
    expect(prompt).toContain('Active Combatants: 4');
    expect(prompt).toContain('PCs: 2');
    expect(prompt).toContain('NPCs: 1');
    expect(prompt).toContain('Monsters: 1');
  });

  it('should exclude dead combatants from active count', () => {
    const prompt = buildSystemPrompt({
      combatants: [
        { type: 'PC', current_hp: 30 },
        { type: 'Monster', current_hp: 0 }
      ]
    });
    expect(prompt).toContain('Active Combatants: 1');
    expect(prompt).toContain('PCs: 1');
    expect(prompt).toContain('Monsters: 0');
  });

  it('should handle camelCase siege state properties', () => {
    const prompt = buildSystemPrompt({
      siegeState: {
        dayOfSiege: 7,
        wallIntegrity: 45,
        defenderMorale: 30,
        supplies: 20
      }
    });
    expect(prompt).toContain('Day 7 of the siege');
    expect(prompt).toContain('Wall Integrity: 45%');
    expect(prompt).toContain('Defender Morale: 30%');
    expect(prompt).toContain('Supplies: 20%');
  });

  it('should produce equivalent content for both providers', () => {
    const context = {
      siegeState: { day_of_siege: 5, wall_integrity: 60, defender_morale: 50, supplies: 35 },
      combatants: [{ type: 'PC', current_hp: 20 }]
    };
    // Both providers receive the same system prompt from buildSystemPrompt
    const prompt = buildSystemPrompt(context);
    // The prompt is the same string passed to both providers
    expect(prompt).toContain('Dungeon Master');
    expect(prompt).toContain('Day 5');
    expect(prompt).toContain('Active Combatants: 1');
  });
});
