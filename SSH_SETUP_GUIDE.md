# SSH Setup Guide for GitHub Actions

This guide walks you through generating SSH keys and connecting GitHub Actions to your deployment server.

## Step-by-Step Instructions

### Step 1: Generate SSH Key on Your Server

Connect to your VPS server via SSH and run these commands:

```bash
# Generate a new SSH key pair (Ed25519 is recommended)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# This will create two files:
# - ~/.ssh/github_actions_deploy (private key - keep secret!)
# - ~/.ssh/github_actions_deploy.pub (public key - safe to share)
```

**What this does:**
- Creates a new SSH key pair specifically for GitHub Actions
- Uses Ed25519 algorithm (more secure and faster than RSA)
- Saves the key as `github_actions_deploy` in your `.ssh` directory
- No passphrase (`-N ""`) so GitHub Actions can use it automatically

### Step 2: Add Public Key to Authorized Keys

Allow the key to connect to your server:

```bash
# Add the public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Set proper permissions (important for security)
chmod 600 ~/.ssh/github_actions_deploy
chmod 644 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**What this does:**
- Adds your public key to the list of authorized keys
- Sets correct file permissions (SSH is strict about this)

### Step 3: Copy the Private Key

Display the private key so you can copy it to GitHub:

```bash
# Display the private key
cat ~/.ssh/github_actions_deploy
```

**Important:** 
- Copy the ENTIRE output, including:
  - `-----BEGIN OPENSSH PRIVATE KEY-----`
  - All the key content in between
  - `-----END OPENSSH PRIVATE KEY-----`
- This is your private key - keep it secret!

### Step 4: Add Secrets to GitHub

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/Michaelanand123singh/jewellery`

2. **Open Settings**
   - Click on **Settings** tab (top menu)

3. **Go to Secrets**
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

4. **Add Staging Secrets**

   Click **New repository secret** and add these one by one:

   **Secret 1: `STAGING_HOST`**
   - Name: `STAGING_HOST`
   - Value: Your staging server IP or domain
     - Example: `123.45.67.89` or `staging.adorneluxejewels.com`
   - Click **Add secret**

   **Secret 2: `STAGING_SSH_USER`**
   - Name: `STAGING_SSH_USER`
   - Value: Your SSH username (usually `root`)
   - Click **Add secret**

   **Secret 3: `STAGING_SSH_KEY`**
   - Name: `STAGING_SSH_KEY`
   - Value: Paste the entire private key you copied in Step 3
     - Make sure to include the BEGIN and END lines
   - Click **Add secret**

5. **Add Production Secrets**

   Click **New repository secret** and add these one by one:

   **Secret 1: `PRODUCTION_HOST`**
   - Name: `PRODUCTION_HOST`
   - Value: Your production server IP or domain
     - Example: `123.45.67.89` or `adorneluxejewels.com`
   - Click **Add secret**

   **Secret 2: `PRODUCTION_SSH_USER`**
   - Name: `PRODUCTION_SSH_USER`
   - Value: Your SSH username (usually `root`)
   - Click **Add secret**

   **Secret 3: `PRODUCTION_SSH_KEY`**
   - Name: `PRODUCTION_SSH_KEY`
   - Value: Paste the entire private key you copied in Step 3
     - You can use the same key for both environments if they're on the same server
   - Click **Add secret**

### Step 5: Test the Connection

Test if GitHub Actions can connect to your server:

#### Option A: Test Manually on Server

```bash
# Test SSH connection with the key
ssh -i ~/.ssh/github_actions_deploy root@your-server-ip

# If it connects without asking for a password, it's working!
# Type 'exit' to disconnect
```

#### Option B: Test via GitHub Actions

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Deploy to Staging** workflow
4. Click **Run workflow** (right side)
5. Select `staging` branch
6. Click **Run workflow** button
7. Watch the workflow run - it should connect to your server

### Step 6: Verify Server Setup

Make sure your server directories are set up correctly:

