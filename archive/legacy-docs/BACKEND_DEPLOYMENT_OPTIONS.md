# Backend Deployment Options - Quick Start Guide

**Choose your deployment platform below and follow the steps.**

---

## Option A: Railway.app (⭐ Recommended - Easiest)

Railway is the fastest way to deploy your Express.js backend.

### Prerequisites

- GitHub account (already have)
- Railway account (free): https://railway.app

### Step-by-Step Deployment

1. **Connect Repository to Railway**

   ```bash
   # Visit Railway and click "New Project"
   # Select "Deploy from GitHub"
   # Connect MrMiless44/Infamous-freight-enterprises
   # Select "api" service
   ```

2. **Set Environment Variables**

   ```bash
   # In Railway dashboard → Project Settings → Variables
   DATABASE_URL=postgresql://user:pass@host:5432/infamousfreight
   AUTH_SECRET=your-secret-key-here
   AI_PROVIDER=synthetic
   NODE_ENV=production
   ```

3. **Configure Start Command**

   ```bash
   # Railway auto-detects from package.json
   # Should use: node src/server.js
   ```

4. **Deploy**

   ```bash
   # Push to main branch
   git push origin main
   # Railway auto-deploys from GitHub
   ```

5. **Verify**
   ```bash
   # Visit provided Railway URL
   # Check health: https://your-app.railway.app/api/health
   ```

### Pros

- ✅ Easiest setup
- ✅ Auto-deploys from GitHub
- ✅ Free tier available
- ✅ Great documentation
- ✅ Built-in PostgreSQL database option

### Cons

- Limited free tier
- Requires Railway account

---

## Option B: Fly.io (Great Performance)

Fly.io offers excellent performance and is production-ready.

### Prerequisites

- Fly.io account: https://fly.io
- Flyctl CLI: `brew install flyctl`

### Step-by-Step Deployment

1. **Login to Fly.io**

   ```bash
   flyctl auth login
   ```

2. **Launch Application**

   ```bash
   # From repository root
   flyctl launch
   # Choose:
   # - App name: infamous-freight-api
   # - Region: closest to your users
   # - Build with Dockerfile: yes
   # - Postgres: yes (for managed database)
   ```

3. **Configure Environment Variables**

   ```bash
   flyctl secrets set DATABASE_URL="postgresql://..."
   flyctl secrets set AUTH_SECRET="your-secret"
   flyctl secrets set AI_PROVIDER="synthetic"
   ```

4. **Deploy**

   ```bash
   flyctl deploy
   # OR push to trigger auto-deploy:
   git push origin main
   ```

5. **Verify**
   ```bash
   flyctl status
   flyctl logs
   # Visit: https://infamous-freight-api.fly.dev/api/health
   ```

### Pros

- ✅ Excellent performance globally
- ✅ Free tier available
- ✅ Built-in PostgreSQL
- ✅ Auto-scaling
- ✅ Very reliable

### Cons

- Requires CLI tool
- Steeper learning curve than Railway

---

## Option C: Heroku (Classic)

Heroku is still popular for quick deployments (note: free tier ended).

### Prerequisites

- Heroku account: https://heroku.com
- Heroku CLI: `brew install heroku`

### Step-by-Step Deployment

1. **Login to Heroku**

   ```bash
   heroku login
   ```

2. **Create Application**

   ```bash
   heroku create infamous-freight-api
   # Or use dashboard
   ```

3. **Add PostgreSQL Database**

   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

4. **Set Environment Variables**

   ```bash
   heroku config:set AUTH_SECRET="your-secret-key"
   heroku config:set AI_PROVIDER="synthetic"
   heroku config:set NODE_ENV="production"
   # DATABASE_URL is set automatically
   ```

5. **Deploy**

   ```bash
   # Deploy from Git
   git push heroku main
   # OR if on different branch:
   git push heroku develop:main
   ```

6. **Verify**
   ```bash
   heroku logs --tail
   # Visit: https://infamous-freight-api.herokuapp.com/api/health
   ```

### Pros

- ✅ Very straightforward
- ✅ Built-in Postgres
- ✅ Auto-deploys from Git push
- ✅ Good documentation

### Cons

- Paid tier (Dynos are not free anymore)
- Can be expensive for 24/7 apps
- Less control over infrastructure

---

## Option D: Docker Compose (Self-Hosted)

Deploy using Docker Compose to your own server or VPS.

### Prerequisites

- Docker & Docker Compose installed on your server
- Ubuntu/Linux server with SSH access (DigitalOcean, AWS, Linode, etc.)
- PostgreSQL server (included in docker-compose)

### Step-by-Step Deployment

1. **Copy Files to Server**

   ```bash
   # From your local machine
   scp -r .github/ docker-compose.prod.yml .env.production user@server:~/app/
   scp -r apps/api/ user@server:~/app/
   scp -r packages/shared user@server:~/app/
   ```

