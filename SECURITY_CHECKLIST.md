# 🔒 Security Checklist - Post-Deployment

## ⚠️ CRITICAL: Execute Immediately After Vercel Deployment

Your credentials were shared during deployment setup. Follow these steps to secure your application.

---

## 🚨 Priority 1: Credential Rotation (15 minutes)

### Step 1: Reset Database Password

1. **Go to Supabase Dashboard**:
   <https://supabase.com/dashboard/project/wnaievjffghrzjtuvutp/settings/database>

2. **Scroll to "Database password" section**

3. **Click "Reset database password"**

4. **Copy the new password** (save temporarily)

5. **Update DATABASE_URL**:
   - Old: `postgresql://postgres.wnaievjffghrztjuvutp:Ssmm022587$$@...`
   - New: `postgresql://postgres.wnaievjffghrztjuvutp:NEW_PASSWORD_HERE@...`

6. **Update in Vercel**:
   - Go to: <https://vercel.com/dashboard>
   - Your project → Settings → Environment Variables
   - Find `DATABASE_URL` → Edit
   - Paste new connection string with new password
   - Save

7. **Redeploy**:
   - Deployments tab → Latest → "..." → Redeploy

### Step 2: Generate New JWT_SECRET

1. **Generate new secret**:

   ```bash
   openssl rand -base64 32
   ```

2. **Update in Vercel**:
   - Settings → Environment Variables
   - Edit `JWT_SECRET`
   - Paste new value
   - Save

3. **Redeploy again**

### Step 3: Consider Rotating Supabase Keys (Optional)

**If this is a production app with users:**

1. Go to: <https://supabase.com/dashboard/project/wnaievjffghrzjtuvutp/settings/api>

2. You can rotate the `service_role` key (requires plan upgrade)

3. For free tier: Keys don't rotate, but they require database password to be useful

---

## 🔐 Priority 2: Secure Git Repository (10 minutes)

### Check .gitignore

Verify these patterns are in `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.supabase
*.env

# Secret files
secrets/
*.key
*.pem
```

### Remove Secrets from Git History

If `.env.supabase` was committed:

```bash
# Install BFG Repo Cleaner (faster than git filter-branch)
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env.supabase from all commits
bfg --delete-files .env.supabase

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: Destructive)
git push --force
```

**OR** simpler but more disruptive:

1. Archive current repo
2. Create fresh repo
3. Copy code (excluding .env files)
4. Push to new repo
5. Update Vercel to point to new repo

### Update Repository Secrets

If you're using GitHub Actions:

1. Go to: <https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions>

2. Verify these secrets exist and are correct:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (with NEW password)
   - `JWT_SECRET` (NEW value)

---

## 🛡️ Priority 3: Enable Database Security (20 minutes)

### Enable Row Level Security (RLS) on Supabase

1. **Go to Supabase SQL Editor**:
   <https://supabase.com/dashboard/project/wnaievjffghrzjtuvutp/sql>

2. **Run this for each table**:

   ```sql
   -- Enable RLS
   ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
   
   -- Example policy: Users can only see their own data
   CREATE POLICY "Users can view own data" ON shipments
     FOR SELECT
     USING (auth.uid() = user_id);
   
   -- Example policy: Authenticated users can insert
   CREATE POLICY "Authenticated users can create" ON shipments
     FOR INSERT
     WITH CHECK (auth.uid() IS NOT NULL);
   ```

3. **Verify RLS is enabled**:

   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

### Configure Supabase Auth

1. **Go to**: <https://supabase.com/dashboard/project/wnaievjffghrzjtuvutp/auth/users>

2. **Enable auth providers** (if using):
   - Email/Password
   - Magic Links
   - OAuth (Google, GitHub, etc.)

3. **Configure email templates** (if using email auth)

4. **Set redirect URLs**:
   - Add your Vercel URL: `https://your-app.vercel.app/**`

---

## 🔍 Priority 4: Security Monitoring (15 minutes)

### Enable Supabase Audit Logs

1. **Go to**: <https://supabase.com/dashboard/project/wnaievjffghrzjtuvutp/logs/postgres-logs>

2. **Set up filters**:
   - Failed login attempts
   - Unauthorized access attempts
   - Slow queries

### Configure Rate Limiting

Already configured in code, but verify:

- API routes have rate limiters
- Middleware is in correct order
- Check `apps/api/src/middleware/security.js`

### Set Up Alerts

**Supabase alerts**:

1. Settings → Billing → Alerts
2. Set alerts for:
   - Database size (near 500MB limit)
   - API requests (near 50k/month limit)
   - Storage usage

**Vercel alerts**:

1. Settings → Notifications
2. Enable:
   - Deployment failures
   - High error rates
   - Quota warnings

---

## 📊 Priority 5: Verify Security Headers (5 minutes)

Check your deployed site:

```bash
# Test security headers
curl -I https://your-app.vercel.app

# Should see these headers:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
# - Content-Security-Policy
```

Use online tools:

- <https://securityheaders.com>
- <https://observatory.mozilla.org>

Target: **A or A+** rating

---

## ✅ Security Checklist

Copy this to track your progress:

### Immediate (Today)

- [ ] Reset Supabase database password
- [ ] Update DATABASE_URL in Vercel with new password
- [ ] Generate new JWT_SECRET
- [ ] Update JWT_SECRET in Vercel
- [ ] Redeploy Vercel application
- [ ] Verify deployment works with new credentials

### This Week

- [ ] Verify .env.supabase is in .gitignore
- [ ] Remove .env.supabase from git history (if committed)
- [ ] Enable RLS on all Supabase tables
- [ ] Create RLS policies for each table
- [ ] Configure Supabase auth providers
- [ ] Set up Supabase alerts
- [ ] Set up Vercel alerts
- [ ] Run security headers test

### This Month

- [ ] Set up Sentry error tracking
- [ ] Configure CORS properly
- [ ] Review API rate limits
- [ ] Set up uptime monitoring
- [ ] Create incident response plan
- [ ] Document security procedures
- [ ] Schedule security audit/review

---

## 🆘 If Something Goes Wrong

### Database locked out (wrong password)

1. Go to Supabase → Settings → Database
2. Reset password again
3. Update DATABASE_URL in Vercel
4. Redeploy

### Application not loading

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all 6 environment variables are set
4. Try redeploying

### Database connection errors

1. Check DATABASE_URL format
2. Verify password doesn't have special chars that need URL encoding
3. Use `encodeURIComponent()` for password in connection string
4. Try direct connection instead of pooler

---

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Vercel Security](https://vercel.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

## 🎯 Success Criteria

After completing this checklist:

- ✅ No credentials in git history
- ✅ All secrets rotated after exposure
- ✅ RLS enabled on database
- ✅ Security headers configured
- ✅ Monitoring and alerts active
- ✅ Application deployed and working

**Your application is now production-ready and secure!** 🔒
