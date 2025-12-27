# ChatKit Widget Package

**Implementation derived from frozen design at commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756).**

## Structure

```
widget/
├── src/
│   ├── components/      # React components (ChatPanel, CitationTooltip, etc.)
│   ├── hooks/           # Custom hooks (useChatSession, useRAG, useAuth)
│   ├── services/        # Services (EventBus, RAG API, Better-Auth)
│   └── types/           # TypeScript types (from MCP event schemas)
└── tests/               # Unit tests (Jest + React Testing Library)
```

## Next Steps

1. Initialize React + TypeScript project
2. Install dependencies (React, TypeScript, Tailwind CSS)
3. Implement Tier 0 (Anonymous Support)

See [Phase 7 Planning Guide](https://github.com/assadsharif/Hackathon_01/blob/v1.0-design-freeze/specs/003-chatkit-widget/phase7-planning.md) for detailed implementation roadmap.
