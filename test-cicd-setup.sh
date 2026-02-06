#!/bin/bash
# CI/CD Setup Test and Verification Script

echo "🧪 Testing CI/CD Setup"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "1️⃣ Testing SSH Key Setup..."
echo "----------------------------"

# Check if SSH key exists
if [ -f ~/.ssh/github_actions_deploy ]; then
    test_result 0 "SSH key file exists"
else
    test_result 1 "SSH key file missing"
fi

# Check SSH key permissions
if [ -r ~/.ssh/github_actions_deploy ] && [ $(stat -c %a ~/.ssh/github_actions_deploy) = "600" ]; then
    test_result 0 "SSH key has correct permissions (600)"
else
    test_result 1 "SSH key permissions incorrect (should be 600)"
fi

# Check if public key is in authorized_keys
if grep -q "github-actions-deploy" ~/.ssh/authorized_keys 2>/dev/null; then
    test_result 0 "Public key found in authorized_keys"
else
    test_result 1 "Public key not in authorized_keys"
fi

echo ""
echo "2️⃣ Testing Server Directories..."
echo "--------------------------------"

# Check staging directory
if [ -d /var/www/staging ]; then
    test_result 0 "Staging directory exists"
    if [ -f /var/www/staging/package.json ]; then
        test_result 0 "Staging has package.json"
    else
        test_result 1 "Staging missing package.json"
    fi
    if [ -f /var/www/staging/.env ]; then
        test_result 0 "Staging has .env file"
    else
        test_result 1 "Staging missing .env file"
    fi
    if [ -f /var/www/staging/ecosystem.config.js ]; then
        test_result 0 "Staging has ecosystem.config.js"
    else
        test_result 1 "Staging missing ecosystem.config.js"
    fi
else
    test_result 1 "Staging directory missing"
fi

# Check production directory
if [ -d /var/www/production ]; then
    test_result 0 "Production directory exists"
    if [ -f /var/www/production/package.json ]; then
        test_result 0 "Production has package.json"
    else
        test_result 1 "Production missing package.json"
    fi
    if [ -f /var/www/production/.env ]; then
        test_result 0 "Production has .env file"
    else
        test_result 1 "Production missing .env file"
    fi
    if [ -f /var/www/production/ecosystem.config.js ]; then
        test_result 0 "Production has ecosystem.config.js"
    else
        test_result 1 "Production missing ecosystem.config.js"
    fi
else
    test_result 1 "Production directory missing"
fi

echo ""
echo "3️⃣ Testing Required Software..."
echo "-------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        test_result 0 "Node.js version is 20+ ($(node --version))"
    else
        test_result 1 "Node.js version too old ($(node --version), need 20+)"
    fi
else
    test_result 1 "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    test_result 0 "npm is installed ($(npm --version))"
else
    test_result 1 "npm not installed"
fi

# Check PM2
if command -v pm2 &> /dev/null; then
    test_result 0 "PM2 is installed ($(pm2 --version))"
else
    test_result 1 "PM2 not installed"
fi

# Check Git
if command -v git &> /dev/null; then
    test_result 0 "Git is installed ($(git --version | cut -d' ' -f3))"
else
    test_result 1 "Git not installed"
fi

echo ""
echo "4️⃣ Testing PM2 Applications..."
echo "-------------------------------"

# Check if PM2 processes are running
if pm2 list | grep -q "jewellery-staging"; then
    STAGING_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="jewellery-staging") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$STAGING_STATUS" = "online" ]; then
        test_result 0 "Staging app is running (PM2)"
    else
        test_result 1 "Staging app not online (status: $STAGING_STATUS)"
    fi
else
    test_result 1 "Staging app not found in PM2"
fi

if pm2 list | grep -q "jewellery-production"; then
    PROD_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="jewellery-production") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$PROD_STATUS" = "online" ]; then
        test_result 0 "Production app is running (PM2)"
    else
        test_result 1 "Production app not online (status: $PROD_STATUS)"
    fi
else
    test_result 1 "Production app not found in PM2"
fi

echo ""
echo "5️⃣ Testing Log Directory..."
echo "---------------------------"

if [ -d /var/log/jewellery ]; then
    test_result 0 "Log directory exists"
    if [ -w /var/log/jewellery ]; then
        test_result 0 "Log directory is writable"
    else
        test_result 1 "Log directory not writable"
    fi
else
    test_result 1 "Log directory missing"
fi

echo ""
echo "6️⃣ Testing SSH Connection..."
echo "---------------------------"

# Test SSH connection with the key
if ssh -i ~/.ssh/github_actions_deploy -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@localhost echo "SSH test" &>/dev/null; then
    test_result 0 "SSH connection works with GitHub Actions key"
else
    test_result 1 "SSH connection failed"
fi

echo ""
echo "7️⃣ Testing Git Repositories..."
echo "-------------------------------"

# Check staging git remote
if [ -d /var/www/staging/.git ]; then
    cd /var/www/staging
    if git remote get-url origin &>/dev/null; then
        test_result 0 "Staging has git remote configured"
    else
        test_result 1 "Staging git remote not configured"
    fi
    cd - &>/dev/null
else
    test_result 1 "Staging is not a git repository"
fi

# Check production git remote
if [ -d /var/www/production/.git ]; then
    cd /var/www/production
    if git remote get-url origin &>/dev/null; then
        test_result 0 "Production has git remote configured"
    else
        test_result 1 "Production git remote not configured"
    fi
    cd - &>/dev/null
else
    test_result 1 "Production is not a git repository"
fi

echo ""
echo "📊 Test Summary"
echo "=============="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your server is ready for CI/CD.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to GitHub Actions and test deployment"
    echo "2. Push to staging branch to trigger auto-deployment"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi

