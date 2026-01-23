/**
 * Comprehensive API Test Script
 * Tests all API endpoints to identify issues
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let authToken = null;
let adminToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, error = null) {
  const icon = status === 'PASS' ? '✅' : '❌';
  const color = status === 'PASS' ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (error) {
    testResults.errors.push({ test: name, error });
    testResults.failed++;
  } else {
    testResults.passed++;
  }
}

// Cookie storage for maintaining session
let cookieJar = '';

async function makeRequest(method, endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add cookies if available
    if (cookieJar) {
      headers['Cookie'] = cookieJar;
    }

    // Add token as Authorization header if provided (for API testing)
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
      // Also add as cookie
      if (!cookieJar.includes('auth-token')) {
        cookieJar = `auth-token=${options.token}`;
      }
    }

    const config = {
      method,
      headers,
      ...(options.body && { body: JSON.stringify(options.body) }),
    };

    const response = await fetch(url, config);
    
    // Extract and store cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const cookieMatch = setCookie.match(/auth-token=([^;]+)/);
      if (cookieMatch) {
        cookieJar = `auth-token=${cookieMatch[1]}`;
      }
    }

    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null,
    };
  }
}

// Test functions
async function testAuthLogin() {
  log('\n🔐 Testing Authentication APIs', 'cyan');
  
  // Test login with invalid credentials
  log('Testing login with invalid credentials...', 'blue');
  const invalidLogin = await makeRequest('POST', '/auth/login', {
    body: { email: 'invalid@test.com', password: 'wrong' },
  });
  logTest(
    'Login with invalid credentials should return 401',
    invalidLogin.status === 401 ? 'PASS' : 'FAIL',
    invalidLogin.status !== 401 ? `Expected 401, got ${invalidLogin.status}` : null
  );

  // Read credentials from seed file
  let credentials = null;
  try {
    const fs = require('fs');
    const path = require('path');
    const credentialsPath = path.join(process.cwd(), 'SEED_CREDENTIALS.json');
    if (fs.existsSync(credentialsPath)) {
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
      log(`Found credentials file: ${credentialsPath}`, 'yellow');
    }
  } catch (e) {
    log('Could not read credentials file, using defaults', 'yellow');
  }

  // Use admin credentials
  const adminCreds = credentials?.find(c => c.role === 'ADMIN') || {
    email: 'admin@jewellery.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  };

  log(`Testing login with admin credentials (${adminCreds.email})...`, 'blue');
  const adminLogin = await makeRequest('POST', '/auth/login', {
    body: { email: adminCreds.email, password: adminCreds.password },
  });

  if (adminLogin.ok && adminLogin.data?.success) {
    // Try to get token from response data first, then from cookie
    adminToken = adminLogin.data?.data?.token || 
                 adminLogin.headers['set-cookie']?.split('auth-token=')[1]?.split(';')[0] ||
                 null;
    logTest('Admin login successful', 'PASS');
    log(`Admin token obtained: ${adminToken ? 'Yes' : 'No (using cookies)'}`, 'yellow');
    if (adminToken) {
      cookieJar = `auth-token=${adminToken}`;
    }
  } else {
    logTest(
      'Admin login',
      'FAIL',
      `Status: ${adminLogin.status}, Error: ${JSON.stringify(adminLogin.data)}`
    );
    log('⚠️  Admin login failed. Please check credentials.', 'yellow');
    log(`   Email: ${adminCreds.email}`, 'yellow');
    log(`   Password: ${adminCreds.password}`, 'yellow');
  }

  // Test user login
  const userCreds = credentials?.find(c => c.role === 'USER') || {
    email: 'user@example.com',
    password: process.env.TEST_USER_PASSWORD || 'User@123',
  };

  log(`Testing login with user credentials (${userCreds.email})...`, 'blue');
  const userLogin = await makeRequest('POST', '/auth/login', {
    body: { email: userCreds.email, password: userCreds.password },
  });

  if (userLogin.ok && userLogin.data?.success) {
    // Try to get token from response data first, then from cookie
    authToken = userLogin.data?.data?.token ||
                userLogin.headers['set-cookie']?.split('auth-token=')[1]?.split(';')[0] ||
                null;
    logTest('User login successful', 'PASS');
    if (authToken) {
      cookieJar = `auth-token=${authToken}`;
    }
  } else {
    logTest(
      'User login',
      'FAIL',
      `Status: ${userLogin.status}, Error: ${JSON.stringify(userLogin.data)}`
    );
  }

  // Test /auth/me endpoint (use cookies if token not available)
  if (authToken || adminToken || cookieJar) {
    log('Testing /auth/me endpoint...', 'blue');
    const meResponse = await makeRequest('GET', '/auth/me', {
      token: adminToken || authToken,
    });
    logTest(
      'GET /auth/me',
      meResponse.ok ? 'PASS' : 'FAIL',
      meResponse.ok ? null : `Status: ${meResponse.status}, Error: ${JSON.stringify(meResponse.data)}`
    );
    if (meResponse.ok && meResponse.data?.data) {
      log(`   User: ${meResponse.data.data.email} (${meResponse.data.data.role})`, 'yellow');
    }
  } else {
    logTest('GET /auth/me (skipped - no token)', 'FAIL', 'No authentication token available');
  }

  // Test logout (use cookies if token not available)
  if (authToken || adminToken || cookieJar) {
    log('Testing logout...', 'blue');
    const logoutResponse = await makeRequest('POST', '/auth/logout', {
      token: adminToken || authToken,
    });
    logTest(
      'POST /auth/logout',
      logoutResponse.ok || logoutResponse.status === 200 ? 'PASS' : 'FAIL',
      logoutResponse.ok ? null : `Status: ${logoutResponse.status}`
    );
    // Clear cookies after logout
    if (logoutResponse.ok) {
      cookieJar = '';
    }
  }
}

async function testProducts() {
  log('\n📦 Testing Product APIs', 'cyan');
  
  // Test GET /products
  log('Testing GET /products...', 'blue');
  const productsResponse = await makeRequest('GET', '/products');
  logTest(
    'GET /products',
    productsResponse.ok ? 'PASS' : 'FAIL',
    productsResponse.ok ? null : `Status: ${productsResponse.status}`
  );

  if (productsResponse.ok && productsResponse.data?.data) {
    const products = Array.isArray(productsResponse.data.data) 
      ? productsResponse.data.data 
      : productsResponse.data.data?.products || [];
    log(`   Found ${products.length} products`, 'yellow');
    
    if (products.length > 0) {
      const firstProduct = products[0];
      log(`   First product: ${firstProduct.name} (ID: ${firstProduct.id})`, 'yellow');
      
      // Test GET /products/[id]
      log(`Testing GET /products/${firstProduct.id}...`, 'blue');
      const productResponse = await makeRequest('GET', `/products/${firstProduct.id}`);
      logTest(
        `GET /products/${firstProduct.id}`,
        productResponse.ok ? 'PASS' : 'FAIL',
        productResponse.ok ? null : `Status: ${productResponse.status}`
      );
    }
  }

  // Test POST /products (admin only)
  if (adminToken) {
    log('Testing POST /products (admin)...', 'blue');
    const newProduct = {
      name: 'Test Product',
      slug: 'test-product-' + Date.now(),
      description: 'Test product description',
      price: 1000,
      category: 'women',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop',
      stockQuantity: 10,
      inStock: true,
    };
    const createResponse = await makeRequest('POST', '/products', {
      body: newProduct,
      token: adminToken,
    });
    logTest(
      'POST /products (admin)',
      createResponse.ok ? 'PASS' : 'FAIL',
      createResponse.ok ? null : `Status: ${createResponse.status}, Error: ${JSON.stringify(createResponse.data)}`
    );
  } else {
    logTest('POST /products (skipped - no admin token)', 'FAIL', 'No admin authentication available');
  }
}

async function testCart() {
  log('\n🛒 Testing Cart APIs', 'cyan');
  
  if (!authToken && !adminToken && !cookieJar) {
    logTest('Cart APIs (skipped - no token)', 'FAIL', 'No authentication token available');
    return;
  }

  const token = authToken || adminToken;

  // Test GET /cart
  log('Testing GET /cart...', 'blue');
  const cartResponse = await makeRequest('GET', '/cart', { token });
  logTest(
    'GET /cart',
    cartResponse.ok ? 'PASS' : 'FAIL',
    cartResponse.ok ? null : `Status: ${cartResponse.status}`
  );

  // Test POST /cart (need a product ID first)
  log('Testing POST /cart...', 'blue');
  const productsResponse = await makeRequest('GET', '/products');
  if (productsResponse.ok && productsResponse.data?.data) {
    const products = Array.isArray(productsResponse.data.data) 
      ? productsResponse.data.data 
      : productsResponse.data.data?.products || [];
    if (products.length > 0) {
      const productId = products[0].id;
      const addToCartResponse = await makeRequest('POST', '/cart', {
        body: { productId, quantity: 1 },
        token,
      });
      logTest(
        'POST /cart',
        addToCartResponse.ok ? 'PASS' : 'FAIL',
        addToCartResponse.ok ? null : `Status: ${addToCartResponse.status}`
      );
    }
  }
}

async function testOrders() {
  log('\n📋 Testing Order APIs', 'cyan');
  
  if (!authToken && !adminToken && !cookieJar) {
    logTest('Order APIs (skipped - no token)', 'FAIL', 'No authentication token available');
    return;
  }

  const token = authToken || adminToken;

  // Test GET /orders
  log('Testing GET /orders...', 'blue');
  const ordersResponse = await makeRequest('GET', '/orders', { token });
  logTest(
    'GET /orders',
    ordersResponse.ok ? 'PASS' : 'FAIL',
    ordersResponse.ok ? null : `Status: ${ordersResponse.status}`
  );
}

async function testOtherEndpoints() {
  log('\n🔍 Testing Other Endpoints', 'cyan');
  
  // Test categories
  log('Testing GET /categories...', 'blue');
  const categoriesResponse = await makeRequest('GET', '/categories');
  logTest(
    'GET /categories',
    categoriesResponse.ok ? 'PASS' : 'FAIL',
    categoriesResponse.ok ? null : `Status: ${categoriesResponse.status}`
  );

  // Test wishlist (if authenticated)
  if (authToken || adminToken || cookieJar) {
    const token = authToken || adminToken;
    log('Testing GET /wishlist...', 'blue');
    const wishlistResponse = await makeRequest('GET', '/wishlist', { token });
    logTest(
      'GET /wishlist',
      wishlistResponse.ok ? 'PASS' : 'FAIL',
      wishlistResponse.ok ? null : `Status: ${wishlistResponse.status}`
    );
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 API Test Suite', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Testing against: ${BASE_URL}`, 'yellow');
  log(`API Base: ${API_BASE}`, 'yellow');

  try {
    await testAuthLogin();
    await testProducts();
    await testCart();
    await testOrders();
    await testOtherEndpoints();

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`✅ Passed: ${testResults.passed}`, 'green');
    log(`❌ Failed: ${testResults.failed}`, 'red');
    log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, 'yellow');

    if (testResults.errors.length > 0) {
      log('\n❌ Errors:', 'red');
      testResults.errors.forEach(({ test, error }) => {
        log(`   ${test}: ${error}`, 'red');
      });
    }

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ with native fetch support', 'red');
  log('   Or install node-fetch: npm install node-fetch', 'yellow');
  process.exit(1);
}

// Run tests
runTests();