```bash
# Check if directories exist
ls -la /var/www/staging
ls -la /var/www/production

# Check if they're git repositories
cd /var/www/staging && git remote -v
cd /var/www/production && git remote -v

# Check if PM2 is installed
pm2 --version

# Check if Node.js is installed
node --version  # Should be 20 or higher
npm --version
```

## Quick Reference Commands

### Generate SSH Key (One-liner)
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N "" && \
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys && \
chmod 600 ~/.ssh/github_actions_deploy && \
chmod 644 ~/.ssh/authorized_keys && \
echo "✅ SSH key generated! Copy the private key below:" && \
cat ~/.ssh/github_actions_deploy
```

### View Your Public Key (if needed later)
```bash
cat ~/.ssh/github_actions_deploy.pub
```

### View Your Private Key (if needed later)
```bash
cat ~/.ssh/github_actions_deploy
```

## Troubleshooting

### SSH Connection Fails

**Error: "Permission denied (publickey)"**

1. Check if the public key is in authorized_keys:
   ```bash
   grep "github-actions-deploy" ~/.ssh/authorized_keys
   ```

2. Check file permissions:
   ```bash
   ls -la ~/.ssh/
   # Should show:
   # -rw------- (600) github_actions_deploy
   # -rw-r--r-- (644) authorized_keys
   # drwx------ (700) .ssh directory
   ```

3. Check SSH service is running:
   ```bash
   systemctl status ssh
   ```

**Error: "Host key verification failed"**

- This is normal for first connection
- GitHub Actions will automatically accept the host key

### GitHub Actions Can't Connect

1. **Verify secrets are set correctly:**
   - Go to Settings → Secrets and variables → Actions
   - Make sure all 6 secrets are present
   - Check that values don't have extra spaces or newlines

2. **Test SSH manually:**
   ```bash
   ssh -i ~/.ssh/github_actions_deploy root@your-server-ip
   ```

3. **Check GitHub Actions logs:**
   - Go to Actions tab
   - Click on the failed workflow
   - Check the "Deploy to staging server" step logs
   - Look for specific error messages

### Wrong Server IP/Domain

If you need to update the server address:

1. Go to GitHub → Settings → Secrets
2. Click on `STAGING_HOST` or `PRODUCTION_HOST`
3. Click **Update**
4. Enter the correct IP/domain
5. Save

## Security Best Practices

1. **Use a dedicated key for GitHub Actions**
   - Don't reuse your personal SSH key
   - This key is only for automated deployments

2. **Restrict key access (optional but recommended)**
   ```bash
   # Edit ~/.ssh/authorized_keys and add restrictions
   # Example: Only allow from GitHub Actions IP ranges
   # (This is advanced - optional)
   ```

3. **Rotate keys periodically**
   - Generate new keys every 6-12 months
   - Update GitHub Secrets with the new key

4. **Monitor access**
   - Check `/var/log/auth.log` for SSH connections
   - Set up alerts for unusual activity

## Visual Guide

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Your Server   │         │  GitHub Actions  │         │  GitHub Repo    │
│                 │         │                  │         │                 │
│ 1. Generate     │         │                  │         │                 │
│    SSH Key      │────────▶│                  │         │                 │
│                 │         │                  │         │                 │
│ 2. Add to       │         │                  │         │ 3. Add Secrets  │
│    authorized   │         │                  │────────▶│    (SSH Key,    │
│    keys          │         │                  │         │     Host, User)  │
│                 │         │                  │         │                 │
│                 │◀────────│                  │         │                 │
│ 4. Deploy       │         │ 5. Connect &     │         │                 │
│    Application  │         │    Deploy        │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Next Steps

Once SSH is set up:

1. ✅ Test the connection (Step 5)
2. ✅ Push code to `staging` branch to trigger deployment
3. ✅ Monitor the deployment in GitHub Actions
4. ✅ Verify the application is running: `pm2 status`
5. ✅ Check the health endpoint: `curl https://staging.adorneluxejewels.com/api/health`

---

**Need Help?** Check the [CICD_SETUP.md](./CICD_SETUP.md) for more detailed information.

