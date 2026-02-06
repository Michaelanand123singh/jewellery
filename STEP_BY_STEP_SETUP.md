# Step-by-Step CI/CD Setup Guide

Follow these steps in order to set up your CI/CD pipeline.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- ✅ Access to your VPS server via SSH
- ✅ GitHub repository: `https://github.com/Michaelanand123singh/jewellery`
- ✅ Node.js 20+ installed on server
- ✅ PM2 installed on server
- ✅ Git repositories at `/var/www/staging` and `/var/www/production`

---

## STEP 1: Connect to Your Server

```bash
# Open your terminal and connect to your server
ssh root@your-server-ip

# Replace 'your-server-ip' with your actual server IP address
# Example: ssh root@123.45.67.89
```

**Expected result:** You should be logged into your server.

---

## STEP 2: Generate SSH Key for GitHub Actions

Run this command on your server:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
```

**What happens:**
- Creates a new SSH key pair
- Saves it as `github_actions_deploy` in your `.ssh` folder
- No passphrase (so GitHub Actions can use it automatically)

**Expected output:**
```
Generating public/private ed25519 key pair.
Your identification has been saved in /root/.ssh/github_actions_deploy
Your public key has been saved in /root/.ssh/github_actions_deploy.pub
```

---

## STEP 3: Add Public Key to Authorized Keys

```bash
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
```

**What this does:** Allows the key to connect to your server.

---

## STEP 4: Set Proper File Permissions

```bash
chmod 600 ~/.ssh/github_actions_deploy
chmod 644 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Why:** SSH requires specific permissions for security.

---

## STEP 5: Copy the Private Key

```bash
cat ~/.ssh/github_actions_deploy
```

**IMPORTANT:** 
- Copy the ENTIRE output
- It should start with `-----BEGIN OPENSSH PRIVATE KEY-----`
- And end with `-----END OPENSSH PRIVATE KEY-----`
- Include everything in between

**Example of what you should copy:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD... (many more lines) ...
-----END OPENSSH PRIVATE KEY-----
```

**Keep this copied** - you'll need it in the next steps!

---

## STEP 6: Get Your Server Information

While still on your server, get these details:

```bash
# Get your server IP address
hostname -I

# Or if you have a domain:
echo "Your staging domain: staging.adorneluxejewels.com"
echo "Your production domain: adorneluxejewels.com"
```

**Write down:**
- Your server IP address: `_________________`
- Your SSH username (usually `root`): `_________________`

---

## STEP 7: Open GitHub in Your Browser

1. Go to: `https://github.com/Michaelanand123singh/jewellery`
2. Make sure you're logged in

---

## STEP 8: Navigate to GitHub Secrets

1. Click on the **Settings** tab (top menu of the repository)
2. In the left sidebar, click **Secrets and variables**
3. Click **Actions**

You should see a page titled "Secrets and variables for Actions"

---

## STEP 9: Add Staging Secrets

You'll add 3 secrets for staging. Click **"New repository secret"** for each one.

### Secret 9.1: STAGING_HOST

1. Click **"New repository secret"** button
2. **Name:** Type exactly: `STAGING_HOST`
3. **Secret:** Enter your staging server IP or domain
   - Example: `123.45.67.89` 
   - Or: `staging.adorneluxejewels.com`
4. Click **"Add secret"**

### Secret 9.2: STAGING_SSH_USER

1. Click **"New repository secret"** button
2. **Name:** Type exactly: `STAGING_SSH_USER`
3. **Secret:** Enter: `root`
4. Click **"Add secret"**

### Secret 9.3: STAGING_SSH_KEY

1. Click **"New repository secret"** button
2. **Name:** Type exactly: `STAGING_SSH_KEY`
3. **Secret:** Paste the private key you copied in STEP 5
   - Make sure to include the BEGIN and END lines
   - Paste the entire key
4. Click **"Add secret"**

**Check:** You should now see 3 secrets listed:
- ✅ STAGING_HOST
- ✅ STAGING_SSH_USER
- ✅ STAGING_SSH_KEY

---

## STEP 10: Add Production Secrets

Add 3 more secrets for production. Click **"New repository secret"** for each one.

### Secret 10.1: PRODUCTION_HOST

1. Click **"New repository secret"** button
2. **Name:** Type exactly: `PRODUCTION_HOST`
3. **Secret:** Enter your production server IP or domain
   - Example: `123.45.67.89` (can be same as staging if same server)
   - Or: `adorneluxejewels.com`
4. Click **"Add secret"**

### Secret 10.2: PRODUCTION_SSH_USER

1. Click **"New repository secret"** button
2. **Name:** Type exactly: `PRODUCTION_SSH_USER`
3. **Secret:** Enter: `root`
4. Click **"Add secret"**

### Secret 10.3: PRODUCTION_SSH_KEY

1. Click **"New repository secret"** button
2. **Name:** Type exactly: `PRODUCTION_SSH_KEY`
3. **Secret:** Paste the SAME private key you used for staging
   - (If both environments are on the same server, use the same key)
4. Click **"Add secret"**

**Check:** You should now see 6 secrets total:
- ✅ STAGING_HOST
- ✅ STAGING_SSH_USER
- ✅ STAGING_SSH_KEY
- ✅ PRODUCTION_HOST
- ✅ PRODUCTION_SSH_USER
- ✅ PRODUCTION_SSH_KEY

---

## STEP 11: Verify Server Directories

