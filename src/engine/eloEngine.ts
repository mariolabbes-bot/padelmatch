import type { Player, SetScore } from '../types/padel';

export interface EloMatchResult {
  team1Expected: number;
  team2Expected: number;
  team1Delta: number;
  team2Delta: number;
  updatedPlayers: {
    team1: [Player, Player];
    team2: [Player, Player];
  };
}

export function calculatePadelElo(
  team1Players: [Player, Player],
  team2Players: [Player, Player],
  winner: 'team1' | 'team2',
  sets: SetScore[],
  kFactor: number = 32
): EloMatchResult {
  const t1AvgElo = ((team1Players[0].elo || 1200) + (team1Players[1].elo || 1200)) / 2;
  const t2AvgElo = ((team2Players[0].elo || 1200) + (team2Players[1].elo || 1200)) / 2;

  // Expected scores (logistic curve)
  const exp1 = 1 / (1 + Math.pow(10, (t2AvgElo - t1AvgElo) / 400));
  const exp2 = 1 - exp1;

  // Actual score: 1 if won, 0 if lost
  const act1 = winner === 'team1' ? 1 : 0;
  const act2 = winner === 'team2' ? 1 : 0;

  // Game margin multiplier (dominance in sets)
  let t1Games = 0;
  let t2Games = 0;
  sets.forEach(s => {
    t1Games += s.team1;
    t2Games += s.team2;
  });
  const totalGames = Math.max(1, t1Games + t2Games);
  const marginMultiplier = 1 + (Math.abs(t1Games - t2Games) / totalGames) * 0.5;

  const rawDelta1 = Math.round(kFactor * marginMultiplier * (act1 - exp1));
  const rawDelta2 = Math.round(kFactor * marginMultiplier * (act2 - exp2));

  return {
    team1Expected: Math.round(exp1 * 100),
    team2Expected: Math.round(exp2 * 100),
    team1Delta: rawDelta1,
    team2Delta: rawDelta2,
    updatedPlayers: {
      team1: [
        { ...team1Players[0], elo: Math.max(600, (team1Players[0].elo || 1200) + rawDelta1) },
        { ...team1Players[1], elo: Math.max(600, (team1Players[1].elo || 1200) + rawDelta1) }
      ],
      team2: [
        { ...team2Players[0], elo: Math.max(600, (team2Players[0].elo || 1200) + rawDelta2) },
        { ...team2Players[1], elo: Math.max(600, (team2Players[1].elo || 1200) + rawDelta2) }
      ]
    }
  };
}

export const DEFAULT_INITIAL_ELO = 1200;

export interface EloTierInfo {
  tier: 'amateur' | 'intermedio' | 'avanzado' | 'competicion' | 'master';
  label: string;
  badge: string;
  color: string;
  minElo: number;
  maxElo: number;
}

export function getEloTier(elo: number = DEFAULT_INITIAL_ELO): EloTierInfo {
  if (elo >= 1850) {
    return { tier: 'master', label: 'Master / Élite', badge: '👑 Master', color: '#ffb300', minElo: 1850, maxElo: 3000 };
  }
  if (elo >= 1600) {
    return { tier: 'competicion', label: 'Competición', badge: '💎 Competición', color: '#00e5ff', minElo: 1600, maxElo: 1849 };
  }
  if (elo >= 1350) {
    return { tier: 'avanzado', label: 'Avanzado', badge: '🥇 Avanzado', color: '#00e676', minElo: 1350, maxElo: 1599 };
  }
  if (elo >= 1150) {
    return { tier: 'intermedio', label: 'Intermedio', badge: '🥈 Intermedio', color: '#90caf9', minElo: 1150, maxElo: 1349 };
  }
  return { tier: 'amateur', label: 'Iniciación / Bronce', badge: '🥉 Amateur', color: '#ffab91', minElo: 600, maxElo: 1149 };
}
