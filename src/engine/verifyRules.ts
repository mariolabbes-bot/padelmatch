import { createInitialMatchState, scorePoint } from './padelEngine';
import { calculatePadelElo } from './eloEngine';
import type { MatchRules, Team } from '../types/padel';

const dummyTeams: { team1: Team; team2: Team } = {
  team1: {
    id: 'team1',
    name: 'Pareja 1',
    color: '#00e676',
    player1: { id: 'p1', name: 'Jugador 1A', position: 'drive', elo: 1300 },
    player2: { id: 'p2', name: 'Jugador 1B', position: 'reves', elo: 1300 }
  },
  team2: {
    id: 'team2',
    name: 'Pareja 2',
    color: '#00b0ff',
    player1: { id: 'p3', name: 'Jugador 2A', position: 'drive', elo: 1300 },
    player2: { id: 'p4', name: 'Jugador 2B', position: 'reves', elo: 1300 }
  }
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('--- TEST SUITE: PADEL ENGINE RULES & SIMULATION ---\n');

// 1. TEST: Golden Point (Punto de Oro)
{
  const rules: MatchRules = {
    format: 'best_of_3',
    gameRule: 'golden_point',
    tieBreakRule: 'standard',
    thirdSetRule: 'super_tiebreak',
    superTieBreakTarget: 10
  };

  let state = createInitialMatchState(rules);
  // Score to 40-40
  // Team 1: 15, 30, 40
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState; // 15-0
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState; // 30-0
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState; // 40-0
  // Team 2: 15, 30, 40
  state = scorePoint(state, 'team2', rules, dummyTeams).nextState; // 40-15
  state = scorePoint(state, 'team2', rules, dummyTeams).nextState; // 40-30
  state = scorePoint(state, 'team2', rules, dummyTeams).nextState; // 40-40 (Punto de Oro)

  assert(state.currentGame.team1 === '40' && state.currentGame.team2 === '40', 'Game is at 40-40');
  
  // Under golden point, next point by team2 wins game directly
  const res = scorePoint(state, 'team2', rules, dummyTeams);
  state = res.nextState;

  assert(state.sets[0].team2 === 1, 'Team 2 won the game with Golden Point');
  assert(state.currentGame.team1 === '0' && state.currentGame.team2 === '0', 'Game score reset to 0-0 for next game');
}

// 2. TEST: Advantage Rule (Deuce tradicional)
{
  const rules: MatchRules = {
    format: 'best_of_3',
    gameRule: 'advantage',
    tieBreakRule: 'standard',
    thirdSetRule: 'full_set',
    superTieBreakTarget: 10
  };

  let state = createInitialMatchState(rules);
  // Reach 40-40
  for (let i = 0; i < 3; i++) state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
  for (let i = 0; i < 3; i++) state = scorePoint(state, 'team2', rules, dummyTeams).nextState;

  // Team 1 scores -> Advantage Team 1
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
  assert(state.currentGame.team1 === 'AD' && state.currentGame.team2 === '40', 'Team 1 has Advantage');

  // Team 2 scores -> back to 40-40 (Deuce)
  state = scorePoint(state, 'team2', rules, dummyTeams).nextState;
  assert(state.currentGame.team1 === '40' && state.currentGame.team2 === '40', 'Back to 40-40 deuce');

  // Team 1 scores -> AD -> Game
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
  assert(state.sets[0].team1 === 1, 'Team 1 won the game with 2 consecutive points from deuce');
}

// 3. TEST: Standard Tie-break at 6-6
{
  const rules: MatchRules = {
    format: 'best_of_3',
    gameRule: 'golden_point',
    tieBreakRule: 'standard',
    thirdSetRule: 'super_tiebreak',
    superTieBreakTarget: 10
  };

  let state = createInitialMatchState(rules);
  // Simulate 6 games each
  state.sets[0].team1 = 6;
  state.sets[0].team2 = 5;

  // Team 2 wins a game to reach 6-6
  for (let i = 0; i < 4; i++) {
    state = scorePoint(state, 'team2', rules, dummyTeams).nextState;
  }

  assert(state.sets[0].team1 === 6 && state.sets[0].team2 === 6, 'Reached 6-6 in games');
  assert(state.isTieBreak === true, 'Tie-break automatically started at 6-6');

  // Score in tiebreak to 7-5
  for (let i = 0; i < 5; i++) {
    state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
    state = scorePoint(state, 'team2', rules, dummyTeams).nextState;
  }
  assert(state.currentGame.team1 === 5 && state.currentGame.team2 === 5, 'Tie-break at 5-5 points');

  // Team 1 scores 2 more points -> 7-5 -> Set won 7-6!
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState;

  assert(state.sets[0].team1 === 7 && state.sets[0].team2 === 6, 'Set 1 won by Team 1: 7-6');
  assert(state.currentSetIndex === 1, 'Moved to Set 2');
}

// 4. TEST: Deciding Super Tie-break to 10 points
{
  const rules: MatchRules = {
    format: 'best_of_3',
    gameRule: 'golden_point',
    tieBreakRule: 'standard',
    thirdSetRule: 'super_tiebreak',
    superTieBreakTarget: 10
  };

  let state = createInitialMatchState(rules);
  // Team 1 won set 1, Team 2 won set 2
  state.sets = [
    { team1: 6, team2: 4 },
    { team1: 3, team2: 6 }
  ];
  state.currentSetIndex = 1;

  // Trigger win of Set 2 for Team 2:
  state.sets[1] = { team1: 3, team2: 5 };
  for (let i = 0; i < 4; i++) {
    state = scorePoint(state, 'team2', rules, dummyTeams).nextState;
  }

  assert(state.currentSetIndex === 2, 'Entered 3rd Set');
  assert(state.isSuperTieBreak === true, '3rd Set is configured as Super Tie-break');

  // Play Super Tiebreak up to 10-8
  for (let i = 0; i < 8; i++) {
    state = scorePoint(state, 'team1', rules, dummyTeams).nextState;
    state = scorePoint(state, 'team2', rules, dummyTeams).nextState;
  }
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState; // 9-8
  state = scorePoint(state, 'team1', rules, dummyTeams).nextState; // 10-8

  assert(state.isMatchOver === true, 'Match is over after Super Tie-break reached 10 points with diff of 2');
  assert(state.winner === 'team1', 'Team 1 is the match winner');
}

// 5. TEST: ELO Rating Adjustments
{
  const eloResult = calculatePadelElo(
    [dummyTeams.team1.player1, dummyTeams.team1.player2],
    [dummyTeams.team2.player1, dummyTeams.team2.player2],
    'team1',
    [{ team1: 6, team2: 3 }, { team1: 6, team2: 4 }]
  );

  assert(eloResult.team1Delta > 0, `Team 1 gained positive ELO (+${eloResult.team1Delta})`);
  assert(eloResult.team2Delta < 0, `Team 2 lost ELO (${eloResult.team2Delta})`);
}

console.log('\n🎉 ALL PADEL ENGINE UNIT TESTS PASSED WITH 100% SUCCESS!');
