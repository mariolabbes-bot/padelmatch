import { authService } from '../services/authService';
import { communityService } from '../services/communityService';
import type { CommunityPlayer } from '../types/padel';

// Mock localStorage for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    length: 0,
    key: () => null
  } as any;
}

declare const process: any;

console.log('🧪 Starting Monetization & Guest History Test Suite...\n');

async function run() {
  // 1. Register test free user
  const regRes = await authService.register({
    name: 'Juan Perez Test',
    email: 'juan.perez@test.cl',
    password: 'password123',
    category: '5ta',
    favoritePosition: 'drive',
    phone: '+56999887766'
  });

  if (!regRes.success || !regRes.user) {
    console.error('❌ Failed to register test user:', regRes.error);
    process.exit(1);
  }

  const user = regRes.user!;
  console.log(`✅ Registered user: ${user.name} (${user.email}), Plan: ${user.plan}`);

// 2. Check initial courtesy matches
const initialRemaining = authService.getHostedMatchesRemaining(user);
console.log(`📊 Initial courtesy matches remaining: ${initialRemaining}`);
if (initialRemaining !== 3) {
  console.error(`❌ Expected 3 courtesy matches, got ${initialRemaining}`);
  process.exit(1);
}

// 3. Simulate 3 hosted matches
console.log('🎾 Simulating 3 hosted matches by this user...');
authService.incrementHostedMatches(user);
console.log(`  Match 1 played. Remaining: ${authService.getHostedMatchesRemaining(user)}`);

authService.incrementHostedMatches(user);
console.log(`  Match 2 played. Remaining: ${authService.getHostedMatchesRemaining(user)}`);

authService.incrementHostedMatches(user);
const remainingAfter3 = authService.getHostedMatchesRemaining(user);
console.log(`  Match 3 played. Remaining: ${remainingAfter3}`);

if (remainingAfter3 !== 0) {
  console.error(`❌ Expected 0 courtesy matches remaining, got ${remainingAfter3}`);
  process.exit(1);
}

if (authService.canHostMatch(user) !== false) {
  console.error('❌ User should not be allowed to host 4th match without subscription');
  process.exit(1);
}
console.log('✅ Courtesy limit properly enforced (canHostMatch = false)');

// 4. Test subscription upgrade
console.log('\n👑 Testing subscription upgrade to Season (6 Months)...');
const upgradeRes = authService.upgradeSubscription('season_6m');
if (!upgradeRes.success || upgradeRes.user.plan !== 'subscribed') {
  console.error('❌ Upgrade failed:', upgradeRes);
  process.exit(1);
}

const remainingSubscribed = authService.getHostedMatchesRemaining(upgradeRes.user);
console.log(`  Upgraded! New plan: ${upgradeRes.user.plan}, Remaining matches: ${remainingSubscribed}`);
if (remainingSubscribed !== Infinity) {
  console.error(`❌ Expected Infinity remaining matches for subscriber, got ${remainingSubscribed}`);
  process.exit(1);
}
console.log('✅ Subscription upgrade successful and verified');

// 5. Test Guest History Claiming
console.log('\n🤝 Testing Guest History Claiming...');
// Add an unregistered guest player to community roster with 2 matches won
const guestPlayer: CommunityPlayer = {
  id: 'guest-xyz789',
  name: 'Juan Perez Test',
  phone: '+56999887766',
  elo: 1350,
  category: '5ta',
  matchesPlayed: 4,
  matchesWon: 3,
  winStreak: 2,
  favoritePosition: 'drive',
  leadSource: 'qr_guest'
};
communityService.addPlayer(guestPlayer);

const claimRes = authService.claimGuestHistory('Juan Perez Test');
console.log(`  Claim result:`, claimRes.message);

if (!claimRes.success || claimRes.claimedMatches !== 4) {
  console.error(`❌ Claim failed or wrong claimed matches:`, claimRes);
  process.exit(1);
}
  // Clean up test records
  try {
    const { db } = await import('../services/firebase');
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', 'juan.perez@test.cl'));
    if (user.id) await deleteDoc(doc(db, 'players', user.id));
    await deleteDoc(doc(db, 'players', 'guest-xyz789'));
  } catch {
    // ignore
  }

  console.log('\n🏆 ALL MONETIZATION & UX TESTS PASSED SUCCESSFULLY! 🎾');
  process.exit(0);
}

run().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
