import { scheduleService } from '../services/scheduleService';
import type { UserSession } from '../services/authService';
import type { CommunityPlayer } from '../types/padel';

declare const process: any;

console.log('--- TEST SUITE: SCHEDULED MATCHES & WHATSAPP INVITATIONS ---');

// Mock host user
const hostUser: UserSession = {
  id: 'user_host_1',
  name: 'Mario Labbé',
  email: 'mariolabbes@gmail.com',
  plan: 'pro_founder',
  category: '4ta',
  favoritePosition: 'drive',
  elo: 1520,
  city: 'La Serena',
  avatar: '👑',
  loggedInAt: Date.now()
};

// Mock partner users
const partner1: CommunityPlayer = {
  id: 'user_p2',
  name: 'Fernando González',
  email: 'feña@padel.cl',
  category: '4ta',
  elo: 1490,
  avatar: '🎾',
  matchesPlayed: 12,
  matchesWon: 8,
  winStreak: 3,
  favoritePosition: 'reves'
};

const partner2: CommunityPlayer = {
  id: 'user_p3',
  name: 'Matías Silva',
  email: 'mati@padel.cl',
  category: '5ta',
  elo: 1410,
  matchesPlayed: 10,
  matchesWon: 5,
  winStreak: 1,
  favoritePosition: 'drive'
};

const partner3: CommunityPlayer = {
  id: 'user_p4',
  name: 'Cristóbal Ríos',
  email: 'cris@padel.cl',
  category: '4ta',
  elo: 1480,
  matchesPlayed: 15,
  matchesWon: 9,
  winStreak: 2,
  favoritePosition: 'ambas'
};

// 1. Create a scheduled match
console.log('1. Creating scheduled match...');
const scheduledMatch = scheduleService.createScheduledMatch(hostUser, {
  clubName: 'Club Padel La Serena',
  courtName: 'Cancha Central 1',
  matchDate: '2026-10-25',
  matchTime: '19:30',
  invitedPartners: [partner1, partner2],
  notes: 'Pelotas Bullpadel nuevas, llegar 10 min antes.'
});

if (!scheduledMatch || scheduledMatch.status !== 'open') {
  throw new Error('Scheduled match creation failed or status is not open');
}
console.log(`✅ PASS: Scheduled match created (ID: ${scheduledMatch.id}, Status: ${scheduledMatch.status})`);

// Verify slot count and host
if (scheduledMatch.slots.length !== 4) {
  throw new Error(`Expected 4 slots, got ${scheduledMatch.slots.length}`);
}
if (!scheduledMatch.slots[0].isHost || scheduledMatch.slots[0].status !== 'confirmed') {
  throw new Error('Host slot is not properly confirmed');
}
console.log('✅ PASS: Slot 0 reserved and confirmed for Host');

// 2. Invite additional partner to fill slot 3
console.log('2. Inviting additional 3rd partner to fill last slot...');
const added = scheduleService.inviteAdditionalPartner(scheduledMatch.id, partner3, hostUser);
if (!added) {
  throw new Error('Failed to invite additional partner');
}
const updatedMatch1 = scheduleService.getMatchById(scheduledMatch.id);
const pendingCount = updatedMatch1?.slots.filter(s => s.status === 'pending').length;
if (pendingCount !== 3) {
  throw new Error(`Expected 3 pending invited slots, got ${pendingCount}`);
}
console.log('✅ PASS: All 3 invited slots populated with pending status');

// 3. Partner 1 accepts invite
console.log('3. Partner 1 (Fernando) accepts invite...');
const accepted1 = scheduleService.respondInvite(scheduledMatch.id, partner1, true);
if (!accepted1.success) throw new Error('Partner 1 accept failed: ' + accepted1.error);
const matchAfterP1 = scheduleService.getMatchById(scheduledMatch.id);
const p1Slot = matchAfterP1?.slots.find(s => s.playerId === partner1.id);
if (p1Slot?.status !== 'confirmed') {
  throw new Error('Partner 1 slot not marked confirmed');
}
console.log('✅ PASS: Partner 1 confirmed slot');

// 4. Partner 2 declines invite
console.log('4. Partner 2 (Matías) declines invite...');
const declined2 = scheduleService.respondInvite(scheduledMatch.id, partner2, false);
if (!declined2.success) throw new Error('Partner 2 decline failed');
const matchAfterP2 = scheduleService.getMatchById(scheduledMatch.id);
const openSlot = matchAfterP2?.slots.find(s => s.status === 'declined');
if (!openSlot) {
  throw new Error('Slot was not reopened with declined status');
}
console.log('✅ PASS: Partner 2 slot marked declined, opening spot');

