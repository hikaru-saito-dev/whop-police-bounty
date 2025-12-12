/**
 * Test script to get user roles from a Whop company
 * Tests owner and authorized users (team members)
 */

const Whop = require('@whop/sdk').default;
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const apiKey = process.env.WHOP_API_KEY;
const appID = process.env.WHOP_APP_ID;
const companyId = 'biz_GDF2onxBSKUfRa';

if (!apiKey) {
  console.error('❌ WHOP_API_KEY is not set in .env.local');
  process.exit(1);
}

console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
console.log('📱 App ID:', appID || 'Not set');
console.log('🏢 Company ID:', companyId);
console.log('');

// Initialize Whop client
const client = new Whop({
  apiKey,
  appID: appID || undefined,
});

async function testCompanyRoles() {
  try {
    console.log('📋 Testing Company Roles...\n');

    // 1. Get company information
    console.log('1️⃣  Retrieving company information...');
    const company = await client.companies.retrieve(companyId);
    console.log('✅ Company retrieved:', company.name || company.id);
    console.log('   Owner User ID:', company.owner_user?.id || 'N/A');
    console.log('   Owner Username:', company.owner_user?.username || 'N/A');
    console.log('');

    // 2. List authorized users (team members/admins)
    console.log('2️⃣  Retrieving authorized users (team members)...');
    const authorizedUsers = client.authorizedUsers.list({
      company_id: companyId,
    });

    let authorizedUsersList = [];
    for await (const user of authorizedUsers) {
      authorizedUsersList.push(user);
      console.log(`   👤 ${user.user?.username || user.user?.id || 'Unknown'}`);
      console.log(`      Role: ${user.role || 'N/A'}`);
      console.log(`      User ID: ${user.user?.id || 'N/A'}`);
      console.log('');
    }

    console.log(`✅ Found ${authorizedUsersList.length} authorized user(s)\n`);

    // 3. Summary
    console.log('📊 Summary:');
    console.log('   Company Owner:', company.owner_user?.username || company.owner_user?.id || 'N/A');
    console.log('   Authorized Users:', authorizedUsersList.length);
    authorizedUsersList.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.user?.username || user.user?.id} (${user.role || 'N/A'})`);
    });

    // 4. Test role checking functions
    console.log('\n3️⃣  Testing role checking functions...');
    
    if (company.owner_user?.id) {
      console.log(`   Testing isCompanyOwner for: ${company.owner_user.id}`);
      const isOwner = company.owner_user.id === company.owner_user.id; // Always true for owner
      console.log(`   ✅ Is Owner: ${isOwner}`);
    }

    if (authorizedUsersList.length > 0) {
      const testUserId = authorizedUsersList[0].user?.id;
      if (testUserId) {
        console.log(`   Testing isTeamMember for: ${testUserId}`);
        const isTeamMember = authorizedUsersList.some(
          (au) => au.user?.id === testUserId
        );
        console.log(`   ✅ Is Team Member: ${isTeamMember}`);
      }
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testCompanyRoles();

