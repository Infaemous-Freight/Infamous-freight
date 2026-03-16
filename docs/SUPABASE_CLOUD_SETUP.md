# Supabase Cloud Setup Guide - Automated 100%

## 🚀 Quick Start (5 Minutes)

### Prerequisites

1. **Supabase Account**: Sign up at [https://supabase.com](https://supabase.com)
2. **GitHub Account**: For authentication
3. **Terminal Access**: Command line with bash

### Automated Setup (Recommended)

Run the automated setup script:

```bash
cd /workspaces/Infamous-freight-enterprises
./scripts/setup-supabase-cloud.sh
```

The script will:

1. ✅ Install Supabase CLI (if needed)
2. ✅ Login to Supabase
3. ✅ Link to your project
4. ✅ Push all database migrations
5. ✅ Deploy Edge Functions
6. ✅ Create `.env.local` with credentials
7. ✅ Generate TypeScript types

---

## 📋 Manual Setup (Alternative)

If you prefer manual setup or encounter issues:

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **+ New Project**
3. Fill in details:
   - **Name**: `Infæmous Freight Enterprises`
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (upgrade later if needed)
4. Click **Create new project**
5. Wait ~2 minutes for project setup

### Step 2: Get Project Credentials

1. Navigate to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys** → **anon** **public**: `eyJhbGci...`
   - **Project API keys** → **service_role**: `eyJhbGci...` (keep secret!)
3. Navigate to **Settings** → **General**
4. Copy **Reference ID**: `xxxxx`

### Step 3: Configure Local Environment

Create `apps/web/.env.local`:

```bash
cd apps/web
cat > .env.local <<EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Server-side only (KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Project Reference
SUPABASE_PROJECT_REF=xxxxx
EOF
```

### Step 4: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 5: Link to Project

```bash
cd /workspaces/Infamous-freight-enterprises
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 6: Push Database Migrations

```bash
cd /workspaces/Infamous-freight-enterprises
supabase db push
```

Expected output:

```
Applying migration 20260201000000_initial_schema.sql...
Applying migration 20260201000001_rls_policies.sql...
Applying migration 20260201000002_seed_data.sql...
Applying migration 20260201000003_storage_setup.sql...
✓ All migrations applied successfully
```

### Step 7: Deploy Edge Functions

```bash
cd /workspaces/Infamous-freight-enterprises

# Deploy analytics function
supabase functions deploy analytics --no-verify-jwt

# Deploy shipment-tracking function
supabase functions deploy shipment-tracking --no-verify-jwt
```

### Step 8: Generate TypeScript Types

```bash
cd /workspaces/Infamous-freight-enterprises
pnpm supabase:types
```

This creates `apps/web/src/types/database.ts` with your database schema types.

### Step 9: Restart Web App

```bash
cd apps/web
pnpm dev
```

---

## 🔍 Verification

### 1. Check Database Tables

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor**
4. Verify these tables exist:
   - ✅ `organizations`
   - ✅ `users`
   - ✅ `drivers`
   - ✅ `customers`
   - ✅ `shipments`
   - ✅ `shipment_events`
   - ✅ `invoices`
   - ✅ `invoice_items`
   - ✅ `audit_logs`

### 2. Check Row Level Security (RLS)

1. Navigate to **Authentication** → **Policies**
2. Verify RLS policies exist for each table
3. Total policies: **40+**

### 3. Check Storage Buckets

1. Navigate to **Storage**
2. Verify these buckets exist:
   - ✅ `shipment-documents`
   - ✅ `driver-documents`
   - ✅ `invoices`
   - ✅ `organization-logos`
   - ✅ `avatars`

### 4. Check Edge Functions

1. Navigate to **Edge Functions**
2. Verify these functions are deployed:
   - ✅ `analytics` (v1.0.0)
   - ✅ `shipment-tracking` (v1.0.0)

### 5. Test Connection from Web App

```bash
cd apps/web
pnpm dev
```

Open browser: [http://localhost:3000](http://localhost:3000)

Check browser console for Supabase connection:

```javascript
// Should see real Supabase client, not mock
console.log(supabase);
// Output: SupabaseClient { ... }
```

---

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Import repository: `MrMiless44/Infamous-freight`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
4. Add environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (sensitive!)
   ```

5. Deploy!

### Option 2: Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub: `MrMiless44/Infamous-freight`
4. Configure build settings:
   - **Base directory**: `apps/web`
   - **Build command**: `pnpm build`
   - **Publish directory**: `apps/web/.next`
5. Add environment variables (same as Vercel)
6. Deploy!

### Option 3: Docker + Fly.io

```bash
cd apps/web
docker build -t infamous-freight-web .
fly deploy
```

---

## 📊 Database Schema Overview

### Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'dispatcher', 'driver', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Shipments Table

```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL DEFAULT generate_tracking_number(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  driver_id UUID REFERENCES drivers(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  pickup_location JSONB NOT NULL,
  delivery_location JSONB NOT NULL,
  scheduled_pickup TIMESTAMPTZ,
  scheduled_delivery TIMESTAMPTZ,
  actual_pickup TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Full schema**: See `supabase/migrations/20260201000000_initial_schema.sql`

---

## 🔐 Security Best Practices

### 1. Environment Variables

✅ **DO**:

- Store in `.env.local` (gitignored)
- Use `NEXT_PUBLIC_` prefix for client-side vars
- Keep `SERVICE_ROLE_KEY` server-side only

❌ **DON'T**:

- Commit `.env.local` to git
- Expose `SERVICE_ROLE_KEY` to client
- Hardcode credentials in code

### 2. Row Level Security (RLS)

All tables have RLS enabled:

```sql
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org shipments"
  ON shipments FOR SELECT
  USING (organization_id = get_user_organization_id());
```

### 3. Storage Policies

All buckets have access policies:

```sql
CREATE POLICY "Org members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shipment-documents' AND
    (storage.foldername(name))[1] = get_user_organization_id()::text
  );
