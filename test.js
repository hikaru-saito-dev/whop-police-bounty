/**
 * Test script to check members.list method
 * Testing with company_id: biz_GDF2onxBSKUfRa
 * username: localgang
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
const username = 'localgang';

if (!apiKey) {
  console.error('❌ WHOP_API_KEY is not set in .env.local');
  process.exit(1);
}

console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
console.log('📱 App ID:', appID || 'Not set');
console.log('🏢 Company ID:', companyId);
console.log('👤 Username:', username);
console.log('');

// Initialize Whop client
const client = new Whop({
  apiKey,
  appID: appID || undefined,
});

async function testMembersList() {
  try {
    console.log('📋 Testing members.list() method...\n');

    // Test 1: Get user ID first
    console.log('1️⃣  Getting user ID by username...');
    let userId;
    try {
      const user = await client.users.retrieve(username);
      userId = user.id;
      console.log('✅ User found:', user.username);
      console.log('   User ID:', userId);
      console.log('');
    } catch (error) {
      console.error('❌ Error retrieving user:', error.message);
      return;
    }

    // Test 2: List members with user_ids filter
    console.log('2️⃣  Testing members.list() with user_ids filter...');
    try {
      const members1 = client.members.list({
        company_id: companyId,
        user_ids: [userId],
        first: 10,
      });

      let found1 = false;
      for await (const member of members1) {
        console.log('   Found member:', {
          id: member.id,
          userId: member.user?.id,
          username: member.user?.username,
          email: member.user?.email,
          joined_at: member.joined_at,
          status: member.status,
          access_level: member.access_level,
        });
        found1 = true;
        break;
      }

      if (!found1) {
        console.log('   ⚠️  No member found with user_ids filter');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Error with user_ids filter:', error.message);
      if (error.response) {
        console.error('   Response:', JSON.stringify(error.response, null, 2));
      }
      console.log('');
    }

    // Test 3: List members with query filter (username)
    console.log('3️⃣  Testing members.list() with query filter (username)...');
    try {
      const members2 = client.members.list({
        company_id: companyId,
        query: username,
        first: 10,
      });

      let found2 = false;
      for await (const member of members2) {
        console.log('   Found member:', {
          id: member.id,
          userId: member.user?.id,
          username: member.user?.username,
          email: member.user?.email,
          joined_at: member.joined_at,
          status: member.status,
          access_level: member.access_level,
        });
        found2 = true;
        break;
      }

      if (!found2) {
        console.log('   ⚠️  No member found with query filter');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Error with query filter:', error.message);
      if (error.response) {
        console.error('   Response:', JSON.stringify(error.response, null, 2));
      }
      console.log('');
    }

    // Test 4: List all members (first 20) to see if user is in there
    console.log('4️⃣  Testing members.list() - listing first 20 members...');
    try {
      const members3 = client.members.list({
        company_id: companyId,
        first: 20,
      });

      let count = 0;
      let found3 = false;
      for await (const member of members3) {
        count++;
        if (member.user?.username === username || member.user?.id === userId) {
          console.log('   ✅ Found user in members list:', {
            id: member.id,
            userId: member.user?.id,
            username: member.user?.username,
            email: member.user?.email,
            joined_at: member.joined_at,
            status: member.status,
            access_level: member.access_level,
          });
          found3 = true;
        }
        if (count >= 20) break;
      }

      if (!found3) {
        console.log(`   ⚠️  User not found in first ${count} members`);
      }
      console.log(`   Total members checked: ${count}`);
      console.log('');
    } catch (error) {
      console.error('❌ Error listing members:', error.message);
      if (error.response) {
        console.error('   Response:', JSON.stringify(error.response, null, 2));
      }
      console.log('');
    }

    // Test 5: Try with different query formats
    console.log('5️⃣  Testing different query formats...');
    const queryFormats = [
      username,
      `@${username}`,
      userId,
    ];

    for (const query of queryFormats) {
      try {
        console.log(`   Testing query: "${query}"`);
        const members = client.members.list({
          company_id: companyId,
          query: query,
          first: 5,
        });

        let found = false;
        for await (const member of members) {
          if (member.user?.username === username || member.user?.id === userId) {
            console.log(`   ✅ Found with query "${query}"`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`   ❌ Not found with query "${query}"`);
        }
      } catch (error) {
        console.error(`   ❌ Error with query "${query}":`, error.message);
      }
    }

    console.log('\n✅ Test completed!');

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
testMembersList();
