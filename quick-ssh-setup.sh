#!/bin/bash
# Quick SSH Setup Script for GitHub Actions
# Run this on your deployment server

echo "🔑 Generating SSH key for GitHub Actions..."
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

echo "📝 Adding public key to authorized_keys..."
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

echo "🔒 Setting proper permissions..."
chmod 600 ~/.ssh/github_actions_deploy
chmod 644 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

echo ""
echo "✅ SSH key generated successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPY THE PRIVATE KEY BELOW TO GITHUB SECRETS (STAGING_SSH_KEY & PRODUCTION_SSH_KEY)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat ~/.ssh/github_actions_deploy
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Next steps:"
echo "   1. Copy the private key above (everything between the BEGIN and END lines)"
echo "   2. Go to GitHub → Settings → Secrets → Actions"
echo "   3. Add these secrets:"
echo "      - STAGING_HOST (your server IP/domain)"
echo "      - STAGING_SSH_USER (usually 'root')"
echo "      - STAGING_SSH_KEY (paste the private key)"
echo "      - PRODUCTION_HOST (your server IP/domain)"
echo "      - PRODUCTION_SSH_USER (usually 'root')"
echo "      - PRODUCTION_SSH_KEY (paste the private key - can be same as staging)"
echo ""
