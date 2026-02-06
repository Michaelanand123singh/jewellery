# How to Add SSH Key to GitHub Secrets

## Step-by-Step Instructions

### Step 1: Open GitHub Secrets Page

1. Go to your browser
2. Navigate to: **https://github.com/Michaelanand123singh/jewellery/settings/secrets/actions**
   - Or manually:
     - Go to: `https://github.com/Michaelanand123singh/jewellery`
     - Click **Settings** tab (top menu)
     - Click **Secrets and variables** (left sidebar)
     - Click **Actions**

### Step 2: Add STAGING_SSH_KEY

1. Click the **"New repository secret"** button (top right)
2. In the **Name** field, type exactly: `STAGING_SSH_KEY`
3. In the **Secret** field, paste your entire private key:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   QyNTUxOQAAACCiu19V9tmQhMusZNd6Rj5lf2NNOZytSH3Gc1xP20f9vgAAAJhGB52iRged
   ogAAAAtzc2gtZWQyNTUxOQAAACCiu19V9tmQhMusZNd6Rj5lf2NNOZytSH3Gc1xP20f9vg
   AAAEApvQN9/kbMk3eoNQqEJpSdS07w7XFc2fgHLFA5adfiLaK7X1X22ZCEy6xk13pGPmV/
   Y005nK1IfcZzXE/bR/2+AAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
   -----END OPENSSH PRIVATE KEY-----
   ```
4. Click **"Add secret"** button

### Step 3: Add PRODUCTION_SSH_KEY

1. Click **"New repository secret"** button again
2. In the **Name** field, type exactly: `PRODUCTION_SSH_KEY`
3. In the **Secret** field, paste the **SAME** private key (same as above)
4. Click **"Add secret"** button

### Step 4: Add Other Required Secrets

You also need to add 4 more secrets:

#### STAGING_HOST
1. Click **"New repository secret"**
2. **Name:** `STAGING_HOST`
3. **Secret:** Your server IP address (e.g., `123.45.67.89`) or domain (`staging.adorneluxejewels.com`)
4. Click **"Add secret"**

#### STAGING_SSH_USER
1. Click **"New repository secret"**
2. **Name:** `STAGING_SSH_USER`
3. **Secret:** `root`
4. Click **"Add secret"**

#### PRODUCTION_HOST
1. Click **"New repository secret"**
2. **Name:** `PRODUCTION_HOST`
3. **Secret:** Your server IP address (same as staging if same server) or domain (`adorneluxejewels.com`)
4. Click **"Add secret"**

#### PRODUCTION_SSH_USER
1. Click **"New repository secret"**
2. **Name:** `PRODUCTION_SSH_USER`
3. **Secret:** `root`
4. Click **"Add secret"**

## ✅ Final Checklist

After adding all secrets, you should see 6 secrets listed:

- ✅ `STAGING_HOST`
- ✅ `STAGING_SSH_USER`
- ✅ `STAGING_SSH_KEY`
- ✅ `PRODUCTION_HOST`
- ✅ `PRODUCTION_SSH_USER`
- ✅ `PRODUCTION_SSH_KEY`

## 🎯 Quick Link

**Direct link to secrets page:**
https://github.com/Michaelanand123singh/jewellery/settings/secrets/actions

## ⚠️ Important Notes

1. **Paste the ENTIRE key** - including the BEGIN and END lines
2. **No extra spaces** - Make sure there are no extra spaces before or after
3. **Same key for both** - You can use the same SSH key for both staging and production if they're on the same server
4. **Keep it secret** - Never share this key publicly or commit it to git

## 🧪 Test After Adding

Once all secrets are added:

1. Go to **Actions** tab in GitHub
2. Click **"Deploy to Staging"** workflow
3. Click **"Run workflow"** button
4. Select branch: `staging`
5. Click green **"Run workflow"** button
6. Watch it deploy!

If it works, you'll see green checkmarks ✅ for each step.

