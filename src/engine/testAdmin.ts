// Polyfill localStorage for Node test environment
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

import { authService, type UserSession } from '../services/authService';
import { clubService } from '../services/clubService';
import { groupService } from '../services/groupService';
import { communityService } from '../services/communityService';

console.log('--- TEST SUITE: ADMIN AUTHORIZATION & MANAGEMENT ---');

// 1. Test Authorization Checks
const adminUser: UserSession = {
  id: 'usr-admin-1',
  name: 'Mario Labbé',
  email: 'mariolabbes@gmail.com',
  plan: 'pro_founder',
  category: '3ra',
  elo: 1650,
  hostedMatchesCount: 99,
  favoritePosition: 'drive',
  loggedInAt: Date.now()
};

const regularUser: UserSession = {
  id: 'usr-regular-1',
  name: 'Juan Perez',
  email: 'juan.perez@test.cl',
  plan: 'free',
  category: '5ta',
  elo: 1200,
  hostedMatchesCount: 1,
  favoritePosition: 'reves',
  loggedInAt: Date.now()
};

if (!authService.isAdmin(adminUser)) {
  throw new Error('Admin user mariolabbes@gmail.com should be authorized as admin');
}
console.log('✅ PASS: mariolabbes@gmail.com recognized as authorized Admin');

if (authService.isAdmin(regularUser)) {
  throw new Error('Regular user juan.perez@test.cl must NOT be authorized as admin');
}
console.log('✅ PASS: Regular user blocked from admin privileges');

if (authService.isAdmin(null)) {
  throw new Error('Unauthenticated user must NOT be authorized as admin');
}
console.log('✅ PASS: Null user blocked from admin privileges');

// 2. Test User Management
await authService.register({
  name: 'Test Player Admin',
  email: 'testplayer@padelmatch.cl',
  password: 'Password123!',
  category: '6ta',
  favoritePosition: 'drive',
  city: 'Santiago'
});

let allUsers = authService.getAllRegisteredUsers();
const foundUser = allUsers.find(u => u.email === 'testplayer@padelmatch.cl');
if (!foundUser) {
  throw new Error('Newly created test player not found in all users');
}
console.log(`✅ PASS: Registered user directory returned ${allUsers.length} users`);

// Update user plan & courtesy matches
authService.adminUpdateUser('testplayer@padelmatch.cl', {
  plan: 'subscribed',
  category: '4ta',
  hostedMatchesCount: 50
});

allUsers = authService.getAllRegisteredUsers();
const updatedUser = allUsers.find(u => u.email === 'testplayer@padelmatch.cl');
if (!updatedUser || updatedUser.plan !== 'subscribed' || updatedUser.category !== '4ta' || updatedUser.hostedMatchesCount !== 50) {
  throw new Error('Admin user update failed');
}
console.log('✅ PASS: Admin successfully modified user plan to PRO and updated courtesy matches');

// Delete user
const deleted = authService.adminDeleteUser('testplayer@padelmatch.cl');
if (!deleted) {
  throw new Error('Admin delete user failed');
}
allUsers = authService.getAllRegisteredUsers();
if (allUsers.find(u => u.email === 'testplayer@padelmatch.cl')) {
  throw new Error('User was not removed after admin delete');
}
console.log('✅ PASS: Admin successfully removed user from system');

// 3. Test Club Management
const newClub = clubService.adminAddClub({
  name: 'Club Padel Test Admin',
  city: 'Santiago',
  commune: 'Las Condes',
  address: 'Av. Las Condes 1234',
  indoorOutdoor: 'indoor',
  courtsCount: 8,
  verified: false
});

let clubs = clubService.getClubs();
let foundClub = clubs.find(c => c.id === newClub.id);
if (!foundClub) {
  throw new Error('Admin added club not found');
}
console.log(`✅ PASS: Admin created official club: ${foundClub.name} (${foundClub.courtsCount} canchas)`);

// Toggle verification
clubService.adminToggleVerifyClub(newClub.id);
clubs = clubService.getClubs();
foundClub = clubs.find(c => c.id === newClub.id);
if (!foundClub || !foundClub.verified) {
  throw new Error('Admin verify club failed');
}
console.log('✅ PASS: Admin toggled club verification badge to verified');

// Delete club
const clubDeleted = clubService.adminDeleteClub(newClub.id);
if (!clubDeleted) {
  throw new Error('Admin delete club failed');
}
clubs = clubService.getClubs();
if (clubs.find(c => c.id === newClub.id)) {
  throw new Error('Club was not removed after admin delete');
}
console.log('✅ PASS: Admin successfully deleted club from directory');

// 4. Test Group Management
const testGroup = groupService.createGroup({
  name: 'Grupo Padel Test Admin',
  description: 'Grupo creado para test de administracion',
  city: 'Santiago',
  clubPreferred: 'Padel Club Central',
  categoryLevel: '4ta',
  creator: {
    id: adminUser.id,
    name: adminUser.name,
    category: adminUser.category || '4ta',
    elo: adminUser.elo || 1500
  }
});

let groups = groupService.getGroups();
if (!groups.find(g => g.id === testGroup.id)) {
  throw new Error('Test group not found');
}
console.log(`✅ PASS: Group created (${testGroup.name})`);

const groupDeleted = groupService.adminDeleteGroup(testGroup.id);
if (!groupDeleted) {
  throw new Error('Admin delete group failed');
}
groups = groupService.getGroups();
if (groups.find(g => g.id === testGroup.id)) {
  throw new Error('Group was not removed after admin delete');
}
console.log('✅ PASS: Admin successfully moderated and deleted group');

// 5. Test Match Audit & Deletion
const testMatch = communityService.saveMatchResult(
  'Cancha 1 - Club Central',
  'Equipo 1',
  ['Mario Labbé', 'Fernando González'],
  'Equipo 2',
  ['Nicolás Massú', 'Marcelo Ríos'],
  [{ team1: 6, team2: 4 }, { team1: 4, team2: 6 }, { team1: 6, team2: 3 }],
  'team1',
  16,
  'completed'
);

let matches = communityService.getMatches();
if (!matches.find(m => m.id === testMatch.id)) {
  throw new Error('Saved match not found');
}
console.log('✅ PASS: Match found in global match log');

const matchDeleted = communityService.adminDeleteMatch(testMatch.id);
if (!matchDeleted) {
  throw new Error('Admin delete match failed');
}
matches = communityService.getMatches();
if (matches.find(m => m.id === testMatch.id)) {
  throw new Error('Match was not removed after admin delete');
}
console.log('✅ PASS: Admin successfully removed match record from audit log');

console.log('\n🎉 ALL ADMIN AUTHORIZATION & MANAGEMENT TESTS PASSED PERFECTLY! 🛡️');
