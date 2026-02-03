# 🚀 QUICK START: Deploy to 100%

**Time to Deploy**: 10 minutes  
**Difficulty**: Easy  
**Requirements**: GitHub account, Fly.io account (free)

---

## ⚡ FASTEST PATH TO 100%

### 1. Run the Deployment Script

```bash
./deploy-to-world-100.sh
```

That's it! The script will:
- ✅ Install Fly.io CLI
- ✅ Guide you through authentication
- ✅ Create the app
- ✅ Set up database
- ✅ Deploy everything
- ✅ Verify it works

**Follow the prompts and you'll be live in ~10 minutes!**

---

## 📋 OR: Manual 3-Step Deploy

### Step 1: Install & Login (2 minutes)

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"

# Login (opens browser)
flyctl auth login
```

### Step 2: Deploy API (5 minutes)

```bash
# Deploy with one command
flyctl deploy --remote-only
```

### Step 3: Verify (1 minute)

```bash
# Check it works
./verify-100-deployment.sh
```

**Done! You're at 100%! 🎉**

---

## 🔐 GitHub Actions Auto-Deploy

Want automatic deployments on every push?

### 1. Get Your Fly.io Token

```bash
flyctl auth token
```

### 2. Add to GitHub Secrets

1. Go to: https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions
2. Click "New repository secret"
3. Name: `FLY_API_TOKEN`
4. Value: [paste token from step 1]
5. Click "Add secret"

### 3. Push to Deploy

```bash
git push origin main
```

Watch it deploy automatically! 🚀

---

## 🌐 Your Live URLs

After deployment:

- **Web App**: https://infamous-freight-enterprises.vercel.app
- **API**: https://infamous-freight.fly.dev
- **Health**: https://infamous-freight.fly.dev/api/health

---

## ❓ Need Help?

### Quick Commands

```bash
# View status
flyctl status -a infamous-freight

# View logs
flyctl logs -a infamous-freight

# Re-deploy
flyctl deploy --remote-only

# Verify everything
./verify-100-deployment.sh
```

### Full Documentation

- [Complete Guide](DEPLOY_TO_WORLD_100_GUIDE.md) - Detailed instructions
- [GitHub Secrets](GITHUB_ACTIONS_SECRETS_SETUP.md) - CI/CD setup
- [Fly.io Guide](FLY_IO_DEPLOYMENT_GUIDE.md) - Platform details

---

## 🎯 Troubleshooting

**Problem**: Script fails at authentication  
**Solution**: Run `flyctl auth login` manually

**Problem**: Build fails  
**Solution**: Try `flyctl deploy --remote-only` (uses cloud builder)

**Problem**: Health check fails  
**Solution**: Wait 2 minutes, app may still be starting

**Still stuck?** Check [DEPLOY_TO_WORLD_100_GUIDE.md](DEPLOY_TO_WORLD_100_GUIDE.md) troubleshooting section

---

**Ready? Let's deploy!**

```bash
./deploy-to-world-100.sh
```

🌍 → 100% → 🎉
