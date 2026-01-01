#!/bin/bash

# Railway Production Deployment Script
# ChatKit Widget Backend - v0.4.0-observability-complete
# Date: 2026-01-01

set -e  # Exit on error

echo "========================================="
echo "ChatKit Backend - Railway Deployment"
echo "Version: v0.4.0-observability-complete"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Railway CLI is installed
echo "Step 1: Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo ""
    echo "Please install Railway CLI first:"
    echo ""
    echo "  macOS/Linux:"
    echo "    curl -fsSL https://railway.app/install.sh | sh"
    echo ""
    echo "  Windows (PowerShell):"
    echo "    iwr https://railway.app/install.ps1 | iex"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI installed${NC}"
railway version
echo ""

# Step 2: Check if logged in to Railway
echo "Step 2: Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Railway${NC}"
    echo "Logging in to Railway..."
    railway login
    echo -e "${GREEN}✓ Logged in successfully${NC}"
else
    echo -e "${GREEN}✓ Already logged in to Railway${NC}"
    railway whoami
fi
echo ""

# Step 3: Generate production SECRET_KEY
echo "Step 3: Generating production SECRET_KEY..."
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))' 2>/dev/null || python -c 'import secrets; print(secrets.token_urlsafe(32))')
if [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}✗ Failed to generate SECRET_KEY${NC}"
    echo "Please install Python 3.6+ and try again"
    exit 1
fi
echo -e "${GREEN}✓ SECRET_KEY generated${NC}"
echo "  (will be set in Railway environment)"
echo ""

# Step 4: Check if Railway project exists
echo "Step 4: Checking Railway project..."
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

# Step 5: Add PostgreSQL database
echo "Step 5: Setting up PostgreSQL database..."
echo -e "${YELLOW}⚠ Please add PostgreSQL manually:${NC}"
echo "  1. Open Railway dashboard: railway open"
echo "  2. Click 'New' → 'Database' → 'Add PostgreSQL'"
echo "  3. Wait for DATABASE_URL to be set"
echo ""
read -p "Press Enter once PostgreSQL is added..."
echo ""

# Step 6: Set environment variables
echo "Step 6: Setting environment variables..."

# Set SECRET_KEY
echo "  Setting SECRET_KEY..."
railway variables set SECRET_KEY="$SECRET_KEY"
echo -e "${GREEN}  ✓ SECRET_KEY set${NC}"

# Set INTEGRATION_TEST_MODE
echo "  Setting INTEGRATION_TEST_MODE=false..."
railway variables set INTEGRATION_TEST_MODE=false
echo -e "${GREEN}  ✓ INTEGRATION_TEST_MODE set${NC}"

# Set placeholder CORS_ORIGINS (will update after deployment)
echo "  Setting placeholder CORS_ORIGINS..."
railway variables set CORS_ORIGINS="https://chatkit-backend.railway.app"
echo -e "${GREEN}  ✓ CORS_ORIGINS set (will update after deployment)${NC}"

echo ""

# Step 7: Deploy to Railway
echo "Step 7: Deploying to Railway..."
echo "  This may take 2-5 minutes..."
railway up

echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

# Step 8: Get deployment URL
echo "Step 8: Getting deployment URL..."
echo "  Fetching Railway domain..."
sleep 5  # Wait for deployment to start

# Open Railway dashboard
echo ""
echo -e "${YELLOW}Please complete these final steps:${NC}"
echo "  1. Open Railway dashboard: railway open"
echo "  2. Go to Settings → Networking → Generate Domain"
echo "  3. Copy the generated domain (e.g., chatkit-backend-production.up.railway.app)"
echo "  4. Update CORS_ORIGINS:"
echo "     railway variables set CORS_ORIGINS=\"https://YOUR-DOMAIN.railway.app\""
echo ""
echo "  5. Verify deployment:"
echo "     curl https://YOUR-DOMAIN.railway.app/health"
echo "     Expected: {\"status\":\"ok\",\"database\":\"connected\",...}"
echo ""

# Step 9: Deployment summary
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Railway project created/linked${NC}"
echo -e "${GREEN}✓ Environment variables set:${NC}"
echo "    - SECRET_KEY: ********** (generated)"
echo "    - INTEGRATION_TEST_MODE: false"
echo "    - CORS_ORIGINS: (update after getting domain)"
echo ""
echo -e "${YELLOW}⚠ Next Steps:${NC}"
echo "  1. Add PostgreSQL database (if not done)"
echo "  2. Generate Railway domain"
echo "  3. Update CORS_ORIGINS with actual domain"
echo "  4. Test health endpoint"
echo "  5. Set up monitoring (UptimeRobot, Pingdom)"
echo ""
echo "For detailed instructions, see: docs/DEPLOYMENT_GUIDE.md"
echo ""
echo "========================================="
echo "Deployment script complete!"
echo "========================================="