2. **SSH into Server**

   ```bash
   ssh user@server
   cd ~/app
   ```

3. **Create .env.production**

   ```bash
   cat > .env.production << 'EOF'
   DATABASE_URL=postgresql://postgres:password@db:5432/infamousfreight
   AUTH_SECRET=your-secret-key-here
   AI_PROVIDER=synthetic
   NODE_ENV=production
   API_PORT=4000
   EOF
   ```

4. **Build and Run**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   # Verify services running:
   docker ps
   ```

5. **Check Health**

   ```bash
   curl http://localhost:4000/api/health
   # Should return: {"status":"ok","database":"connected"}
   ```

6. **Setup Reverse Proxy (Nginx)**

   ```bash
   # Install Nginx
   sudo apt install nginx

   # Configure as reverse proxy
   sudo nano /etc/nginx/sites-available/default
   ```

   Add this config:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

   ```bash
   # Restart Nginx
   sudo systemctl restart nginx
   ```

7. **Setup SSL (Certbot)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Pros

- ✅ Complete control
- ✅ No vendor lock-in
- ✅ Can be very affordable
- ✅ Full customization

### Cons

- ⚠️ You manage the server
- ⚠️ Responsible for uptime/security
- ⚠️ More complex setup

---

## Option E: AWS Elastic Beanstalk

Deploy to AWS for enterprise reliability.

### Prerequisites

- AWS account
- AWS CLI configured
- Elastic Beanstalk EB CLI

### Quick Deploy

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-20 infamous-freight-api --region us-east-1

# Create environment and deploy
eb create production
eb setenv DATABASE_URL="postgresql://..." AUTH_SECRET="..."

# Deploy updated code
git push
# (with GitHub actions setup)
```

---

## Comparison Table

| Feature     | Railway      | Fly.io       | Heroku     | Docker         | AWS            |
| ----------- | ------------ | ------------ | ---------- | -------------- | -------------- |
| Setup Time  | ⚡ 5 min     | ⚡ 10 min    | ⚡ 10 min  | ⏱️ 30 min      | ⏱️ 45 min      |
| Ease        | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐         | ⭐⭐           |
| Cost        | 💰 $5-50/mo  | 💰 Free tier | 💰 $50+/mo | 💰 $3-20/mo    | 💰 $10-100+/mo |
| Performance | ⚡ Very Good | ⚡ Excellent | ⚡ Good    | ⚡⚡ Excellent | ⚡⚡ Excellent |
| Control     | 🔒 Limited   | 🔒 Good      | 🔒 Limited | 🔓 Full        | 🔓 Full        |
| Reliability | ✅ 99.9%     | ✅ 99.99%    | ✅ 99.95%  | ⚠️ Depends     | ✅ 99.99%+     |
| Postgres    | ✅ Yes       | ✅ Yes       | ✅ Yes     | ✅ Yes         | ✅ Yes         |
| Auto-scale  | ✅ Yes       | ✅ Yes       | ✅ Yes     | ⚠️ Manual      | ✅ Yes         |

---

## Quick Decision Guide

**Choose Railway if:**

- You want the fastest setup
- You're comfortable with their pricing
- You want simplicity

**Choose Fly.io if:**

- You want excellent global performance
- You want great free tier
- You're willing to learn CLI

**Choose Heroku if:**

- You want traditional PaaS
- You're willing to pay premium
- You value stability

**Choose Docker if:**

- You want full control
- You have server access
- You prefer cost savings
- You want to learn DevOps

**Choose AWS if:**

- You need enterprise features
- You want to consolidate services
- You need compliance certifications

---

## Post-Deployment Checklist

After deploying to your chosen platform:

```bash
# 1. Verify API is running
curl https://your-api-url/api/health
# Expected: {"status":"ok","database":"connected"}

# 2. Test authentication endpoint
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 3. Check logs for errors
# Platform-specific (see above)

# 4. Monitor uptime
# Set up monitoring service (Uptime Robot, etc.)

# 5. Setup error tracking
# Sentry dashboard: https://sentry.io

# 6. Configure database backups
# Automated backups from your platform
```

---

## Troubleshooting

### "Database connection refused"

```bash
# 1. Verify DATABASE_URL environment variable is set
# 2. Check database service is running
# 3. Verify network connectivity
# 4. Check database credentials in .env
```

### "Port already in use"

```bash
# Change port in .env
API_PORT=4001
# Restart application
```

### "Cannot find module '@prisma/client'"

```bash
# Rebuild Prisma client
pnpm prisma generate
# Rebuild and redeploy
```

---

## Next Steps

1. **Choose your platform** from above
2. **Follow the deployment steps**
3. **Verify with health check**
4. **Update your frontend** to point to new API URL
5. **Monitor logs** for any issues

---

**Frontend is already live on Vercel!**  
You just need to deploy the backend to complete the full stack. 🚀

**Questions?** Check the DEPLOYMENT_GUIDE.md in the repository for more details.
