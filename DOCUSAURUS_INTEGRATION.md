# Docusaurus ChatKit Widget Integration Guide

**Purpose**: Add ChatKit RAG chatbot widget to existing Docusaurus site
**Widget**: Custom Web Component (framework-agnostic)
**Backend**: Local FastAPI server (http://localhost:8000)

---

## 🎯 Quick Integration (3 Steps)

### Prerequisites
- ✅ Docusaurus site running (e.g., Physical AI Book)
- ✅ ChatKit backend running locally (see `LOCAL_DEVELOPMENT.md`)
- ✅ Widget built (`npm run build` in `packages/widget/`)

---

### Step 1: Add Widget Script to Docusaurus

Navigate to your Docusaurus project (e.g., `Hackathon_01/physical-ai-book/`):

```bash
cd /path/to/your/physical-ai-book
```

Edit `docusaurus.config.ts` or `docusaurus.config.js`:

```typescript
// docusaurus.config.ts
export default {
  // ... other config

  scripts: [
    {
      src: 'http://localhost:8000/widget/chatkit-widget.js',
      async: true,
      type: 'module',
    },
  ],

  // ... other config
};
```

**Note**: This assumes your backend serves the widget at `/widget/chatkit-widget.js`. If not, see Step 1b below.

---

### Step 1b: Serve Widget from Backend (Alternative)

If you want the backend to serve the widget files:

**Option A: Copy widget to backend static directory**

```bash
# From chatkit-widget-implementation root
cp packages/widget/dist/chatkit-widget.js backend/static/
```

**Option B: Add static file serving to backend**

Edit `backend/app/main.py`:

```python
from fastapi.staticfiles import StaticFiles

# Add after app initialization
app.mount("/widget", StaticFiles(directory="../packages/widget/dist"), name="widget")
```

Then restart backend:
```bash
# In backend directory
uvicorn app.main:app --reload
```

Widget now available at: http://localhost:8000/widget/chatkit-widget.js

---

### Step 2: Add Widget Element to Pages

**Option A: Add to all pages via custom layout**

Create `src/theme/Layout/index.tsx`:

```tsx
import React from 'react';
import Layout from '@theme-original/Layout';
import type {Props} from '@theme/Layout';

export default function LayoutWrapper(props: Props): JSX.Element {
  React.useEffect(() => {
    // Add widget element to page
    if (!document.querySelector('chatkit-widget')) {
      const widget = document.createElement('chatkit-widget');
      document.body.appendChild(widget);
    }
  }, []);

  return <Layout {...props} />;
}
```

**Option B: Add to specific pages**

Edit any MDX page (e.g., `docs/intro.md`):

```mdx
---
title: Introduction
---

# Welcome to Physical AI

<chatkit-widget></chatkit-widget>

Your content here...
```

**Option C: Add via HTML template**

Edit `static/index.html` (if exists) or create custom HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Physical AI Book</title>
</head>
<body>
  <!-- Your Docusaurus content -->

  <!-- ChatKit Widget -->
  <script type="module" src="http://localhost:8000/widget/chatkit-widget.js"></script>
  <chatkit-widget></chatkit-widget>
</body>
</html>
```

---

### Step 3: Configure Widget Backend URL

The widget needs to know where your backend is running.

**Edit `packages/widget/src/chatkit-widget.ts`**:

```typescript
// Find the baseURL or API_URL constant
const API_URL = 'http://localhost:8000';  // Local development

// For production, change to:
// const API_URL = 'https://your-backend.com';
```

Rebuild widget:
```bash
cd packages/widget
npm run build
```

---

## ✅ Verify Integration

### 1. Start Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

**Backend running at**: http://localhost:8000

### 2. Start Docusaurus

```bash
cd /path/to/your/physical-ai-book
npm start
```

**Docusaurus running at**: http://localhost:3000

### 3. Test Widget

1. Open browser: http://localhost:3000
2. Look for ChatKit widget (should appear on page)
3. Type a question: "What is Physical AI?"
4. Verify response appears

---

## 🎨 Widget Styling

### Position Widget (Fixed Bottom Right)

Add CSS to `src/css/custom.css`:

```css
/* ChatKit Widget Styles */
chatkit-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  width: 350px;
  height: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  chatkit-widget {
    width: 100%;
    height: 100%;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }
}
```

### Customize Widget Theme

The widget uses Shadow DOM, so you can customize via CSS variables:

```css
chatkit-widget {
  --chatkit-primary-color: #0066cc;
  --chatkit-bg-color: #ffffff;
  --chatkit-text-color: #333333;
  --chatkit-border-radius: 12px;
}
```

---

## 🔧 Development Workflow

### Hot Reload Setup

**Terminal 1: Backend**
```bash
cd backend
uvicorn app.main:app --reload
```

**Terminal 2: Docusaurus**
```bash
cd /path/to/physical-ai-book
npm start
```

**Terminal 3: Widget Development** (if making widget changes)
```bash
cd packages/widget
npm run dev  # or npm run build --watch
```

### Making Changes

1. **Backend changes**: Edit `backend/app/` → Auto-reloads
2. **Widget changes**: Edit `packages/widget/src/` → Rebuild → Refresh browser
3. **Docusaurus changes**: Edit docs → Auto-reloads

---

## 🚀 Production Deployment

### Option 1: GitHub Pages (Static Widget)

If your widget doesn't need a backend (pre-embedded content):

```bash
# Build widget
cd packages/widget
npm run build

