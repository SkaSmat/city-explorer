/**
 * Badge Checker Test Suite
 *
 * This file contains test scenarios to verify badge unlock logic
 * Run these tests manually or integrate with your test framework
 */

import { badgeChecker } from './BadgeChecker';

/**
 * Test Scenario 1: First Steps Badge (1km)
 * User walks 1000m and should unlock "First Steps" badge
 */
export async function testFirstStepsBadge(userId: string) {
  console.log('🧪 Testing First Steps Badge...');

  // Prerequisite: User should have exactly 1000m in total_distance_meters
  const badges = await badgeChecker.checkAndUnlockBadges(userId);

  const hasFirstSteps = badges.some(b => b.name === 'First Steps');

  if (hasFirstSteps) {
    console.log('✅ First Steps badge correctly unlocked!');
  } else {
    console.log('❌ First Steps badge should be unlocked but wasn\'t');
  }

  return hasFirstSteps;
}

/**
 * Test Scenario 2: Street Collector Badge (10 streets)
 * User explores 10 different streets
 */
export async function testStreetCollectorBadge(userId: string) {
  console.log('🧪 Testing Street Collector Badge...');

  // Prerequisite: User should have >= 10 streets explored
  const badges = await badgeChecker.checkAndUnlockBadges(userId);

  const hasStreetCollector = badges.some(b => b.name === 'Street Collector');

  if (hasStreetCollector) {
    console.log('✅ Street Collector badge correctly unlocked!');
  } else {
    console.log('❌ Street Collector badge should be unlocked but wasn\'t');
  }

  return hasStreetCollector;
}

/**
 * Test Scenario 3: Globe Trotter Badge (3 cities)
 * User explores 3 different cities
 */
export async function testGlobeTrotterBadge(userId: string) {
  console.log('🧪 Testing Globe Trotter Badge...');

  // Prerequisite: User should have >= 3 cities in city_progress
  const badges = await badgeChecker.checkAndUnlockBadges(userId);

  const hasGlobeTrotter = badges.some(b => b.name === 'Globe Trotter');

  if (hasGlobeTrotter) {
    console.log('✅ Globe Trotter badge correctly unlocked!');
  } else {
    console.log('❌ Globe Trotter badge should be unlocked but wasn\'t');
  }

  return hasGlobeTrotter;
}

/**
 * Test Scenario 4: Multiple Badges at Once
 * User reaches thresholds for multiple badges simultaneously
 */
export async function testMultipleBadges(userId: string) {
  console.log('🧪 Testing Multiple Badges Unlock...');

  // This will unlock all eligible badges
  const badges = await badgeChecker.checkAndUnlockBadges(userId);

  console.log(`🎉 Unlocked ${badges.length} badges:`);
  badges.forEach(b => {
    console.log(`  - ${b.icon} ${b.name}: ${b.description}`);
  });

  return badges.length > 0;
}

/**
 * Test Scenario 5: No New Badges
 * User already has all eligible badges
 */
export async function testNoNewBadges(userId: string) {
  console.log('🧪 Testing No New Badges...');

  // Run twice - second time should return empty array
  await badgeChecker.checkAndUnlockBadges(userId);
  const badgesSecondTime = await badgeChecker.checkAndUnlockBadges(userId);

  if (badgesSecondTime.length === 0) {
    console.log('✅ Correctly detected no new badges');
  } else {
    console.log('❌ Should not unlock badges twice');
  }

  return badgesSecondTime.length === 0;
}

/**
 * Run all tests
 */
export async function runAllBadgeTests(userId: string) {
  console.log('🚀 Running Badge Checker Test Suite');
  console.log('====================================');

  const results = {
    firstSteps: await testFirstStepsBadge(userId),
    streetCollector: await testStreetCollectorBadge(userId),
    globeTrotter: await testGlobeTrotterBadge(userId),
    multipleBadges: await testMultipleBadges(userId),
    noNewBadges: await testNoNewBadges(userId),
  };

  console.log('\n====================================');
  console.log('📊 Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${test}`);
  });

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed');
  }

  return allPassed;
}

/**
 * Manual test instructions
 *
 * 1. Get your user ID from the database:
 *    SELECT id FROM user_profiles WHERE username = 'your-username';
 *
 * 2. Set up test data in Supabase:
 *    UPDATE user_profiles SET
 *      total_distance_meters = 1500,
 *      total_streets_explored = 12
 *    WHERE id = 'your-user-id';
 *
 *    -- Add 3 cities
 *    INSERT INTO city_progress (user_id, city) VALUES
 *      ('your-user-id', 'Paris'),
 *      ('your-user-id', 'Lyon'),
 *      ('your-user-id', 'Marseille');
 *
 * 3. Run the test in browser console:
 *    import { runAllBadgeTests } from './BadgeChecker.test';
 *    runAllBadgeTests('your-user-id');
 *
 * 4. Expected results:
 *    - First Steps: ✅ (>= 1km)
 *    - Street Collector: ✅ (>= 10 streets)
 *    - Explorer: ✅ (>= 10km) - Won't unlock with only 1.5km
 *    - Globe Trotter: ✅ (>= 3 cities)
 */
