import type { MatchRules, MatchScoreState, Team, PointScore } from '../types/padel';

export function createInitialMatchState(rules: MatchRules): MatchScoreState {
  const isSuperTie = rules.format === 'single_set' && rules.thirdSetRule === 'super_tiebreak';
  
  return {
    sets: [{ team1: 0, team2: 0 }],
    currentSetIndex: 0,
    currentGame: {
      team1: isSuperTie ? 0 : '0',
      team2: isSuperTie ? 0 : '0'
    },
    isTieBreak: false,
    isSuperTieBreak: isSuperTie,
    servingTeam: 'team1',
    servingPlayer: 1,
    sideChangeNeeded: false,
    isMatchOver: false,
    winner: undefined,
    lastEventAnnouncement: 'Comienza el partido. Servicio Pareja 1.'
  };
}

export interface PointResult {
  nextState: MatchScoreState;
  announcement: string;
}

export function scorePoint(
  currentState: MatchScoreState,
  scoringTeam: 'team1' | 'team2',
  rules: MatchRules,
  teams: { team1: Team; team2: Team }
): PointResult {
  if (currentState.isMatchOver) {
    return {
      nextState: currentState,
      announcement: `El partido ya ha finalizado. Ganador: ${teams[currentState.winner!].name}`
    };
  }

  const opposingTeam: 'team1' | 'team2' = scoringTeam === 'team1' ? 'team2' : 'team1';
  const state: MatchScoreState = JSON.parse(JSON.stringify(currentState));
  let announcement = '';

  // 1. TIE-BREAK OR SUPER TIE-BREAK POINT
  if (state.isTieBreak || state.isSuperTieBreak) {
    const currentScore1 = (state.currentGame.team1 as number) + (scoringTeam === 'team1' ? 1 : 0);
    const currentScore2 = (state.currentGame.team2 as number) + (scoringTeam === 'team2' ? 1 : 0);
    state.currentGame.team1 = currentScore1;
    state.currentGame.team2 = currentScore2;

    const targetPoints = state.isSuperTieBreak ? rules.superTieBreakTarget : 7;
    const scoringPoints = scoringTeam === 'team1' ? currentScore1 : currentScore2;
    const opposingPoints = scoringTeam === 'team1' ? currentScore2 : currentScore1;
    const totalPointsPlayed = currentScore1 + currentScore2;

    // Tie-break side change every 6 points
    if (totalPointsPlayed % 6 === 0) {
      state.sideChangeNeeded = true;
    } else {
      state.sideChangeNeeded = false;
    }

    // Tie-break service rotation: point 1 served by initial server, then alternates every 2 points
    if (totalPointsPlayed % 2 === 1) {
      state.servingTeam = state.servingTeam === 'team1' ? 'team2' : 'team1';
      state.servingPlayer = state.servingPlayer === 1 ? 2 : 1;
    }

    // Check if tie-break is won
    if (scoringPoints >= targetPoints && scoringPoints - opposingPoints >= 2) {
      // Tie-break won!
      const currentSet = state.sets[state.currentSetIndex];
      currentSet[scoringTeam] += 1;
      currentSet.tiebreakPoints = {
        team1: currentScore1,
        team2: currentScore2
      };

      const setWonAnnouncement = `Set para ${teams[scoringTeam].name}, ${currentSet.team1} a ${currentSet.team2} en tie-break.`;
      
      // Check if match won
      const setsNeededToWin = rules.format === 'best_of_5' ? 3 : (rules.format === 'best_of_3' ? 2 : 1);
      const setsWonByScorer = state.sets.filter(s => s[scoringTeam] > s[opposingTeam]).length;

      if (setsWonByScorer >= setsNeededToWin) {
        state.isMatchOver = true;
        state.winner = scoringTeam;
        announcement = `¡Punto, set y partido para ${teams[scoringTeam].name}! Felicitaciones.`;
      } else {
        // Next set
        state.currentSetIndex += 1;
        state.sets.push({ team1: 0, team2: 0 });
        state.isTieBreak = false;
        
        // Check if upcoming set is Super Tie-break
        const isDecidingSet = (rules.format === 'best_of_3' && state.currentSetIndex === 2) ||
                             (rules.format === 'best_of_5' && state.currentSetIndex === 4);
        if (isDecidingSet && rules.thirdSetRule === 'super_tiebreak') {
          state.isSuperTieBreak = true;
          state.currentGame = { team1: 0, team2: 0 };
          announcement = `${setWonAnnouncement} Comienza el Súper Tie-break definitivo a ${rules.superTieBreakTarget} puntos.`;
        } else {
          state.isSuperTieBreak = false;
          state.currentGame = { team1: '0', team2: '0' };
          announcement = `${setWonAnnouncement} Cambio de lado para iniciar el siguiente set.`;
          state.sideChangeNeeded = true;
        }
      }
    } else {
      // Tie-break point announced
      const leader = currentScore1 > currentScore2 ? 'team1' : (currentScore2 > currentScore1 ? 'team2' : null);
      if (leader) {
        const leadScore = Math.max(currentScore1, currentScore2);
        const trailScore = Math.min(currentScore1, currentScore2);
        announcement = `${leadScore} a ${trailScore}, ${teams[leader].name}.`;
      } else {
        announcement = `${currentScore1} iguales.`;
      }

      // Check set/match point in tiebreak
      if (scoringPoints >= targetPoints - 1 && scoringPoints > opposingPoints) {
        announcement += " Punto de set.";
      }
      if (state.sideChangeNeeded) {
        announcement += " Cambio de lado.";
      }
    }

    state.lastEventAnnouncement = announcement;
    return { nextState: state, announcement };
  }

  // 2. REGULAR GAME SCORING (0, 15, 30, 40, Golden Point / Advantage)
  const currentScorerPoint = state.currentGame[scoringTeam] as string;
  const currentOpponentPoint = state.currentGame[opposingTeam] as string;

  if (currentScorerPoint === '0') {
    state.currentGame[scoringTeam] = '15';
    announcement = formatScoreCall(state.currentGame.team1, state.currentGame.team2, state.servingTeam, teams);
  } else if (currentScorerPoint === '15') {
    state.currentGame[scoringTeam] = '30';
    announcement = formatScoreCall(state.currentGame.team1, state.currentGame.team2, state.servingTeam, teams);
  } else if (currentScorerPoint === '30') {
    state.currentGame[scoringTeam] = '40';
    if (state.currentGame[opposingTeam] === '40') {
      if (rules.gameRule === 'golden_point') {
        announcement = 'Cuarenta iguales. ¡Punto de Oro!';
      } else {
        announcement = 'Cuarenta iguales. Deuce.';
      }
    } else {
      announcement = formatScoreCall(state.currentGame.team1, state.currentGame.team2, state.servingTeam, teams);
    }
  } else if (currentScorerPoint === '40') {
    if (currentOpponentPoint !== '40' && currentOpponentPoint !== 'AD') {
      announcement = winGame(state, scoringTeam, opposingTeam, rules, teams);
    } else if (currentOpponentPoint === '40') {
      if (rules.gameRule === 'golden_point') {
        announcement = winGame(state, scoringTeam, opposingTeam, rules, teams, true);
      } else {
        state.currentGame[scoringTeam] = 'AD';
        announcement = `Ventaja para ${teams[scoringTeam].name}.`;
      }
    } else if (currentOpponentPoint === 'AD') {
      state.currentGame[opposingTeam] = '40';
      announcement = 'Iguales.';
    }
  } else if (currentScorerPoint === 'AD') {
    announcement = winGame(state, scoringTeam, opposingTeam, rules, teams);
  }

  state.lastEventAnnouncement = announcement;
  return { nextState: state, announcement };
}

