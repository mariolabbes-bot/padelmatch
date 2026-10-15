import { createInitialMatchState, scorePoint } from './padelEngine';
import { communityService } from '../services/communityService';
import type { MatchRules, Team } from '../types/padel';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log('--- INTEGRATION TEST: SIDE CHANGE, REST, PAUSE & EARLY FINISH ---');

const rules: MatchRules = {
  format: 'best_of_3',
  gameRule: 'golden_point',
  tieBreakRule: 'standard',
  thirdSetRule: 'super_tiebreak',
  superTieBreakTarget: 10,
  courtName: 'Pista Central',
  sideChangeEnabled: true,
  sideChangeRestSeconds: 90
};

const teams: { team1: Team; team2: Team } = {
  team1: {
    id: 'team1',
    name: 'Lebrón / Galán',
    color: '#00e676',
    player1: { id: 'p1', name: 'Juan Lebrón', position: 'drive', elo: 1400 },
    player2: { id: 'p2', name: 'Alejandro Galán', position: 'reves', elo: 1450 }
  },
  team2: {
    id: 'team2',
    name: 'Tapia / Coello',
    color: '#00b0ff',
    player1: { id: 'p3', name: 'Agustín Tapia', position: 'reves', elo: 1480 },
    player2: { id: 'p4', name: 'Arturo Coello', position: 'drive', elo: 1460 }
  }
};

// 1. Initial State
let state = createInitialMatchState(rules);
assert(!state.isResting, 'Initial isResting is false');
assert(!state.isPaused, 'Initial isPaused is false');
assert(state.restSecondsRemaining === 0, 'Initial restSecondsRemaining is 0');

// 2. Play Game 1 (Odd game: 1-0)
for (let i = 0; i < 4; i++) {
  state = scorePoint(state, 'team1', rules, teams).nextState;
}

assert(state.sets[0].team1 === 1, 'Game 1 won by Team 1');
assert(state.sideChangeNeeded === true, 'Side change needed after Game 1');
assert(state.isResting === true, 'Rest countdown started after Game 1');
assert(state.restSecondsRemaining === 90, 'Rest timer set to 90 seconds');

// 3. Skip Rest (from Phone or Apple Watch)
state.isResting = false;
state.restSecondsRemaining = 0;
assert(!state.isResting, 'Rest skipped successfully');

// 4. Play Game 2 (Even game: 1-1)
for (let i = 0; i < 4; i++) {
  state = scorePoint(state, 'team2', rules, teams).nextState;
}
assert(state.sets[0].team2 === 1, 'Game 2 won by Team 2');
assert(!state.sideChangeNeeded, 'No side change after even Game 2');
assert(!state.isResting, 'No rest after even Game 2');

// 5. Test Manual Pause
state.isPaused = true;
assert(state.isPaused === true, 'Match manually paused');
state.isPaused = false;
assert(state.isPaused === false, 'Match resumed from pause');

// 6. Test Finish Match Early (Inconcluso / Court Time Expired)
communityService.addPlayer({ name: 'Juan Lebrón', category: '1ra', favoritePosition: 'drive', elo: 1400 });
const initialP1Elo = communityService.searchPlayer('Juan Lebrón')[0].elo;

const record = communityService.saveMatchResult(
  rules.courtName || 'Pista Central',
  teams.team1.name,
  [teams.team1.player1.name, teams.team1.player2.name],
  teams.team2.name,
  [teams.team2.player1.name, teams.team2.player2.name],
  state.sets,
  'none', // Incomplete match without winner
  0,
  'unfinished'
);

assert(record.status === 'unfinished', 'Record saved with status: unfinished');
assert(record.winner === 'none', 'Record winner is none');

const updatedP1 = communityService.searchPlayer('Juan Lebrón')[0];
assert(updatedP1.elo === initialP1Elo, `ELO unchanged for unfinished match (ELO=${updatedP1.elo})`);
assert(updatedP1.matchesPlayed > 0, 'Match was counted in player history');

console.log('\n🎉 ALL INTEGRATION FLOW TESTS PASSED SUCCESSFULLY!');
