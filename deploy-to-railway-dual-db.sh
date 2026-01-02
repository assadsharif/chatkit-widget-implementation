#!/bin/bash

# Railway + Neon + Qdrant Production Deployment Script
# ChatKit Widget Backend - v0.4.0-observability-complete
# Dual Database Setup: Neon (Postgres) + Qdrant (Vector DB)
# Date: 2026-01-01

set -e  # Exit on error

echo "========================================="
echo "ChatKit Backend - Dual Database Deployment"
echo "Railway + Neon + Qdrant"
echo "Version: v0.4.0-observability-complete"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Check if Railway CLI is installed
echo "Step 1: Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo ""
    echo "Please install Railway CLI first:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI installed${NC}"
railway --version
echo ""

# Step 2: Neon Database Setup
echo "Step 2: Neon PostgreSQL Setup..."
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo "Neon stores: Users, Sessions, Chat History"
echo ""
echo "Before continuing, set up your Neon database:"
echo "  1. Go to https://neon.tech and sign up"
echo "  2. Create a new project: 'chatkit-backend-production'"
echo "  3. Copy the connection string"
echo ""
echo "Example connection string:"
echo "  postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Prompt for Neon DATABASE_URL
echo -e "${YELLOW}Enter your Neon DATABASE_URL:${NC}"
read -r NEON_DATABASE_URL

