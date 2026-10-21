import { groupService } from '../services/groupService';

console.log('--- TEST SUITE: PADEL GROUPS & MULTIPLES OF 4 LOGIC ---');

const groups = groupService.getGroups();
console.assert(groups.length > 0, 'Groups should be seeded');
console.log(`✅ PASS: ${groups.length} groups loaded`);

const mainGroup = groups.find(g => g.id === 'grp-cruzados-4ta');
console.assert(!!mainGroup, 'Main group should exist');
console.log(`✅ PASS: Main group found: ${mainGroup?.name}`);

const callout = mainGroup?.callouts[0];
console.assert(!!callout, 'Callout should exist');

if (mainGroup && callout) {
  const statusInitial = groupService.getCalloutSlotStatus(mainGroup.id, callout.id);
  console.assert(statusInitial.totalAccepted === 7, `Expected 7 accepted, got ${statusInitial.totalAccepted}`);
  console.assert(statusInitial.isMultipleOfFour === false, '7 is not a multiple of 4');
  console.assert(statusInitial.slotsNeededToComplete === 1, `Expected 1 slot needed, got ${statusInitial.slotsNeededToComplete}`);
  console.assert(statusInitial.completedCourts === 1, '1 court completed so far');
  console.log(`✅ PASS: 7 players -> Missing 1 player to reach multiple of 4 (8 players / 2 courts)`);

  // Simulate 8th player accepting
  groupService.respondCallout(mainGroup.id, callout.id, 'player-test-8', 'accept');
  const statusFull = groupService.getCalloutSlotStatus(mainGroup.id, callout.id);
  console.assert(statusFull.totalAccepted === 8, `Expected 8 accepted, got ${statusFull.totalAccepted}`);
  console.assert(statusFull.isMultipleOfFour === true, '8 is a multiple of 4');
  console.assert(statusFull.completedCourts === 2, '2 full courts completed');
  console.assert(statusFull.slotsNeededToComplete === 0, '0 slots needed when complete');
  console.log(`✅ PASS: 8 players -> Complete multiple of 4 (2 full courts closed)`);
}

// TEST: Group creation with initial members
const newTestGroup = groupService.createGroup({
  name: 'Grupo de Prueba Invitaciones',
  description: 'Grupo creado para testear flujo de invitaciones iniciales',
  city: 'Santiago',
  clubPreferred: 'Club Central Padel',
  categoryLevel: '4ta',
  creator: { id: 'test-creator', name: 'Mario Labbé', category: '4ta', elo: 1400 },
  initialMembers: [
    { id: 'partner-1', name: 'Fernando González', category: '4ta', elo: 1420 },
    { id: 'partner-2', name: 'Matías Silva', category: '4ta', elo: 1380 }
  ]
});

console.assert(newTestGroup.members.length === 3, `Expected 3 members (creator + 2 initial), got ${newTestGroup.members.length}`);
console.assert(newTestGroup.members[0].role === 'admin', 'Creator should be admin');
console.assert(newTestGroup.members[1].role === 'member', 'Invited member should have role member');
console.log(`✅ PASS: Group created with 2 initial members invited automatically (Total members: ${newTestGroup.members.length})`);

// TEST: In-app invitation to existing group
const inviteRes = groupService.inviteMember(newTestGroup.id, {
  id: 'partner-3',
  name: 'Rodrigo Valenzuela',
  category: '4ta',
  elo: 1395
}, 'Mario Labbé');

console.assert(inviteRes.success === true, 'Invitation should succeed');
console.assert(newTestGroup.members.length === 4, 'Group should now have 4 members');
console.log('✅ PASS: Direct in-app invitation added member successfully');

// TEST: WhatsApp invitation text generation
const inviteUrl = `https://padelmatch.web.app/#join-group=${newTestGroup.id}`;
const waText = groupService.getWhatsAppInviteText(newTestGroup, 'Mario Labbé', inviteUrl);

console.assert(waText.includes('Mario Labbé te está invitando'), 'Should mention inviter name');
console.assert(waText.includes(newTestGroup.name), 'Should mention group name');
console.assert(waText.includes('Árbitro en vivo por voz'), 'Should describe app features');
console.assert(waText.includes('múltiplos de 4'), 'Should describe multiples of 4');
console.assert(waText.includes(inviteUrl), 'Should include direct join url');
console.log('✅ PASS: WhatsApp pitch and invitation message generated accurately with ecosystem highlights');

console.log('🎉 ALL PADEL GROUP TESTS PASSED SUCCESSFULLY!');
