# Neon Serverless PostgreSQL Setup Guide

**Platform**: Neon (https://neon.tech)
**Purpose**: Serverless PostgreSQL database for ChatKit Backend
**Deployment**: Railway (Backend) + Neon (Database)
**Date**: 2026-01-01

---

## Why Neon?

**Benefits**:
- ✅ **Serverless**: Auto-scaling, pay only for what you use
- ✅ **Generous Free Tier**: 512 MB storage, 0.5 GB RAM
- ✅ **Instant Branching**: Database branches like git (dev, staging, prod)
- ✅ **Auto-Pause**: Database pauses when inactive (saves costs)
- ✅ **Connection Pooling**: Built-in PgBouncer
- ✅ **Fast Setup**: 30 seconds to create a database

**vs Railway PostgreSQL**:
- Neon: Serverless, auto-pause, branching, free tier larger
- Railway PostgreSQL: Always-on, no branching, included in Railway credit

**Free Tier Limits**:
- 512 MB storage
- 0.5 GB RAM
- 100 hours compute/month (auto-pause when idle)
- Unlimited projects

---

## Quick Setup (2 Minutes)

### Step 1: Create Neon Account

1. Go to https://neon.tech
2. Click **"Sign Up"**
3. Choose sign-up method:
   - GitHub (recommended)
   - Google
   - Email

### Step 2: Create New Project

1. After login, click **"New Project"**
2. Fill in project details:
   - **Name**: `chatkit-backend-production`
   - **Region**: Choose closest to your users
     - US East (Ohio) - `us-east-2`
     - US West (Oregon) - `us-west-2`
     - Europe (Frankfurt) - `eu-central-1`
     - Asia Pacific (Singapore) - `ap-southeast-1`
   - **PostgreSQL Version**: 16 (latest)
   - **Compute Size**: 0.25 CU (free tier)

3. Click **"Create Project"**

### Step 3: Get Connection String

After project creation, Neon shows connection strings:

**Connection String** (copy this):
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Example**:
```
postgresql://chatkit_user:AbCd1234EfGh5678@ep-aged-waterfall-12345678.us-east-2.aws.neon.tech/chatkit_db?sslmode=require
```

**Components**:
- `user`: `chatkit_user` (auto-generated)
- `password`: `AbCd1234EfGh5678` (auto-generated, keep secret!)
- `host`: `ep-aged-waterfall-12345678.us-east-2.aws.neon.tech`
- `database`: `chatkit_db` (default: `neondb`)
- `sslmode=require`: SSL/TLS encryption enforced

**⚠️ Important**: Copy and save this connection string securely. You'll need it for Railway deployment.

---

## Step 4: Create Database Tables

Neon creates an empty database. You need to create the ChatKit tables.

### Option 1: Use Neon SQL Editor (Web)

1. In Neon dashboard, click **"SQL Editor"**
2. Run this SQL:

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create anon_sessions table
CREATE TABLE anon_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    anon_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create chat_sessions table
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    anon_id VARCHAR(255),
    title VARCHAR(500),
    messages JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_anon_sessions_session_id ON anon_sessions(session_id);
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to chat_sessions table
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Click **"Run"**
4. Verify tables created: Check **"Tables"** tab

### Option 2: Use Railway Backend (Automatic)

The ChatKit backend automatically creates tables on first run:

1. Deploy to Railway (see deployment script)
2. Tables auto-create when backend starts
3. Check Neon dashboard to verify

---

## Step 5: Configure Connection Settings

### Connection Pooling (Recommended)

Neon provides connection pooling via PgBouncer:

**Pooled Connection String**:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```

**Add `&pgbouncer=true`** to enable pooling.

**Why use pooling?**
- Reduces connection overhead
- Better performance for serverless deployments
- Recommended for Railway + Neon

### SSL/TLS Enforcement

Neon **requires** SSL connections:
- `sslmode=require` - Enforces SSL (recommended)
- `sslmode=verify-full` - Verifies certificate (stricter)

**Production**: Use `sslmode=require` (already in connection string)

---

## Step 6: Set Environment Variable in Railway

After getting Neon connection string:

```bash
railway variables set DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

**⚠️ Security**:
- Never commit DATABASE_URL to git
- Keep password secret
- Rotate password periodically (Neon dashboard → Settings → Reset Password)

---

## Monitoring & Management

### Neon Dashboard Features

**Metrics**:
- Database size (MB used)
- Query performance
- Active connections
- Compute hours used

**Branches**:
- Create database branches (like git)
- Use for development/staging
- Branch from production state

**Settings**:
- Reset database password
- Change compute size
- Configure auto-suspend
- Delete project

### Auto-Suspend Configuration

**Default**: Database auto-suspends after 5 minutes of inactivity

**Configure**:
1. Neon dashboard → Project → Settings
2. **Auto-suspend delay**: 5 minutes (recommended)
3. **Suspend compute on idle**: Enabled

**Impact**:
- First query after suspend: ~500ms cold start
- Subsequent queries: <50ms
- Saves compute hours on free tier

---

## Neon Branching (Advanced)

Create database branches for development:

### Create Development Branch

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# Create dev branch from main
neonctl branches create --project-id <project-id> --name dev

# Get dev branch connection string
neonctl connection-string dev
```

**Use cases**:
- **dev**: Local development
- **staging**: Pre-production testing
- **main**: Production

**Benefits**:
- Each branch is isolated
- Branch from production state (instant copy)
- Test migrations safely

---

## Troubleshooting

### Connection Timeout

**Symptom**: `could not connect to server: timeout`

**Causes**:
1. Database auto-suspended (cold start)
2. Firewall blocking port 5432
3. Invalid connection string

**Fix**:
```bash
# Test connection
psql "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Expected: PostgreSQL prompt
# If timeout: Check connection string, verify Neon dashboard shows "Active"
```

### SSL Certificate Verification Failed

**Symptom**: `SSL error: certificate verify failed`

**Fix**:
```bash
# Use sslmode=require instead of verify-full
# Update connection string:
postgresql://user:password@host/db?sslmode=require
```

### Too Many Connections

**Symptom**: `FATAL: sorry, too many clients already`

**Fix**:
```bash
# Enable connection pooling (PgBouncer)
# Add &pgbouncer=true to connection string
postgresql://user:password@host/db?sslmode=require&pgbouncer=true
```

---

## Cost Optimization

### Free Tier Best Practices

1. **Enable Auto-Suspend**: 5 minutes idle → suspend
2. **Use Connection Pooling**: Reduces active connections
3. **Monitor Compute Hours**: Neon dashboard → Usage
4. **Delete Unused Branches**: Keep only main + dev

### When to Upgrade (Neon Pro - $19/month)

- Storage > 512 MB
- Compute hours > 100/month
- Need longer auto-suspend delay
- Require point-in-time recovery

---

## Security Best Practices

### Connection String Security

✅ **DO**:
- Store in Railway environment variables
- Use `sslmode=require`
- Rotate password quarterly
- Limit database user permissions

❌ **DON'T**:
- Commit to git
- Share via email/Slack
- Use in client-side code
- Store in plain text files

### Database User Permissions

**Production**:
```sql
-- Create limited user for application
CREATE USER chatkit_app WITH PASSWORD 'secure_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE chatkit_db TO chatkit_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO chatkit_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO chatkit_app;
```

---

## Migration from Railway PostgreSQL

If you previously used Railway PostgreSQL:

### Step 1: Export Data from Railway

```bash
# Dump Railway database
railway run pg_dump $DATABASE_URL > backup.sql
```

### Step 2: Import to Neon

```bash
# Import to Neon
psql "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" < backup.sql
```

### Step 3: Update DATABASE_URL

```bash
railway variables set DATABASE_URL="<neon-connection-string>"
railway restart
```

---

## Support & Resources

**Neon Documentation**: https://neon.tech/docs
**Neon Discord**: https://discord.gg/neon
**Neon Status**: https://status.neon.tech

**ChatKit Integration**:
- [Railway + Neon Deployment Guide](./DEPLOYMENT_GUIDE_NEON.md)
- [Deployment Script](../deploy-to-railway-neon.sh)

---

## Summary Checklist

Before deployment, ensure:

- [ ] Neon account created
- [ ] Project created (region selected)
- [ ] Connection string copied and saved securely
- [ ] Database tables created (via SQL Editor or auto-create)
- [ ] Connection pooling enabled (`&pgbouncer=true`)
- [ ] SSL enforced (`sslmode=require`)
- [ ] Auto-suspend configured (5 minutes)
- [ ] Ready to set DATABASE_URL in Railway

---

**Guide Version**: 1.0
**Last Updated**: 2026-01-01
**Compatible with**: v0.4.0-observability-complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
