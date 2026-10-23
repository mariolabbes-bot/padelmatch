import { referralService } from '../services/referralService';

declare const process: any;

console.log('--- TEST SUITE: REFERRAL ATTRIBUTION & ORGANIC ACQUISITION ---');

// 1. Initial State
const initialAll = referralService.getAllReferrals();
console.log(`Initial tracked referrals: ${initialAll.length}`);

// 2. Inviter Mario invites Player Carlos
const inviterId = 'usr-mario-test';
const inviterName = 'Mario Labbé';
const referredId = 'usr-carlos-test';
const referredName = 'Carlos Padel';

console.log('1. Recording new referral from WhatsApp invitation...');
const refRecord = referralService.recordReferral({
  inviterId,
  inviterName,
  referredUserId: referredId,
  referredUserName: referredName,
  referredUserEmail: 'carlos.padel@test.cl',
  source: 'whatsapp_partner'
});

if (refRecord && refRecord.inviterId === inviterId && refRecord.referredUserId === referredId) {
  console.log('✅ PASS: Referral record created successfully');
} else {
  console.error('❌ FAIL: Referral record creation failed');
  process.exit(1);
}

// 3. Verify Stats for Inviter
const statsBeforePro = referralService.getStatsForInviter(inviterId);
if (statsBeforePro.totalInvited >= 1 && statsBeforePro.proSubscribedCount === 0) {
  console.log(`✅ PASS: Inviter stats verified (${statsBeforePro.totalInvited} invited, ${statsBeforePro.proSubscribedCount} PRO)`);
} else {
  console.error('❌ FAIL: Initial inviter stats incorrect', statsBeforePro);
  process.exit(1);
}

// 4. Carlos upgrades to PRO
console.log('2. Carlos upgrades to Plan PRO...');
const updatedRef = referralService.handleProUpgrade(referredId, 'pro_founder');
if (updatedRef && updatedRef.hasSubscribedPro === true && updatedRef.planType === 'pro_founder') {
  console.log('✅ PASS: Referral record successfully upgraded to PRO status');
} else {
  console.error('❌ FAIL: PRO upgrade not reflected in referral record', updatedRef);
  process.exit(1);
}

// 5. Verify Stats for Inviter after PRO upgrade
const statsAfterPro = referralService.getStatsForInviter(inviterId);
if (statsAfterPro.proSubscribedCount >= 1) {
  console.log(`✅ PASS: Inviter PRO stats updated accurately (${statsAfterPro.proSubscribedCount} PRO referred users)`);
} else {
  console.error('❌ FAIL: Inviter PRO stats not incremented', statsAfterPro);
  process.exit(1);
}

// 6. Test Multi-Referrer Ranking
referralService.recordReferral({
  inviterId: 'usr-fernando-test',
  inviterName: 'Fernando Alarcón',
  referredUserId: 'usr-guest-2',
  referredUserName: 'Invitado Dos',
  source: 'whatsapp_partner'
});

const topReferrers = referralService.getTopReferrers();
if (topReferrers.length >= 2 && topReferrers[0].inviterId === inviterId) {
  console.log(`✅ PASS: Top referrers ranking places Mario (#1 with ${topReferrers[0].proSubscribedCount} PROs)`);
} else {
  console.error('❌ FAIL: Top referrers ranking unexpected', topReferrers);
  process.exit(1);
}

// 7. Prevent self-referral
try {
  referralService.recordReferral({
    inviterId: 'usr-self',
    inviterName: 'Self User',
    referredUserId: 'usr-self',
    referredUserName: 'Self User'
  });
  console.error('❌ FAIL: Self referral was not rejected');
  process.exit(1);
} catch (e: any) {
  console.log('✅ PASS: Self-referral prevented successfully');
}

console.log('\n🎉 ALL REFERRAL & ACQUISITION TESTS PASSED SUCCESSFULLY! 🎾\n');
process.exit(0);
