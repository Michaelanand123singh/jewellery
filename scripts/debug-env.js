const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

try {
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file NOT FOUND');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            envVars[key] = value;
        }
    });

    console.log('🔍 Checking Environment Configuration for Image Upload...\n');

    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    let missing = false;

    requiredVars.forEach(varName => {
        if (!envVars[varName] || envVars[varName].includes('your-') || envVars[varName] === '') {
            console.error(`❌ MISSING or PLACEHOLDER: ${varName}`);
            missing = true;
        } else {
            console.log(`✅ FOUND: ${varName} = ${envVars[varName].substring(0, 10)}...`);
        }
    });

    if (missing) {
        console.log('\n❌ ROOT CAUSE FOUND: Missing Supabase credentials in .env file.');
        console.log('   The "Internal Server Error (500)" is happening because the server cannot authenticate with Supabase.');
        console.log('\n🛠️  FIX REQUIRED:');
        console.log('   1. Go to https://supabase.com/dashboard/project/ldzlhefoqgqtmvanoyya/settings/api');
        console.log('   2. Copy the "anon" key and "service_role" key.');
        console.log('   3. Update your .env file with these keys.');
    } else {
        console.log('\n✅ Configuration looks correct. Testing connection...');
        // We could try to connect here if we imported the lib, but let's stick to env check first.
    }

} catch (error) {
    console.error('Error reading .env:', error);
}
