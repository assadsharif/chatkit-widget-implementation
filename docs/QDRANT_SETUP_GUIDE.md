# Qdrant Cloud Vector Database Setup Guide

**Platform**: Qdrant Cloud (https://cloud.qdrant.io)
**Purpose**: Vector embeddings storage for RAG (Retrieval-Augmented Generation)
**Use Case**: Store and search Physical AI & Humanoid Robotics course content embeddings
**Date**: 2026-01-01

---

## Why Qdrant?

**Purpose in ChatKit**:
- Store vector embeddings of course content (Physical AI book chapters)
- Semantic search for RAG retrieval
- Fast similarity search (< 50ms)

**Benefits**:
- ✅ **Free Tier**: 1 GB RAM, 1 cluster (sufficient for MVP)
- ✅ **Fast Vector Search**: Optimized for similarity queries
- ✅ **Cloud-Native**: Managed service, no server management
- ✅ **Easy Integration**: REST API + Python client
- ✅ **Persistent Storage**: Embeddings survive restarts

**Free Tier Limits**:
- 1 cluster
- 1 GB RAM
- Unlimited collections
- Unlimited vectors (within 1 GB RAM limit)
- ~1M vectors with 384-dim embeddings (sentence-transformers)

**Architecture**:
```
User Query → ChatKit Widget → Backend → Qdrant (vector search)
                                      ↓
                                    Retrieve relevant chunks
                                      ↓
                                    LLM (generate answer)
```

---

## Quick Setup (3 Minutes)

### Step 1: Create Qdrant Cloud Account

1. Go to https://cloud.qdrant.io
2. Click **"Sign Up"**
3. Choose sign-up method:
   - GitHub (recommended)
   - Google
   - Email

### Step 2: Create Free Cluster

1. After login, click **"Create Cluster"**
2. Fill in cluster details:
   - **Cluster Name**: `chatkit-rag-production`
   - **Cloud Provider**: AWS (recommended)
   - **Region**: Choose closest to your Railway backend
     - US East (N. Virginia) - `us-east-1`
     - US West (Oregon) - `us-west-2`
     - Europe (Frankfurt) - `eu-central-1`
   - **Cluster Type**: **Free** (1 GB RAM)

3. Click **"Create"**
4. Wait 1-2 minutes for cluster provisioning

### Step 3: Get Cluster URL and API Key

**Cluster URL** (copy this):
```
https://abc12345-example.aws.cloud.qdrant.io:6333
```

**Example**:
```
https://7f8a9b3c-chatkit-rag.aws.cloud.qdrant.io:6333
```

**API Key** (create one):
1. Go to **"API Keys"** tab
2. Click **"Create API Key"**
3. Name: `chatkit-backend-production`
4. Copy the API key (shows only once!)

**Example API Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**⚠️ Important**: Copy and save both URL and API key securely. You'll need them for Railway deployment.

---

## Step 4: Create Collection for Course Content

A **collection** is like a table in Qdrant - it stores vectors of a specific dimension.

### Option 1: Use Qdrant Web UI

1. In Qdrant Cloud dashboard, click **"Collections"**
2. Click **"Create Collection"**
3. Fill in:
   - **Collection Name**: `physical_ai_course`
   - **Vector Size**: `384` (for sentence-transformers/all-MiniLM-L6-v2)
   - **Distance Metric**: `Cosine` (recommended for text)
   - **On-Disk Storage**: Enabled (saves RAM)

4. Click **"Create"**

### Option 2: Use Backend API (Automatic)

The ChatKit backend will auto-create the collection on first run:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(
    url="https://abc12345.aws.cloud.qdrant.io:6333",
    api_key="your-api-key"
)

# Auto-create collection
client.create_collection(
    collection_name="physical_ai_course",
    vectors_config=VectorParams(
        size=384,  # sentence-transformers/all-MiniLM-L6-v2
        distance=Distance.COSINE
    ),
    on_disk_payload=True  # Save RAM
)
```

**Recommendation**: Let backend auto-create (simpler).

---

## Step 5: Configure Environment Variables

After getting Qdrant URL and API key, set these in Railway:

```bash
# Qdrant Cloud URL
railway variables set QDRANT_URL="https://abc12345.aws.cloud.qdrant.io:6333"

# Qdrant API Key
railway variables set QDRANT_API_KEY="your-api-key-here"

# Collection name (default: physical_ai_course)
railway variables set QDRANT_COLLECTION="physical_ai_course"
```

---

## Architecture: Dual Database Setup

### Neon (Relational Data)
- User accounts
- Email verification tokens
- Chat sessions metadata
- Message history

### Qdrant (Vector Data)
- Course content embeddings
- Chapter/section vectors
- Semantic search index

**Why Both?**
- Neon: ACID transactions, relational queries (user data)
- Qdrant: Fast vector similarity search (RAG retrieval)
- Each optimized for different workloads

---

## Vector Embedding Process

### Step 1: Embed Course Content

```python
from sentence_transformers import SentenceTransformer

# Load embedding model (384-dim)
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Course content chunks
chunks = [
    "Physical AI combines artificial intelligence with physical embodiment...",
    "Humanoid robots require perception, action, and learning systems...",
    # ... more chunks
]

# Generate embeddings
embeddings = model.encode(chunks)  # Shape: (n_chunks, 384)
```

### Step 2: Upload to Qdrant

```python
from qdrant_client.models import PointStruct

# Prepare points (id, vector, payload)
points = [
    PointStruct(
        id=i,
        vector=embedding.tolist(),
        payload={
            "text": chunk,
            "chapter": "Module 1: Introduction",
            "section": "What is Physical AI?",
            "url": "https://docs.example.com/module-1/intro"
        }
    )
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
]

# Upload to Qdrant
client.upsert(
    collection_name="physical_ai_course",
    points=points
)
```

### Step 3: Search for Relevant Context

```python
# User query
query = "How do humanoid robots learn?"

# Embed query
query_embedding = model.encode(query)

# Search Qdrant
results = client.search(
    collection_name="physical_ai_course",
    query_vector=query_embedding.tolist(),
    limit=5  # Top 5 most relevant chunks
)

# Extract context
context = "\n\n".join([hit.payload["text"] for hit in results])

# Send to LLM
answer = llm.generate(context=context, query=query)
```

---

## Monitoring & Management

### Qdrant Cloud Dashboard

**Metrics**:
- Collection size (vectors count)
- RAM usage (out of 1 GB)
- Query latency (p50, p95, p99)
- API requests/day

**Collections**:
- View all collections
- Inspect vectors
- Delete collections
- Rename collections

**API Keys**:
- Create new keys
- Revoke keys
- Set expiration

### Free Tier Limits Monitoring

**Check RAM usage**:
1. Qdrant dashboard → Cluster → Metrics
2. **RAM Usage**: Should be < 1 GB
3. If approaching limit:
   - Reduce vector dimensions (384 → 128)
   - Enable on-disk storage
   - Delete unused collections

**Estimated Capacity**:
- **384-dim embeddings**: ~1M vectors
- **768-dim embeddings**: ~500k vectors
- **1536-dim embeddings**: ~250k vectors

**Physical AI Book**:
- ~100 chapters/sections
- ~1,000 chunks (500 words each)
- **Total**: ~1,000 vectors × 384 dim = **1.5 MB** (well within 1 GB limit)

---

## Integration with ChatKit Backend

### Backend Environment Variables

```bash
# Qdrant configuration
QDRANT_URL=https://abc12345.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-api-key-here
QDRANT_COLLECTION=physical_ai_course

# Embedding model (optional, defaults to all-MiniLM-L6-v2)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIM=384
```

### Backend Code (RAG Client)

Update `backend/app/services/rag_client.py`:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import os

class RAGClient:
    def __init__(self):
        # Qdrant connection
        self.qdrant = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION", "physical_ai_course")

        # Embedding model
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        self.embedder = SentenceTransformer(model_name)

        # Create collection if not exists
        self._init_collection()

    def _init_collection(self):
        collections = self.qdrant.get_collections().collections
        if self.collection_name not in [c.name for c in collections]:
            self.qdrant.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=int(os.getenv("EMBEDDING_DIM", 384)),
                    distance=Distance.COSINE
                ),
                on_disk_payload=True
            )

    def search(self, query: str, limit: int = 5):
        # Embed query
        query_embedding = self.embedder.encode(query)

        # Search Qdrant
        results = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=query_embedding.tolist(),
            limit=limit
        )

        # Return contexts
        return [
            {
                "text": hit.payload.get("text", ""),
                "chapter": hit.payload.get("chapter", ""),
                "section": hit.payload.get("section", ""),
                "score": hit.score
            }
            for hit in results
        ]
```

---

## Troubleshooting

### Connection Failed

**Symptom**: `Could not connect to Qdrant at https://...`

**Causes**:
1. Invalid QDRANT_URL or QDRANT_API_KEY
2. Cluster not provisioned yet
3. API key revoked

**Fix**:
```bash
# Test connection
curl https://abc12345.aws.cloud.qdrant.io:6333/collections \
  -H "api-key: your-api-key"

# Expected: {"result": {"collections": [...]}}
# If 401: Check API key
# If timeout: Check URL
```

### Collection Not Found

**Symptom**: `Collection 'physical_ai_course' does not exist`

**Fix**:
```python
# Create collection manually
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(url="...", api_key="...")
client.create_collection(
    collection_name="physical_ai_course",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)
```

### RAM Limit Exceeded

**Symptom**: `Out of memory` or cluster unresponsive

**Fix**:
1. Enable on-disk storage: `on_disk_payload=True`
2. Reduce vector dimensions (use smaller embedding model)
3. Delete unused collections
4. Upgrade to paid tier (if needed)

---

## Cost Optimization

### Free Tier Best Practices

1. **Enable On-Disk Storage**: `on_disk_payload=True` (saves RAM)
2. **Use Smaller Embeddings**: 384-dim vs 1536-dim (4x less RAM)
3. **Delete Unused Collections**: Keep only production collection
4. **Monitor RAM Usage**: Qdrant dashboard → Metrics

### When to Upgrade (Qdrant Pro - $25/month)

- Need > 1 GB RAM
- Require multiple clusters (dev, staging, prod)
- Need high availability (99.9% SLA)
- Require backups and snapshots

---

## Security Best Practices

### API Key Security

✅ **DO**:
- Store in Railway environment variables
- Rotate keys quarterly
- Use separate keys for dev/prod
- Revoke unused keys

❌ **DON'T**:
- Commit to git
- Share via email/Slack
- Use in client-side code
- Log API keys

### Network Security

Qdrant Cloud enforces:
- ✅ HTTPS/TLS encryption
- ✅ API key authentication
- ✅ IP whitelisting (paid tier)

---

## Data Import: Physical AI Book

### Step 1: Prepare Course Content

```python
# Parse Docusaurus markdown files
import os
import frontmatter

chapters = []
for file in os.listdir("physical-ai-book/docs"):
    if file.endswith(".md"):
        with open(f"physical-ai-book/docs/{file}") as f:
            post = frontmatter.load(f)
            chapters.append({
                "title": post.get("title", ""),
                "content": post.content,
                "url": f"/docs/{file.replace('.md', '')}"
            })
```

### Step 2: Chunk Content

```python
# Split into 500-word chunks
def chunk_text(text, chunk_size=500):
    words = text.split()
    return [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

all_chunks = []
for chapter in chapters:
    chunks = chunk_text(chapter["content"])
    for chunk in chunks:
        all_chunks.append({
            "text": chunk,
            "chapter": chapter["title"],
            "url": chapter["url"]
        })
```

### Step 3: Embed and Upload

```python
from sentence_transformers import SentenceTransformer
from qdrant_client.models import PointStruct

# Embed
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embeddings = model.encode([c["text"] for c in all_chunks])

# Upload
points = [
    PointStruct(
        id=i,
        vector=embedding.tolist(),
        payload=chunk
    )
    for i, (chunk, embedding) in enumerate(zip(all_chunks, embeddings))
]

client.upsert(collection_name="physical_ai_course", points=points)
print(f"Uploaded {len(points)} vectors to Qdrant")
```

---

## Support & Resources

**Qdrant Documentation**: https://qdrant.tech/documentation
**Qdrant Discord**: https://discord.gg/qdrant
**Qdrant GitHub**: https://github.com/qdrant/qdrant

**ChatKit Integration**:
- [Neon + Qdrant Deployment Guide](./DEPLOYMENT_GUIDE_DUAL_DB.md)
- [Deployment Script](../deploy-to-railway-dual-db.sh)

---

## Summary Checklist

Before deployment, ensure:

- [ ] Qdrant Cloud account created
- [ ] Free cluster created (1 GB RAM)
- [ ] Cluster URL copied
- [ ] API key created and saved securely
- [ ] Collection created (or will auto-create)
- [ ] Ready to set QDRANT_URL and QDRANT_API_KEY in Railway

---

**Guide Version**: 1.0
**Last Updated**: 2026-01-01
**Compatible with**: v0.4.0-observability-complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