# Copy to Docusaurus static assets
cp dist/chatkit-widget.js /path/to/physical-ai-book/static/widget/

# Update docusaurus.config.ts
scripts: [
  {
    src: '/widget/chatkit-widget.js',  // Serve from same domain
    async: true,
  },
],

# Deploy Docusaurus
cd /path/to/physical-ai-book
npm run build
# Deploy build/ to GitHub Pages
```

### Option 2: Separate Backend Deployment

If you need RAG functionality:

**Backend Options**:
- Railway (see old deployment guides if needed)
- Vercel Serverless Functions
- AWS Lambda
- Your own server

**Update widget backend URL**:
```typescript
const API_URL = 'https://your-backend.vercel.app';
```

Rebuild and redeploy.

---

## 📋 Troubleshooting

### Widget Not Appearing

**Check browser console**:
```javascript
// Open DevTools (F12)
// Look for errors like:
// "Failed to load resource: net::ERR_CONNECTION_REFUSED"
```

**Fix**: Verify backend is running at http://localhost:8000

**Check element exists**:
```javascript
// In browser console:
document.querySelector('chatkit-widget')
// Should return: <chatkit-widget></chatkit-widget>
```

### CORS Errors

**Symptom**: Browser console shows:
```
Access to fetch at 'http://localhost:8000/api/v1/chat'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Fix**: Verify `backend/.env` has:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

Restart backend.

### Widget Loads But Doesn't Respond

**Check backend health**:
```bash
curl http://localhost:8000/health
```

**Expected**:
```json
{"status":"ok","database":"connected"}
```

**If "database":"disconnected"**:
- Check `backend/.env` has correct DATABASE_URL
- Verify Neon database is running
- Check internet connection

### No RAG Responses

**Check Qdrant status**:
```bash
curl http://localhost:8000/api/v1/qdrant/status
```

**Expected**:
```json
{"status":"connected","collection":"physical_ai_course","vectors_count":0}
```

**If vectors_count is 0**:
- You haven't imported course content yet
- See `docs/QDRANT_SETUP_GUIDE.md` → "Data Import"

---

## 📦 Widget Features

### Anonymous Chat
- ✅ No login required
- ✅ Browser-local session storage
- ✅ Conversation persists across page refreshes

### RAG Search
- ✅ Searches Physical AI course content
- ✅ Returns relevant context
- ✅ Shows source citations

### Email Signup (Optional)
- ✅ Capture email for persistence
- ✅ Email verification
- ✅ Cross-device sync

---

## 🔐 Security Considerations

### Local Development
- ✅ CORS allows localhost
- ✅ No production secrets exposed
- ⚠️ Backend accessible from any local app

### Production
- [ ] Use HTTPS for backend
- [ ] Restrict CORS to your domain only
- [ ] Rotate Qdrant API key
- [ ] Use production SECRET_KEY
- [ ] Enable rate limiting

---

## 📚 Next Steps

1. **Import Course Content**
   - Parse your Physical AI book chapters
   - Generate embeddings
   - Upload to Qdrant
   - See `docs/QDRANT_SETUP_GUIDE.md`

2. **Customize Widget UI**
   - Edit `packages/widget/src/shadow-dom/template.ts`
   - Edit `packages/widget/src/shadow-dom/styles.ts`
   - Rebuild: `npm run build`

3. **Test RAG Accuracy**
   - Ask various questions
   - Verify correct content retrieval
   - Adjust embedding model if needed

4. **Deploy to Production**
   - Choose backend platform
   - Update widget API_URL
   - Deploy Docusaurus with widget

---

## 📞 Support

**Documentation**:
- Local Dev: `LOCAL_DEVELOPMENT.md`
- Neon Setup: `docs/NEON_SETUP_GUIDE.md`
- Qdrant Setup: `docs/QDRANT_SETUP_GUIDE.md`

**Widget Source**:
- `packages/widget/src/chatkit-widget.ts`
- `packages/widget/src/shadow-dom/`
- `packages/widget/src/services/`

---

**Guide Version**: 1.0
**Last Updated**: 2026-01-02
**Compatible with**: v0.4.0-observability-complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