function winGame(
  state: MatchScoreState,
  winningTeam: 'team1' | 'team2',
  losingTeam: 'team1' | 'team2',
  rules: MatchRules,
  teams: { team1: Team; team2: Team },
  isGoldenPoint: boolean = false
): string {
  const currentSet = state.sets[state.currentSetIndex];
  currentSet[winningTeam] += 1;

  state.currentGame = { team1: '0', team2: '0' };
  state.servingTeam = state.servingTeam === 'team1' ? 'team2' : 'team1';
  state.servingPlayer = state.servingPlayer === 1 ? 2 : 1;

  const totalGamesInSet = currentSet.team1 + currentSet.team2;
  state.sideChangeNeeded = totalGamesInSet % 2 === 1;

  const winnerGames = currentSet[winningTeam];
  const loserGames = currentSet[losingTeam];

  const gameAnnouncement = isGoldenPoint 
    ? `¡Punto de Oro ganado! Juego para ${teams[winningTeam].name}.`
    : `Juego para ${teams[winningTeam].name}.`;

  let isSetWon = false;

  if (winnerGames >= 6 && winnerGames - loserGames >= 2) {
    isSetWon = true;
  } else if (winnerGames === 7 && loserGames === 5) {
    isSetWon = true;
  } else if (winnerGames === 6 && loserGames === 6) {
    if (rules.tieBreakRule === 'standard') {
      state.isTieBreak = true;
      state.currentGame = { team1: 0, team2: 0 };
      return `${gameAnnouncement} Seis iguales. ¡Comienza el Tie-break a 7 puntos!`;
    }
  }

  if (isSetWon) {
    const setsNeededToWin = rules.format === 'best_of_5' ? 3 : (rules.format === 'best_of_3' ? 2 : 1);
    const setsWonByWinner = state.sets.filter(s => s[winningTeam] > s[losingTeam]).length;

    if (setsWonByWinner >= setsNeededToWin) {
      state.isMatchOver = true;
      state.winner = winningTeam;
      return `¡Punto, set y partido para ${teams[winningTeam].name}! Resultado: ${currentSet.team1} a ${currentSet.team2}. ¡Felicitaciones!`;
    }

    state.currentSetIndex += 1;
    state.sets.push({ team1: 0, team2: 0 });

    const isDecidingSet = (rules.format === 'best_of_3' && state.currentSetIndex === 2) ||
                         (rules.format === 'best_of_5' && state.currentSetIndex === 4);

    if (isDecidingSet && rules.thirdSetRule === 'super_tiebreak') {
      state.isSuperTieBreak = true;
      state.currentGame = { team1: 0, team2: 0 };
      return `Set para ${teams[winningTeam].name}, ${winnerGames} a ${loserGames}. ¡Inicia el Súper Tie-break definitivo a ${rules.superTieBreakTarget} puntos!`;
    }

    return `Set para ${teams[winningTeam].name}, ${winnerGames} a ${loserGames}. Cambio de lado.`;
  }

  const leaderMsg = winnerGames > loserGames 
    ? `${winnerGames} a ${loserGames}, lidera ${teams[winningTeam].name}.`
    : (winnerGames === loserGames ? `${winnerGames} iguales.` : `${loserGames} a ${winnerGames}, lidera ${teams[losingTeam].name}.`);

  const sideChangeMsg = state.sideChangeNeeded ? " Cambio de lado." : "";
  return `${gameAnnouncement} ${leaderMsg}${sideChangeMsg}`;
}

