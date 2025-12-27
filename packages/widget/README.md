# ChatKit Widget (Web Component)

**Implementation derived from frozen design at commit [5b2a756](https://github.com/assadsharif/Hackathon_01/commit/5b2a756).**

---

## What is This?

A **framework-agnostic Web Component** for embedding ChatKit functionality in any web page.

**Usage**:
```html
<script src="chatkit-widget.js"></script>
<chatkit-widget></chatkit-widget>
```

**Works in**:
- ✅ Docusaurus (MDX, static HTML)
- ✅ Plain HTML sites
- ✅ React apps (optional)
- ✅ Vue apps (optional)
- ✅ Any modern browser

---

## Structure

```
widget/
├── src/
│   ├── chatkit-widget.ts        # Custom Element definition
│   ├── shadow-dom/
│   │   ├── template.ts          # HTML template
│   │   └── styles.css           # Scoped styles
│   ├── services/
│   │   ├── rag-client.ts        # FastAPI / OpenAI calls
│   │   └── auth-client.ts       # Better-Auth integration
│   ├── events/
│   │   └── widget-events.ts     # CustomEvent contracts
│   └── types/
│       └── index.ts             # TypeScript types
├── dist/
│   └── chatkit-widget.js        # Final bundle
└── README.md                    # This file
```

---

## Design Delta Reference

See [DESIGN_DELTAS.md - Delta #001](../../docs/DESIGN_DELTAS.md#delta-001-runtime-framework-choice-clarification) for rationale on choosing Web Components over React.

---

**Last Updated**: 2025-12-27
