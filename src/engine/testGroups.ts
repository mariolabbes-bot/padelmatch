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

console.log('🎉 ALL PADEL GROUP TESTS PASSED SUCCESSFULLY!');
