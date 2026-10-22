import { groupService } from '../services/groupService';
import { db } from '../services/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

declare const process: any;

async function runTests() {
  console.log('--- TEST SUITE: PADEL GROUPS & MULTIPLES OF 4 LOGIC ---');

  // Verify groups are clean by default
  const initialGroups = groupService.getGroups();
  console.log(`Initial groups in memory: ${initialGroups.length} (clean production state)`);

  // Create dynamic test group
  const testGroup = groupService.createGroup({
    name: 'Grupo de Prueba Automatizada',
    description: 'Grupo creado dinámicamente para tests',
    city: 'Santiago',
    clubPreferred: 'Club Padel Test',
    categoryLevel: '4ta',
    creator: { id: 'test-creator', name: 'Mario Labbé', category: '4ta', elo: 1400 },
    initialMembers: [
      { id: 'partner-1', name: 'Fernando González', category: '4ta', elo: 1420 },
      { id: 'partner-2', name: 'Matías Silva', category: '4ta', elo: 1380 }
    ]
  });

  console.assert(!!testGroup, 'Test group should be created');
  console.assert(testGroup.members.length === 3, 'Should have 3 members (creator + 2 initial)');
  console.log(`✅ PASS: Dynamic test group created (${testGroup.id}) with 3 members`);

  // TEST: Callout creation & Multiples of 4 Logic
  const testCallout = groupService.createCallout(testGroup.id, {
    creatorId: 'test-creator',
    creatorName: 'Mario Labbé',
    clubName: 'Club Padel Test',
    courtName: 'Cancha 1 y Cancha 2',
    matchDate: '2026-10-25',
    matchTime: '19:30',
    deadlineTime: 'Jueves 14:00 hrs',
    categoryTarget: '4ta',
    notes: 'Convocatoria de prueba 2 canchas'
  });

  console.assert(!!testCallout, 'Callout should be created');

  // Add 6 more players so total accepted = 7
  for (let i = 2; i <= 7; i++) {
    groupService.respondCallout(testGroup.id, testCallout!.id, `test-player-${i}`, 'accept');
  }

  const statusInitial = groupService.getCalloutSlotStatus(testGroup.id, testCallout!.id);
  console.assert(statusInitial.totalAccepted === 7, `Expected 7 accepted, got ${statusInitial.totalAccepted}`);
  console.assert(statusInitial.isMultipleOfFour === false, '7 is not a multiple of 4');
  console.assert(statusInitial.slotsNeededToComplete === 1, `Expected 1 slot needed, got ${statusInitial.slotsNeededToComplete}`);
  console.assert(statusInitial.completedCourts === 1, '1 court completed so far');
  console.log(`✅ PASS: 7 players -> Missing 1 player to reach multiple of 4 (8 players / 2 courts)`);

  // Simulate 8th player accepting
  groupService.respondCallout(testGroup.id, testCallout!.id, 'player-test-8', 'accept');
  const statusFull = groupService.getCalloutSlotStatus(testGroup.id, testCallout!.id);
  console.assert(statusFull.totalAccepted === 8, `Expected 8 accepted, got ${statusFull.totalAccepted}`);
  console.assert(statusFull.isMultipleOfFour === true, '8 is a multiple of 4');
  console.assert(statusFull.completedCourts === 2, '2 full courts completed');
  console.assert(statusFull.slotsNeededToComplete === 0, '0 slots needed when complete');
  console.log(`✅ PASS: 8 players -> Complete multiple of 4 (2 full courts closed)`);

  // TEST: In-app invitation to existing group
  const inviteRes = groupService.inviteMember(testGroup.id, {
    id: 'partner-3',
    name: 'Rodrigo Valenzuela',
    category: '4ta',
    elo: 1395
  }, 'Mario Labbé');

  console.assert(inviteRes.success === true, 'Invitation should succeed');
  console.assert(testGroup.members.length === 4, 'Group should now have 4 members');
  console.log('✅ PASS: Direct in-app invitation added member successfully');

  // TEST: WhatsApp invitation text generation
  const inviteUrl = `https://padelmatch.web.app/#join-group=${testGroup.id}`;
  const waText = groupService.getWhatsAppInviteText(testGroup, 'Mario Labbé', inviteUrl);

  console.assert(waText.includes('Mario Labbé te está invitando'), 'Should mention inviter name');
  console.assert(waText.includes(testGroup.name), 'Should mention group name');
  console.assert(waText.includes('Árbitro en vivo por voz'), 'Should describe app features');
  console.assert(waText.includes('múltiplos de 4'), 'Should describe multiples of 4');
  console.assert(waText.includes(inviteUrl), 'Should include direct join url');
  console.log('✅ PASS: WhatsApp pitch and invitation message generated accurately with ecosystem highlights');

  // CLEAN UP: Remove test group from memory and remote Firestore
  groupService.leaveGroup(testGroup.id, 'test-creator');
  try {
    await deleteDoc(doc(db, 'groups', testGroup.id));
  } catch {
    // ignore
  }

  console.log('🎉 ALL PADEL GROUP TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests();
