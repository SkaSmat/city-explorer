/**
 * Supabase Connection & RPC Test Script
 *
 * This script tests:
 * 1. Connection to Supabase
 * 2. RLS policies status
 * 3. RPC function calculate_explored_streets_v2
 *
 * Usage:
 *   npx tsx supabase/test-connection.ts
 */

import { supabaseGeo } from '../src/lib/supabaseGeo';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'; // Replace with your user ID
const TEST_CITY = 'Paris';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testConnection() {
  log('\n🔍 Testing Supabase Connection...', colors.blue);

  try {
    const { data, error } = await supabaseGeo
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      log(`❌ Connection failed: ${error.message}`, colors.red);
      return false;
    }

    log('✅ Connection successful!', colors.green);
    return true;
  } catch (err: any) {
    log(`❌ Connection error: ${err.message}`, colors.red);
    return false;
  }
}

async function checkRLSStatus() {
  log('\n🔒 Checking RLS Status...', colors.blue);

  try {
    const { data, error } = await supabaseGeo.rpc('check_rls_status', {});

    if (error) {
      log('⚠️  Cannot check RLS status (function not available)', colors.yellow);
      log('   This is normal. Check manually in Supabase Dashboard.', colors.yellow);
      return null;
    }

    log(`RLS Status: ${data}`, colors.blue);
    return data;
  } catch (err) {
    log('⚠️  RLS check skipped (requires custom function)', colors.yellow);
    return null;
  }
}

async function testUserProfilesAccess() {
  log('\n👤 Testing user_profiles access...', colors.blue);

  try {
    // Try to create a test user
    const { error: insertError } = await supabaseGeo
      .from('user_profiles')
      .insert({
        id: TEST_USER_ID,
        username: 'Test User',
      })
      .select()
      .single();

    if (insertError && !insertError.message.includes('duplicate')) {
      log(`❌ Insert failed: ${insertError.message}`, colors.red);
      return false;
    }

    // Try to read the user
    const { data: user, error: selectError } = await supabaseGeo
      .from('user_profiles')
      .select('*')
      .eq('id', TEST_USER_ID)
      .single();

    if (selectError) {
      log(`❌ Select failed: ${selectError.message}`, colors.red);
      return false;
    }

    if (user) {
      log(`✅ User access OK (username: ${user.username})`, colors.green);
      return true;
    }

    log('⚠️  User not found', colors.yellow);
    return false;
  } catch (err: any) {
    log(`❌ Error: ${err.message}`, colors.red);
    return false;
  }
}

async function testGPSTracksAccess() {
  log('\n📍 Testing gps_tracks access...', colors.blue);

  try {
    const { data, error } = await supabaseGeo
      .from('gps_tracks')
      .select('count')
      .limit(1);

    if (error) {
      log(`❌ Access failed: ${error.message}`, colors.red);
      log('   Hint: Check if RLS policies are configured correctly', colors.yellow);
      return false;
    }

    log('✅ GPS tracks access OK', colors.green);
    return true;
  } catch (err: any) {
    log(`❌ Error: ${err.message}`, colors.red);
    return false;
  }
}

async function testRPCFunction() {
  log('\n🔧 Testing calculate_explored_streets_v2 RPC...', colors.blue);

  try {
    // First, ensure test user exists
    await supabaseGeo
      .from('user_profiles')
      .upsert({ id: TEST_USER_ID, username: 'Test User' }, { onConflict: 'id' });

    // Create a test track
    const { data: track, error: trackError } = await supabaseGeo
      .from('gps_tracks')
      .insert({
        user_id: TEST_USER_ID,
        city: TEST_CITY,
        route_geometry: 'SRID=4326;LINESTRING(2.3522 48.8566, 2.3532 48.8576)',
        distance_meters: 100,
        duration_seconds: 60,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (trackError) {
      log(`❌ Failed to create test track: ${trackError.message}`, colors.red);
      return false;
    }

    log(`   Created test track: ${track.id}`, colors.blue);

    // Test RPC function
    const { data, error } = await supabaseGeo.rpc('calculate_explored_streets_v2', {
      p_track_id: track.id,
      p_user_id: TEST_USER_ID,
      p_explored_osm_ids: [123456, 789012],
      p_city: TEST_CITY,
    });

    if (error) {
      log(`❌ RPC function failed: ${error.message}`, colors.red);
      log('   Hint: Make sure to run the schema.sql to create the function', colors.yellow);
      return false;
    }

    log(`✅ RPC function OK`, colors.green);
    log(`   New streets: ${data[0].new_streets_count}`, colors.blue);
    log(`   Total streets: ${data[0].total_streets_count}`, colors.blue);

    // Clean up test data
    await supabaseGeo.from('gps_tracks').delete().eq('id', track.id);
    await supabaseGeo.from('explored_streets').delete().eq('user_id', TEST_USER_ID);
    await supabaseGeo.from('city_progress').delete().eq('user_id', TEST_USER_ID);

    log('   Cleaned up test data', colors.blue);

    return true;
  } catch (err: any) {
    log(`❌ Error: ${err.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('═══════════════════════════════════════', colors.blue);
  log('  City Explorer - Supabase Test Suite', colors.blue);
  log('═══════════════════════════════════════', colors.blue);

  const results = {
    connection: false,
    userProfiles: false,
    gpsTracks: false,
    rpcFunction: false,
  };

  results.connection = await testConnection();

  if (!results.connection) {
    log('\n❌ Connection failed. Check your Supabase URL and anon key.', colors.red);
    return;
  }

  await checkRLSStatus();
  results.userProfiles = await testUserProfilesAccess();
  results.gpsTracks = await testGPSTracksAccess();
  results.rpcFunction = await testRPCFunction();

  // Summary
  log('\n═══════════════════════════════════════', colors.blue);
  log('  Test Results Summary', colors.blue);
  log('═══════════════════════════════════════', colors.blue);

  const allPassed = Object.values(results).every(r => r);

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(`${icon} ${test.padEnd(20)} ${passed ? 'PASSED' : 'FAILED'}`, color);
  });

  log('\n═══════════════════════════════════════', colors.blue);

  if (allPassed) {
    log('✅ All tests passed! Your Supabase setup is ready.', colors.green);
  } else {
    log('❌ Some tests failed. Check the logs above for details.', colors.red);
    log('\n📖 Troubleshooting:', colors.yellow);
    log('   1. Make sure to run schema.sql in Supabase SQL Editor', colors.yellow);
    log('   2. Check if RLS is disabled or policies are configured', colors.yellow);
    log('   3. Verify your Supabase URL and anon key', colors.yellow);
    log('   4. Read supabase/README.md for detailed setup guide', colors.yellow);
  }

  log('');
}

// Run tests
runAllTests().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, colors.red);
  process.exit(1);
});
