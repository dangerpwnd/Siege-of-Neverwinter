import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Callout,
  Divider,
  List,
  ListItem,
  Select,
  SelectItem,
  TextInput,
} from '@tremor/react';

type Provider = 'chatgpt' | 'claude';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CampaignContext {
  siegeState?: {
    day_of_siege: number;
    wall_integrity: number;
    defender_morale: number;
    supplies: number;
  };
  combatants?: Array<{
    type: string;
    current_hp: number;
  }>;
}

export default function AIAssistant() {
  const [provider, setProvider] = useState<Provider>('chatgpt');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatgptKey, setChatgptKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [claudeKeyValid, setClaudeKeyValid] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load provider preference on mount
  useEffect(() => {
    async function loadProvider() {
      try {
        const res = await fetch('/api/ai/provider?campaign_id=1');
        if (res.ok) {
          const data = await res.json();
          if (data.provider) setProvider(data.provider);
        }
      } catch {
        // Use default provider
      }
    }
    loadProvider();
  }, []);

  // Load API keys from localStorage
  useEffect(() => {
    const storedChatgptKey = localStorage.getItem('ai_chatgpt_key') || '';
    const storedClaudeKey = localStorage.getItem('ai_claude_key') || '';
    setChatgptKey(storedChatgptKey);
    setClaudeKey(storedClaudeKey);
    if (storedClaudeKey) {
      setClaudeKeyValid(true); // Assume valid if previously stored
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch campaign context for AI messages
  const fetchCampaignContext = useCallback(async (): Promise<CampaignContext> => {
    const context: CampaignContext = {};
    try {
      const [siegeRes, initRes] = await Promise.all([
        fetch('/api/siege?campaign_id=1'),
        fetch('/api/initiative?campaign_id=1'),
      ]);
      if (siegeRes.ok) {
        const siegeData = await siegeRes.json();
        context.siegeState = siegeData.data;
      }
      if (initRes.ok) {
        const initData = await initRes.json();
        context.combatants = initData.data || [];
      }
    } catch {
      // Context is optional, proceed without it
    }
    return context;
  }, []);

  // Validate Claude API key
  const validateClaudeKey = useCallback(async (key: string) => {
    if (!key.trim()) {
      setClaudeKeyValid(false);
      return;
    }
    setValidatingKey(true);
    try {
      const res = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'claude', apiKey: key }),
      });
      const data = await res.json();
      setClaudeKeyValid(data.valid === true);
      if (!data.valid) {
        setError('Claude API key is invalid. Please check your key.');
      }
    } catch {
      setClaudeKeyValid(false);
      setError('Failed to validate Claude API key.');
    } finally {
      setValidatingKey(false);
    }
  }, []);

  // Handle provider switch
  const handleProviderChange = useCallback(async (newProvider: string) => {
    if (newProvider !== 'chatgpt' && newProvider !== 'claude') return;
    if (newProvider === provider) return;

    // Gate Claude selection when no valid API key is configured
    if (newProvider === 'claude' && !claudeKeyValid) {
      setError('Please enter a valid Anthropic API key before switching to Claude.');
      return;
    }

    try {
      const res = await fetch('/api/ai/provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newProvider, campaign_id: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setProvider(newProvider);
        if (data.clearHistory) {
          setMessages([]);
        }
        setError(null);
      }
    } catch {
      setError('Failed to switch provider.');
    }
  }, [provider, claudeKeyValid]);

  // Save API key to localStorage
  const saveApiKey = useCallback((prov: Provider, key: string) => {
    localStorage.setItem(`ai_${prov}_key`, key);
    if (prov === 'chatgpt') {
      setChatgptKey(key);
    } else {
      setClaudeKey(key);
      if (key.trim()) {
        validateClaudeKey(key);
      } else {
        setClaudeKeyValid(false);
      }
    }
  }, [validateClaudeKey]);

  // Send message to AI
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const activeKey = provider === 'chatgpt' ? chatgptKey : claudeKey;
    if (!activeKey.trim()) {
      setError(`Please enter your ${provider === 'chatgpt' ? 'OpenAI' : 'Anthropic'} API key.`);
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const campaignContext = await fetchCampaignContext();
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: activeKey,
          messages: updatedMessages,
          campaignContext,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const providerName = provider === 'chatgpt' ? 'ChatGPT' : 'Claude';
        const altProvider = provider === 'chatgpt' ? 'Claude' : 'ChatGPT';
        setError(
          `${providerName} error: ${errData.error || 'Unknown error'}. Consider switching to ${altProvider}.`
        );
        setLoading(false);
        return;
      }

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'No response received.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const providerName = provider === 'chatgpt' ? 'ChatGPT' : 'Claude';
      const altProvider = provider === 'chatgpt' ? 'Claude' : 'ChatGPT';
      setError(
        `Failed to reach ${providerName}. Check your connection or try ${altProvider}.`
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, provider, chatgptKey, claudeKey, messages, fetchCampaignContext]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider Selector */}
      <div>
        <label className="text-xs text-gray-600 font-medium" htmlFor="ai-provider-select">
          AI Provider
        </label>
        <Select
          id="ai-provider-select"
          value={provider}
          onValueChange={handleProviderChange}
          aria-label="Select AI provider"
        >
          <SelectItem value="chatgpt">ChatGPT</SelectItem>
          <SelectItem value="claude">
            Claude {!claudeKeyValid ? '(API key required)' : ''}
          </SelectItem>
        </Select>
      </div>

      <Divider />

      {/* API Key Inputs */}
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-600" htmlFor="chatgpt-api-key">
            OpenAI API Key
          </label>
          <TextInput
            id="chatgpt-api-key"
            type="password"
            placeholder="sk-..."
            value={chatgptKey}
            onValueChange={(v) => saveApiKey('chatgpt', v)}
            aria-label="OpenAI API key"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600" htmlFor="claude-api-key">
            Anthropic API Key
          </label>
          <div className="flex gap-2">
            <TextInput
              id="claude-api-key"
              type="password"
              placeholder="sk-ant-..."
              value={claudeKey}
              onValueChange={(v) => saveApiKey('claude', v)}
              className="flex-1"
              aria-label="Anthropic API key"
            />
            {validatingKey && (
              <span className="text-xs text-gray-400 self-center">Validating...</span>
            )}
          </div>
        </div>
      </div>

      <Divider />

      {/* Error/Status Callout */}
      {error && (
        <Callout title="Error" color="red">
          {error}
        </Callout>
      )}

      {/* Conversation History */}
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded p-2" aria-label="Conversation history">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            No messages yet. Start a conversation with your AI DM assistant.
          </p>
        ) : (
          <List>
            {messages.map((msg, idx) => (
              <ListItem key={idx}>
                <div className={`w-full py-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs font-semibold text-gray-500 block">
                    {msg.role === 'user' ? 'You' : provider === 'chatgpt' ? 'ChatGPT' : 'Claude'}
                  </span>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </ListItem>
            ))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <TextInput
          placeholder="Ask your AI DM assistant..."
          value={input}
          onValueChange={setInput}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1"
          aria-label="Message input"
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
