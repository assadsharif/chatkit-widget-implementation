#!/bin/bash

# Railway + Neon Production Deployment Script
# ChatKit Widget Backend - v0.4.0-observability-complete
# Date: 2026-01-01

set -e  # Exit on error

echo "========================================="
echo "ChatKit Backend - Railway + Neon Deployment"
echo "Version: v0.4.0-observability-complete"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if Railway CLI is installed
echo "Step 1: Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo ""
    echo "Please install Railway CLI first:"
    echo ""
    echo "  npm install -g @railway/cli"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI installed${NC}"
railway --version
echo ""

# Step 2: Neon Database Setup
echo "Step 2: Neon Database Setup..."
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo "Before continuing, set up your Neon database:"
echo ""
echo "  1. Go to https://neon.tech and sign up (free tier available)"
echo "  2. Create a new project"
echo "  3. Copy the connection string from the dashboard"
echo ""
echo "  Example connection string:"
echo "  postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
echo ""
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

echo -e "${GREEN}✓ Neon DATABASE_URL provided${NC}"
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

# Step 5: Set environment variables
echo "Step 5: Setting environment variables..."

# Set DATABASE_URL (Neon)
echo "  Setting DATABASE_URL (Neon)..."
railway variables set DATABASE_URL="$NEON_DATABASE_URL"
echo -e "${GREEN}  ✓ DATABASE_URL set${NC}"

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

# Step 6: Deploy to Railway
echo "Step 6: Deploying to Railway..."
echo "  This may take 2-5 minutes..."
railway up

echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

# Step 7: Get deployment URL
echo "Step 7: Getting deployment URL..."
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

# Step 8: Deployment summary
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Railway project created/linked${NC}"
echo -e "${GREEN}✓ Neon database configured${NC}"
echo -e "${GREEN}✓ Environment variables set:${NC}"
echo "    - DATABASE_URL: ********** (Neon)"
echo "    - SECRET_KEY: ********** (generated)"
echo "    - INTEGRATION_TEST_MODE: false"
echo "    - CORS_ORIGINS: (update after getting domain)"
echo ""
echo -e "${YELLOW}⚠ Next Steps:${NC}"
echo "  1. Generate Railway domain (Settings → Networking)"
echo "  2. Update CORS_ORIGINS with actual domain"
echo "  3. Test health endpoint"
echo "  4. Set up monitoring (UptimeRobot, Pingdom)"
echo ""
echo "For detailed instructions, see: docs/DEPLOYMENT_GUIDE_NEON.md"
echo ""
echo "========================================="
echo "Deployment script complete!"
echo "========================================="
