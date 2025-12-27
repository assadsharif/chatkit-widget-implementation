/**
 * TypeScript Type Definitions
 *
 * Aligned with frozen design event schemas from:
 * .claude/mcp/chatkit/mcp.json (design repository)
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  tier: 'anonymous' | 'lightweight' | 'full' | 'premium';
}
