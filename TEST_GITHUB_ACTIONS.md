# Test GitHub Actions Deployment

## ✅ Server Setup Verified

Your server setup is complete! Now let's test the GitHub Actions deployment.

---

## Step 1: Test via GitHub Actions UI

### Option A: Manual Trigger (Recommended for First Test)

1. **Go to GitHub:**
   - Open: `https://github.com/Michaelanand123singh/jewellery`

2. **Click on "Actions" tab** (top menu)

3. **Select "Deploy to Staging" workflow** (left sidebar)

4. **Click "Run workflow" button** (top right, next to "Filter" button)

5. **Select branch:**
   - Choose: `staging`
   - Click green **"Run workflow"** button

6. **Watch the workflow run:**
   - You'll see a new workflow run appear
   - Click on it to see the progress
   - Each step should show a green checkmark ✅ when complete

### What to Look For:

✅ **Green checkmarks** = Success
- "Checkout code" ✅
- "Setup Node.js" ✅
- "Install dependencies" ✅
- "Run linter" ✅ (may show warning, that's OK)
- "Run tests" ✅ (may show warning, that's OK)
- "Build application" ✅
- **"Deploy to staging server"** ✅ ← This is the important one!
- "Health check" ✅

❌ **Red X** = Failure
- Click on the failed step to see error details
- Check the logs for specific error messages

---

## Step 2: Verify Deployment on Server

After the GitHub Actions workflow completes, verify on your server:

```bash
# Check PM2 status
pm2 status

# Should show:
# - jewellery-staging (online)
# - jewellery-production (online)

# Check recent logs
pm2 logs jewellery-staging --lines 20

# Check if app is responding
curl http://localhost:3001/api/health
# Or if you have domain:
curl https://staging.adorneluxejewels.com/api/health
```

---

## Step 3: Test Automatic Deployment

### Test Staging Deployment:

1. **Make a small change** to your code (on your local machine):
   ```bash
   cd /path/to/your/local/jewellery/repo
   git checkout staging
   # Make a small change (like updating a comment in a file)
   git add .
   git commit -m "Test staging deployment"
   git push origin staging
   ```

2. **Watch GitHub Actions:**
   - Go to Actions tab
   - You should see a new workflow automatically start
   - It will deploy to staging automatically

### Test Production Deployment:

1. **Make a small change** to your code:
   ```bash
   git checkout main
   # Make a small change
   git add .
   git commit -m "Test production deployment"
   git push origin main
   ```

2. **Watch GitHub Actions:**
   - Go to Actions tab
   - You should see "Deploy to Production" workflow start
   - It will deploy to production automatically

---

## Step 4: Check Application Status

### On Server:

```bash
# View PM2 dashboard
pm2 monit

# Or check status
pm2 status

# View logs
pm2 logs jewellery-staging --lines 50
pm2 logs jewellery-production --lines 50

# Restart if needed
pm2 restart jewellery-staging
pm2 restart jewellery-production
```

### Check Health Endpoints:

```bash
# Staging
curl https://staging.adorneluxejewels.com/api/health

# Production
curl https://adorneluxejewels.com/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-02-06T..."
}
```

---

## Troubleshooting

### If GitHub Actions Fails to Connect:

**Error: "Permission denied (publickey)"**

1. **Verify SSH key in GitHub Secrets:**
   - Go to Settings → Secrets
   - Check that `STAGING_SSH_KEY` and `PRODUCTION_SSH_KEY` are set
   - Make sure the key includes BEGIN and END lines

2. **Test SSH manually on server:**
   ```bash
   ssh -i ~/.ssh/github_actions_deploy root@localhost
   ```

3. **Check authorized_keys:**
   ```bash
   grep "github-actions-deploy" ~/.ssh/authorized_keys
   ```

### If Deployment Fails:

**Error: "Command failed"**

1. **Check GitHub Actions logs:**
   - Click on the failed step
   - Read the error message
   - Look for specific commands that failed

2. **Common issues:**
   - Missing dependencies: Check if `npm ci` works
   - Build errors: Check Node.js version (needs 20+)
   - Permission errors: Check file permissions
   - Database connection: Check `.env` file

### If Application Doesn't Start:

1. **Check PM2:**
   ```bash
   pm2 status
   pm2 logs jewellery-staging
   ```

2. **Check environment variables:**
   ```bash
   cd /var/www/staging
   cat .env  # Verify all required vars are set
   ```

3. **Restart manually:**
   ```bash
   cd /var/www/staging
   pm2 restart jewellery-staging
   ```

---

## Success Indicators

✅ **Everything is working if:**
- GitHub Actions workflow completes with all green checkmarks
- PM2 shows apps as "online"
- Health endpoints return JSON with status "ok"
- You can access the websites in browser
- Changes pushed to git automatically deploy

---

## Quick Test Commands

```bash
# On server - check everything
pm2 status && \
echo "---" && \
curl -s http://localhost:3001/api/health | head -5 && \
echo "---" && \
curl -s http://localhost:3000/api/health | head -5

# Check recent deployments
cd /var/www/staging && git log --oneline -5
cd /var/www/production && git log --oneline -5
```

---

**🎉 Once all tests pass, your CI/CD is fully operational!**

