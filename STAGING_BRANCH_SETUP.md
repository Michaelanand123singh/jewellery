# Staging Branch Setup Complete

## ✅ What Was Done

1. **Created staging branch** from main
2. **Pushed staging branch** to GitHub
3. **Configured `/var/www/staging`** to use staging branch
4. **Configured `/var/www/production`** to use main branch

## 📋 Branch Structure

```
main (production)
  └── Deploys to: /var/www/production
  └── Domain: adorneluxejewels.com
  └── Port: 3000
  └── PM2: jewellery-production

staging (staging)
  └── Deploys to: /var/www/staging
  └── Domain: staging.adorneluxejewels.com
  └── Port: 3001
  └── PM2: jewellery-staging
```

## 🚀 How It Works

### Staging Deployment

When you push to `staging` branch:
1. GitHub Actions triggers "Deploy to Staging" workflow
2. Code is deployed to `/var/www/staging`
3. PM2 restarts `jewellery-staging`
4. Available at: `https://staging.adorneluxejewels.com`

### Production Deployment

When you push to `main` branch:
1. GitHub Actions triggers "Deploy to Production" workflow
2. Code is deployed to `/var/www/production`
3. PM2 restarts `jewellery-production`
4. Available at: `https://adorneluxejewels.com`

## 🔄 Workflow

### Typical Development Flow

```bash
# 1. Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push to staging for testing
git push origin feature/my-feature
# Create PR to staging branch

# 4. After testing, merge to staging
git checkout staging
git merge feature/my-feature
git push origin staging  # Auto-deploys to staging

# 5. When ready for production, merge staging to main
git checkout main
git merge staging
git push origin main  # Auto-deploys to production
```

## 📝 Quick Commands

### Switch Branches Locally

```bash
# Work on staging
git checkout staging
git pull origin staging

# Work on production
git checkout main
git pull origin main
```

### Deploy to Staging

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin staging  # Auto-deploys!
```

### Deploy to Production

```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main  # Auto-deploys!
```

## ✅ Verification

### Check Branch Status

```bash
# Staging directory
cd /var/www/staging
git branch --show-current  # Should show: staging
git status

# Production directory
cd /var/www/production
git branch --show-current  # Should show: main
git status
```

### Test Staging Deployment

1. Make a small change
2. Push to staging branch:
   ```bash
   git checkout staging
   # Make change
   git add .
   git commit -m "Test staging deployment"
   git push origin staging
   ```
3. Check GitHub Actions: https://github.com/Michaelanand123singh/jewellery/actions
4. Verify deployment at: https://staging.adorneluxejewels.com

## 🎯 Current Status

- ✅ Staging branch created and pushed
- ✅ `/var/www/staging` configured for staging branch
- ✅ `/var/www/production` configured for main branch
- ✅ GitHub Actions workflows ready
- ✅ PM2 apps running on both environments

## 🔧 Troubleshooting

### If Staging Branch Doesn't Deploy

1. **Check GitHub Actions:**
   - Go to Actions tab
   - Look for "Deploy to Staging" workflow
   - Check if it triggered on push to staging

2. **Verify branch name:**
   ```bash
   git branch -a | grep staging
   ```

3. **Check workflow file:**
   - `.github/workflows/deploy-staging.yml`
   - Should trigger on `push: branches: - staging`

### If Staging Directory is Wrong Branch

```bash
cd /var/www/staging
git fetch origin
git checkout staging
git pull origin staging
```

---

**🎉 Staging branch is now set up and ready for deployments!**

