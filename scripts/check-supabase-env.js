const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

console.log('🔍 Checking Supabase Environment Variables...\n');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file NOT FOUND at:', envPath);
    console.log('\n📝 Please create a .env file in the project root.');
    console.log('   You can copy env.example to .env as a starting point.');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse .env file
envContent.split('\n').forEach((line, index) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        envVars[key] = value;
    }
});

const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
];

let allGood = true;
let missing = [];
let placeholders = [];

console.log('📋 Environment Variables Status:\n');

requiredVars.forEach(varName => {
    const value = envVars[varName];
    
    if (!value || value === '') {
        console.error(`❌ MISSING: ${varName}`);
        missing.push(varName);
        allGood = false;
    } else if (value.includes('your-') || value.includes('paste-') || value === 'your-supabase-anon-key' || value === 'your-supabase-service-role-key') {
        console.warn(`⚠️  PLACEHOLDER: ${varName} = "${value.substring(0, 30)}..."`);
        placeholders.push(varName);
        allGood = false;
    } else {
        const displayValue = value.length > 20 
            ? `${value.substring(0, 20)}...` 
            : value;
        console.log(`✅ FOUND: ${varName} = "${displayValue}"`);
    }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allGood) {
    console.log('✅ All Supabase environment variables are configured!');
    console.log('   Image upload should work correctly.\n');
    process.exit(0);
} else {
    if (missing.length > 0) {
        console.error('❌ Missing Variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.log('');
    }
    
    if (placeholders.length > 0) {
        console.warn('⚠️  Placeholder Values Detected:');
        placeholders.forEach(v => console.warn(`   - ${v}`));
        console.log('');
    }
    
    console.log('📖 How to Fix:');
    console.log('   1. Open your Supabase project dashboard');
    console.log('   2. Go to Settings → API');
    console.log('   3. Copy the following values:');
    console.log('      - Project URL → NEXT_PUBLIC_SUPABASE_URL');
    console.log('      - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('      - service_role secret key → SUPABASE_SERVICE_ROLE_KEY');
    console.log('   4. Update your .env file with these values');
    console.log('   5. Restart your development server\n');
    
    console.log('💡 Example .env entries:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
    console.log('   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n');
    
    process.exit(1);
}