function formatScoreCall(
  score1: PointScore | number,
  score2: PointScore | number,
  servingTeam: 'team1' | 'team2',
  teams: { team1: Team; team2: Team }
): string {
  if (typeof score1 === 'number' && typeof score2 === 'number') {
    if (score1 === score2) return `${score1} iguales.`;
    const high = Math.max(score1, score2);
    const low = Math.min(score1, score2);
    const leadingTeam = score1 > score2 ? teams.team1.name : teams.team2.name;
    return `${high} a ${low}, ${leadingTeam}.`;
  }

  const serverScore = servingTeam === 'team1' ? score1 : score2;
  const receiverScore = servingTeam === 'team1' ? score2 : score1;

  if (serverScore === receiverScore) {
    if (serverScore === '15') return 'Quince iguales.';
    if (serverScore === '30') return 'Treinta iguales.';
    if (serverScore === '40') return 'Cuarenta iguales.';
  }

  const translatePoint = (pt: PointScore | number) => {
    switch (pt) {
      case '0': return 'Cero';
      case '15': return 'Quince';
      case '30': return 'Treinta';
      case '40': return 'Cuarenta';
      case 'AD': return 'Ventaja';
      default: return String(pt);
    }
  };

  return `${translatePoint(serverScore)} - ${translatePoint(receiverScore)}.`;
}