```

---

## 🛠️ Troubleshooting

### Issue: "Supabase CLI not found"

**Solution**:

```bash
npm install -g supabase
# or
npx supabase login
```

### Issue: "Permission denied when installing globally"

**Solution**:

```bash
# Use npx instead
npx supabase login
npx supabase link --project-ref YOUR_REF

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: "Migration already applied"

**Solution**:

```bash
# Reset database (WARNING: deletes all data)
supabase db reset

# Or apply specific migration
supabase migration up --include-name 20260201000000_initial_schema
```

### Issue: "Cannot find module '@/types/database'"

**Solution**:

```bash
# Regenerate types
cd /workspaces/Infamous-freight-enterprises
pnpm supabase:types
```

### Issue: "Network error when connecting to Supabase"

**Solution**:

1. Check project URL in `.env.local`
2. Verify project is active (not paused)
3. Check API keys are correct
4. Ensure project region is accessible

### Issue: "RLS policy blocks access"

**Solution**:

```bash
# Temporarily disable RLS for testing (NOT in production!)
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;

# Or use service_role key for admin access (server-side only)
const supabase = createClient(url, serviceRoleKey)
```

---

## 📚 Additional Resources

### Official Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

### Project Documentation

- [SUPABASE_100_COMPLETE.md](../SUPABASE_100_COMPLETE.md) - Full implementation
  guide
- [SUPABASE_QUICK_START.md](../SUPABASE_QUICK_START.md) - Quick reference
- [SUPABASE_IMPLEMENTATION_SUMMARY.md](../SUPABASE_IMPLEMENTATION_SUMMARY.md) -
  Architecture overview

### Support

- **GitHub Issues**:
  [MrMiless44/Infamous-freight/issues](https://github.com/MrMiless44/Infamous-freight/issues)
- **Supabase Discord**:
  [https://discord.supabase.com](https://discord.supabase.com)

---

## ✅ Setup Complete Checklist

- [ ] Supabase project created
- [ ] Database migrations applied (4 migrations)
- [ ] Row Level Security policies active (40+ policies)
- [ ] Storage buckets created (5 buckets)
- [ ] Edge Functions deployed (2 functions)
- [ ] Environment variables configured
- [ ] TypeScript types generated
- [ ] Web app running with Supabase
- [ ] Can authenticate users
- [ ] Can query database
- [ ] Can upload files to storage
- [ ] Production environment configured

**Completion Time**: ~10-15 minutes

---

**Last Updated**: February 1, 2026 **Version**: 1.0.0 **Status**: Complete ✅
