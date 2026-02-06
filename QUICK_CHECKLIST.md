# Quick Setup Checklist

Print this or keep it open while setting up CI/CD.

## ✅ Server Setup (Run on your VPS)

- [ ] **Step 1:** Connect to server: `ssh root@your-server-ip`
- [ ] **Step 2:** Generate SSH key: `ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""`
- [ ] **Step 3:** Add to authorized_keys: `cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys`
- [ ] **Step 4:** Set permissions: `chmod 600 ~/.ssh/github_actions_deploy && chmod 644 ~/.ssh/authorized_keys`
- [ ] **Step 5:** Copy private key: `cat ~/.ssh/github_actions_deploy` (COPY THE OUTPUT!)
- [ ] **Step 6:** Note server IP: `hostname -I`
- [ ] **Step 7:** Verify directories exist: `ls /var/www/staging` and `ls /var/www/production`
- [ ] **Step 8:** Create log directory: `mkdir -p /var/log/jewellery`

## ✅ GitHub Setup (In your browser)

- [ ] **Step 9:** Go to: `https://github.com/Michaelanand123singh/jewellery/settings/secrets/actions`
- [ ] **Step 10:** Add `STAGING_HOST` = your server IP
- [ ] **Step 11:** Add `STAGING_SSH_USER` = `root`
- [ ] **Step 12:** Add `STAGING_SSH_KEY` = paste private key from Step 5
- [ ] **Step 13:** Add `PRODUCTION_HOST` = your server IP
- [ ] **Step 14:** Add `PRODUCTION_SSH_USER` = `root`
- [ ] **Step 15:** Add `PRODUCTION_SSH_KEY` = paste same private key

## ✅ Verification

- [ ] **Step 16:** Test SSH: `ssh -i ~/.ssh/github_actions_deploy root@localhost`
- [ ] **Step 17:** Go to GitHub Actions tab
- [ ] **Step 18:** Click "Deploy to Staging" → "Run workflow"
- [ ] **Step 19:** Watch it run (should complete successfully)
- [ ] **Step 20:** Check PM2: `pm2 status` (should show apps running)

## ✅ Test Deployment

- [ ] **Step 21:** Push to `staging` branch → Should auto-deploy
- [ ] **Step 22:** Push to `main` branch → Should auto-deploy
- [ ] **Step 23:** Verify apps are running: `pm2 status`
- [ ] **Step 24:** Test health endpoints: `curl https://staging.adorneluxejewels.com/api/health`

---

## 🎯 Quick Commands Reference

```bash
# Generate SSH key (all in one)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N "" && \
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys && \
chmod 600 ~/.ssh/github_actions_deploy && \
chmod 644 ~/.ssh/authorized_keys && \
cat ~/.ssh/github_actions_deploy

# Check PM2 status
pm2 status

# View logs
pm2 logs jewellery-staging
pm2 logs jewellery-production

# Restart apps
pm2 restart jewellery-staging
pm2 restart jewellery-production
```

---

**Full detailed guide:** See `STEP_BY_STEP_SETUP.md`