# Validate DATABASE_URL format
if [[ ! "$NEON_DATABASE_URL" =~ ^postgresql:// ]]; then
    echo -e "${RED}✗ Invalid DATABASE_URL format${NC}"
    echo "Expected format: postgresql://user:password@host/database"
    exit 1
fi

# Add connection pooling if not present
if [[ ! "$NEON_DATABASE_URL" =~ pgbouncer=true ]]; then
    if [[ "$NEON_DATABASE_URL" =~ \? ]]; then
        NEON_DATABASE_URL="${NEON_DATABASE_URL}&pgbouncer=true"
    else
        NEON_DATABASE_URL="${NEON_DATABASE_URL}?pgbouncer=true"
    fi
    echo -e "${CYAN}  ℹ Added connection pooling: &pgbouncer=true${NC}"
fi

echo -e "${GREEN}✓ Neon DATABASE_URL configured${NC}"
echo ""

# Step 3: Qdrant Vector Database Setup
echo "Step 3: Qdrant Cloud Setup..."
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo "Qdrant stores: Vector Embeddings for RAG"
echo ""
echo "Before continuing, set up your Qdrant cluster:"
echo "  1. Go to https://cloud.qdrant.io and sign up"
echo "  2. Create a Free cluster: 'chatkit-rag-production'"
echo "  3. Copy the Cluster URL"
echo "  4. Create an API Key"
echo ""
echo "Example Cluster URL:"
echo "  https://abc12345.aws.cloud.qdrant.io:6333"
echo ""
echo "Example API Key:"
echo "  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Prompt for Qdrant URL
echo -e "${YELLOW}Enter your Qdrant Cluster URL:${NC}"
read -r QDRANT_URL

# Validate Qdrant URL format
if [[ ! "$QDRANT_URL" =~ ^https:// ]]; then
    echo -e "${RED}✗ Invalid Qdrant URL format${NC}"
    echo "Expected format: https://abc12345.aws.cloud.qdrant.io:6333"
    exit 1
fi

echo -e "${GREEN}✓ Qdrant URL configured${NC}"

# Prompt for Qdrant API Key
echo -e "${YELLOW}Enter your Qdrant API Key:${NC}"
read -r QDRANT_API_KEY

if [ -z "$QDRANT_API_KEY" ]; then
    echo -e "${RED}✗ Qdrant API Key cannot be empty${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Qdrant API Key configured${NC}"
echo ""

# Step 4: Generate production SECRET_KEY
echo "Step 4: Generating production SECRET_KEY..."
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))' 2>/dev/null || python -c 'import secrets; print(secrets.token_urlsafe(32))')
if [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}✗ Failed to generate SECRET_KEY${NC}"
    echo "Please install Python 3.6+ and try again"
    exit 1
fi
echo -e "${GREEN}✓ SECRET_KEY generated${NC}"
echo ""

# Step 5: Check if Railway project exists
echo "Step 5: Checking Railway project..."
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠ No Railway project linked${NC}"
    echo "Creating new Railway project..."
    railway init --name "chatkit-backend-production"
    echo -e "${GREEN}✓ Railway project created${NC}"
else
    echo -e "${GREEN}✓ Railway project already linked${NC}"
    railway status
fi
echo ""

# Step 6: Set environment variables
echo "Step 6: Setting environment variables..."
echo ""

# Neon Database
echo "  [1/7] Setting DATABASE_URL (Neon)..."
railway variables set DATABASE_URL="$NEON_DATABASE_URL"
echo -e "${GREEN}  ✓ DATABASE_URL set${NC}"

# Qdrant Vector Database
echo "  [2/7] Setting QDRANT_URL..."
railway variables set QDRANT_URL="$QDRANT_URL"
echo -e "${GREEN}  ✓ QDRANT_URL set${NC}"

echo "  [3/7] Setting QDRANT_API_KEY..."
railway variables set QDRANT_API_KEY="$QDRANT_API_KEY"
echo -e "${GREEN}  ✓ QDRANT_API_KEY set${NC}"

echo "  [4/7] Setting QDRANT_COLLECTION..."
railway variables set QDRANT_COLLECTION="physical_ai_course"
echo -e "${GREEN}  ✓ QDRANT_COLLECTION set${NC}"

# Backend Configuration
echo "  [5/7] Setting SECRET_KEY..."
railway variables set SECRET_KEY="$SECRET_KEY"
echo -e "${GREEN}  ✓ SECRET_KEY set${NC}"

echo "  [6/7] Setting INTEGRATION_TEST_MODE=false..."
railway variables set INTEGRATION_TEST_MODE=false
echo -e "${GREEN}  ✓ INTEGRATION_TEST_MODE set${NC}"

echo "  [7/7] Setting placeholder CORS_ORIGINS..."
railway variables set CORS_ORIGINS="https://chatkit-backend.railway.app"
echo -e "${GREEN}  ✓ CORS_ORIGINS set (will update after deployment)${NC}"

echo ""

# Step 7: Deploy to Railway
echo "Step 7: Deploying to Railway..."
echo "  This may take 2-5 minutes..."
echo ""
railway up

echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

# Step 8: Post-deployment instructions
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Railway project created/linked${NC}"
echo -e "${GREEN}✓ Neon PostgreSQL configured${NC}"
echo -e "${GREEN}✓ Qdrant Vector DB configured${NC}"
echo -e "${GREEN}✓ Environment variables set (7/7)${NC}"
echo ""
echo -e "${CYAN}Database Architecture:${NC}"
echo "  • Neon (Postgres): Users, Sessions, Chat History"
echo "  • Qdrant (Vector): Embeddings for RAG retrieval"
echo ""
echo -e "${YELLOW}⚠ Next Steps:${NC}"
echo ""
echo "  1. Generate Railway Domain:"
echo "     • railway open"
echo "     • Settings → Networking → Generate Domain"
echo "     • Copy domain (e.g., chatkit-backend-production.up.railway.app)"
echo ""
echo "  2. Update CORS_ORIGINS:"
echo "     railway variables set CORS_ORIGINS=\"https://YOUR-DOMAIN.railway.app\""
echo ""
echo "  3. Verify Health Endpoint:"
echo "     curl https://YOUR-DOMAIN.railway.app/health"
echo "     Expected: {\"status\":\"ok\",\"database\":\"connected\",...}"
echo ""
echo "  4. Verify Qdrant Connection:"
echo "     curl https://YOUR-DOMAIN.railway.app/api/v1/qdrant/status"
echo "     Expected: {\"status\":\"connected\",\"collection\":\"physical_ai_course\"}"
echo ""
echo "  5. Upload Course Content to Qdrant:"
echo "     See: docs/QDRANT_SETUP_GUIDE.md (Data Import section)"
echo ""
echo "  6. Set up Monitoring:"
echo "     • UptimeRobot: https://uptimerobot.com (free)"
echo "     • Monitor: /health endpoint"
echo ""
echo "For detailed documentation:"
echo "  • Neon Setup: docs/NEON_SETUP_GUIDE.md"
echo "  • Qdrant Setup: docs/QDRANT_SETUP_GUIDE.md"
echo "  • Deployment: docs/DEPLOYMENT_GUIDE_DUAL_DB.md"
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