Go back to your server terminal and verify:

```bash
# Check staging directory
ls -la /var/www/staging

# Check production directory
ls -la /var/www/production

# Both should show files like package.json, .env, etc.
```

**If directories don't exist or are empty:**
```bash
# Create and clone staging
mkdir -p /var/www/staging
cd /var/www/staging
git clone -b staging https://github.com/Michaelanand123singh/jewellery.git .

# Create and clone production
mkdir -p /var/www/production
cd /var/www/production
git clone https://github.com/Michaelanand123singh/jewellery.git .
```

---

## STEP 12: Verify PM2 Ecosystem Configs

Check if PM2 configs exist:

```bash
# Check staging
test -f /var/www/staging/ecosystem.config.js && echo "✅ Staging config exists" || echo "❌ Staging config missing"

# Check production
test -f /var/www/production/ecosystem.config.js && echo "✅ Production config exists" || echo "❌ Production config missing"
```

**If missing, create them:**

### For Staging:
```bash
cat > /var/www/staging/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jewellery-staging',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/staging',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: '/var/log/jewellery/staging-error.log',
    out_file: '/var/log/jewellery/staging-out.log',
    log_file: '/var/log/jewellery/staging.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
  }],
};
EOF
```

### For Production:
```bash
cat > /var/www/production/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jewellery-production',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/production',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/jewellery/production-error.log',
    out_file: '/var/log/jewellery/production-out.log',
    log_file: '/var/log/jewellery/production.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
  }],
};
EOF
```

---

## STEP 13: Create Log Directory

```bash
mkdir -p /var/log/jewellery
chmod 755 /var/log/jewellery
```

---

## STEP 14: Test SSH Connection

Test if the SSH key works:

```bash
# Test connection
ssh -i ~/.ssh/github_actions_deploy root@localhost

# If it connects without asking for password, type 'exit' to disconnect
# If it asks for password, something is wrong - check STEP 3 and 4
```

---

## STEP 15: Test GitHub Actions Connection

1. Go to GitHub: `https://github.com/Michaelanand123singh/jewellery`
2. Click on **Actions** tab
3. You should see workflows listed:
   - "CI - Build and Test"
   - "Deploy to Staging"
   - "Deploy to Production"
4. Click on **"Deploy to Staging"**
5. Click **"Run workflow"** button (top right)
6. Select branch: `staging`
7. Click green **"Run workflow"** button

**Watch the workflow run:**
- It should show "Deploy to Staging Environment" job
- Check each step - they should all pass (green checkmarks)
- If "Deploy to staging server" step fails, check the logs

---

## STEP 16: Verify Deployment

After the workflow completes, verify on your server:

```bash
# Check PM2 status
pm2 status

# You should see:
# - jewellery-staging (online)
# - jewellery-production (online)

# Check staging logs
pm2 logs jewellery-staging --lines 20

# Check production logs  
pm2 logs jewellery-production --lines 20
```

---

## STEP 17: Test Health Endpoints

```bash
# Test staging health
curl https://staging.adorneluxejewels.com/api/health

# Test production health
curl https://adorneluxejewels.com/api/health
```

**Expected result:** Should return JSON with health status.

---

## STEP 18: Test Automatic Deployment

Now test that automatic deployment works:

### For Staging:
```bash
# On your local machine (not server)
cd /path/to/your/local/jewellery/repo
git checkout staging
# Make a small change (like updating a comment)
git add .
git commit -m "Test staging deployment"
git push origin staging
```

**What should happen:**
1. GitHub Actions automatically triggers
2. Code is deployed to staging
3. Application restarts
4. You can see it in Actions tab

### For Production:
```bash
# On your local machine
git checkout main
# Make a small change
git add .
git commit -m "Test production deployment"
git push origin main
```

**What should happen:**
1. GitHub Actions automatically triggers
2. Code is deployed to production
3. Application restarts
4. You can see it in Actions tab

---

## ✅ Setup Complete!

Your CI/CD pipeline is now set up. Every time you push to:
- **`staging` branch** → Automatically deploys to staging
- **`main` branch** → Automatically deploys to production

---

## 🔧 Troubleshooting

### If GitHub Actions fails to connect:

1. **Check secrets are correct:**
   - Go to Settings → Secrets
   - Verify all 6 secrets exist
   - Check for typos in names

2. **Test SSH manually:**
   ```bash
   ssh -i ~/.ssh/github_actions_deploy root@your-server-ip
   ```

3. **Check GitHub Actions logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Read the error message in "Deploy to staging server" step

### If deployment fails:

1. **Check server logs:**
   ```bash
   pm2 logs jewellery-staging
   ```

2. **Check if Node.js version is correct:**
   ```bash
   node --version  # Should be 20 or higher
   ```

3. **Check if dependencies are installed:**
   ```bash
   cd /var/www/staging
   ls node_modules  # Should show many folders
   ```

### If application doesn't start:

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```

2. **Restart manually:**
   ```bash
   pm2 restart jewellery-staging
   ```

3. **Check environment variables:**
   ```bash
   cd /var/www/staging
   cat .env  # Make sure all required vars are set
   ```

---

## 📞 Need Help?

- Check `SSH_SETUP_GUIDE.md` for SSH-specific issues
- Check `CICD_SETUP.md` for detailed configuration
- Check `CI_CD_SUMMARY.md` for quick reference

---

**You're all set! 🎉**

