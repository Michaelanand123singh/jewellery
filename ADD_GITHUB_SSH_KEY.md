# Add SSH Key to GitHub for Pushing

Since you're working directly on the Hostinger VPS, we need to add an SSH key to GitHub so you can push code.

## Step 1: Copy Your SSH Public Key

The SSH public key has been generated. Copy it from the terminal output above.

It should look like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... hostinger-vps-github
```

## Step 2: Add Key to GitHub

1. **Go to GitHub SSH Keys:**
   - Open: https://github.com/settings/keys
   - Or: GitHub → Settings → SSH and GPG keys

2. **Click "New SSH key"** button

3. **Fill in the form:**
   - **Title:** `Hostinger VPS` (or any name you prefer)
   - **Key type:** `Authentication Key`
   - **Key:** Paste your entire public key (the one shown in terminal)

4. **Click "Add SSH key"**

## Step 3: Test Connection

After adding the key, we'll test it:

```bash
ssh -T git@github.com
```

You should see: `Hi Michaelanand123singh! You've successfully authenticated...`

## Step 4: Push the Code

Once the key is added, we can push:

```bash
cd /root/jewellery
git push origin main
```

---

**Quick Link:** https://github.com/settings/keys