// 5. External guest accepts via public WhatsApp link RSVP
console.log('5. External guest joins via WhatsApp invite link...');
const guestSlotUpdated = scheduleService.respondInvite(
  scheduledMatch.id,
  { name: 'Carlos Beltrán (Invitado)', phone: '+56911223344', category: '4ta' },
  true
);
if (!guestSlotUpdated.success) throw new Error('Guest RSVP failed: ' + guestSlotUpdated.error);
const matchAfterGuest = scheduleService.getMatchById(scheduledMatch.id);
const guestSlot = matchAfterGuest?.slots.find(s => s.name.includes('Carlos Beltrán'));
if (!guestSlot || guestSlot.status !== 'confirmed') {
  throw new Error('Guest slot not confirmed');
}
console.log('✅ PASS: Guest RSVP confirmed in the available slot');

// 6. Partner 3 accepts invite
console.log('6. Partner 3 (Cristóbal) accepts invite...');
const accepted3 = scheduleService.respondInvite(scheduledMatch.id, partner3, true);
if (!accepted3.success) throw new Error('Partner 3 accept failed: ' + accepted3.error);
const matchReady = scheduleService.getMatchById(scheduledMatch.id);
const confirmedPlayers = matchReady?.slots.filter(s => s.status === 'confirmed').length;
if (confirmedPlayers !== 4) {
  throw new Error(`Expected 4/4 confirmed players, got ${confirmedPlayers}`);
}
console.log('✅ PASS: Quorum complete (4/4 confirmed players)');

// 7. Host confirms and closes match
console.log('7. Host confirms and closes match for all 4 players...');
const closed = scheduleService.confirmAndCloseMatch(scheduledMatch.id, hostUser);
if (!closed.success) throw new Error('Failed to confirm and close match: ' + closed.error);
const confirmedMatch = scheduleService.getMatchById(scheduledMatch.id);
if (confirmedMatch?.status !== 'confirmed') {
  throw new Error('Match status not changed to confirmed');
}
console.log('✅ PASS: Match confirmed and scheduled for all 4 players');

// 8. Test user dashboards categorisation
console.log('8. Testing user dashboards categorization...');
const hostOverview = scheduleService.getMatchesForUser(hostUser);
if (hostOverview.confirmedUpcoming.length !== 1) {
  throw new Error('Expected 1 confirmed upcoming match for Host');
}
const p1User: UserSession = {
  id: partner1.id,
  email: partner1.email!,
  name: partner1.name,
  plan: 'free',
  category: partner1.category,
  favoritePosition: partner1.favoritePosition,
  elo: partner1.elo,
  loggedInAt: Date.now()
};
const p1Overview = scheduleService.getMatchesForUser(p1User);
if (p1Overview.confirmedUpcoming.length !== 1) {
  throw new Error('Expected 1 confirmed upcoming match for Partner 1');
}
console.log('✅ PASS: Match appears in confirmed upcoming section for both Host and Player 1');

// 9. Test WhatsApp message generators
console.log('9. Testing WhatsApp invite and cancellation copy generators...');
const waInvite = scheduleService.generateWhatsAppInviteText(confirmedMatch!, hostUser.name);
if (!waInvite.includes('padelmatch.web.app#match-invite=') || !waInvite.includes('Club Padel La Serena')) {
  throw new Error('WhatsApp invite missing essential metadata or hash URL');
}
console.log('✅ PASS: WhatsApp invite text formatted with URL and club data');

const waCancel = scheduleService.generateWhatsAppCancellationText(confirmedMatch!, 'Lluvia / Cancha mojada');
if (!waCancel.includes('CANCELADO') || !waCancel.includes('Lluvia / Cancha mojada')) {
  throw new Error('WhatsApp cancel message missing details');
}
console.log('✅ PASS: WhatsApp cancellation text formatted with cancellation reason');

// 10. Match cancellation test
console.log('10. Host cancels match...');
const cancelled = scheduleService.cancelScheduledMatch(scheduledMatch.id, hostUser, 'Lluvia');
if (!cancelled.success) throw new Error('Cancellation failed: ' + cancelled.error);
const finalMatch = scheduleService.getMatchById(scheduledMatch.id);
if (finalMatch?.status !== 'cancelled') {
  throw new Error('Match status not cancelled');
}
const hostOverviewAfterCancel = scheduleService.getMatchesForUser(hostUser);
if (hostOverviewAfterCancel.confirmedUpcoming.length !== 0 || hostOverviewAfterCancel.pastMatches.length !== 1) {
  throw new Error('Match did not move to past/cancelled history');
}
console.log('✅ PASS: Match successfully cancelled and moved to past history');

console.log('\n🎉 ALL SCHEDULED MATCHES & INVITATIONS TESTS PASSED SUCCESSFULLY! 🎾');
process.exit(0);
