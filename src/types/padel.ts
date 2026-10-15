export type MatchFormat = 'best_of_3' | 'best_of_5' | 'single_set';
export type GameRule = 'golden_point' | 'advantage'; // Punto de Oro vs Ventaja tradicional
export type TieBreakRule = 'standard' | 'long_set'; // A 7 puntos vs diferencia de 2 games
export type ThirdSetRule = 'full_set' | 'super_tiebreak'; // Set completo vs Super Tie-break
export type SuperTieBreakTarget = 10 | 12 | 13;

export type PlayerCategory = '1ra' | '2da' | '3ra' | '4ta' | '5ta' | '6ta' | '7ma' | 'Iniciación';

export type DominantHand = 'diestro' | 'zurdo';
export type UserPlan = 'free' | 'pro_founder' | 'captain' | 'club';
export type TimeOfDay = 'day' | 'night'; // ☀️ Luz Natural vs 🌙 Luz Artificial

export interface Player {
  id: string;
  name: string;
  position: 'drive' | 'reves';
  avatar?: string;
  elo?: number;
  category?: PlayerCategory;
  phone?: string;
  email?: string;
  dominantHand?: DominantHand;
  city?: string;
  club?: string;
}

export interface CommunityPlayer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  elo: number;
  category: PlayerCategory;
  matchesPlayed: number;
  matchesWon: number;
  winStreak: number;
  favoritePosition: 'drive' | 'reves' | 'ambas';
  dominantHand?: DominantHand;
  city?: string;
  club?: string;
  plan?: UserPlan;
  leadSource?: 'direct_registration' | 'qr_guest';
  registeredAt?: number;
  
  // Analítica de Rendimiento Situacional
  dayMatchesPlayed?: number; // Partidos con Luz Natural (08:00 - 18:30)
  dayMatchesWon?: number;
  nightMatchesPlayed?: number; // Partidos con Luz Artificial (18:30 en adelante)
  nightMatchesWon?: number;
  goldenPointsPlayed?: number; // Puntos de Oro disputados
  goldenPointsWon?: number;   // Puntos de Oro ganados (Factor Clutch)
  tieBreaksPlayed?: number;
  tieBreaksWon?: number;
  
  // Algoritmo de Sinergia y Rivalidad
  bestPartner?: { name: string; winRate: number; matchesTogether: number };
  nemesis?: { name: string; lossRate: number; matchesAgainst: number };
}

export interface Team {
  id: 'team1' | 'team2';
  name: string;
  color: string;
  player1: Player; // Drive
  player2: Player; // Revés
}

export type PointScore = '0' | '15' | '30' | '40' | 'AD';

export interface SetScore {
  team1: number;
  team2: number;
  tiebreakPoints?: {
    team1: number;
    team2: number;
  };
}

export interface MatchRules {
  format: MatchFormat;
  gameRule: GameRule;
  tieBreakRule: TieBreakRule;
  thirdSetRule: ThirdSetRule;
  superTieBreakTarget: SuperTieBreakTarget;
  courtName?: string;
  sideChangeEnabled?: boolean; // Cambio de lado en juegos impares
  sideChangeRestSeconds?: number; // Tiempo de descanso en segundos (ej. 90)
}

export interface MatchScoreState {
  sets: SetScore[];
  currentSetIndex: number;
  currentGame: {
    team1: PointScore | number;
    team2: PointScore | number;
  };
  isTieBreak: boolean;
  isSuperTieBreak: boolean;
  servingTeam: 'team1' | 'team2';
  servingPlayer: 1 | 2; // Jugador 1 (Drive) o 2 (Revés)
  sideChangeNeeded: boolean;
  isMatchOver: boolean;
  winner?: 'team1' | 'team2';
  lastEventAnnouncement?: string;
  isResting?: boolean; // Temporizador de cambio de lado activo
  restSecondsRemaining?: number;
  isPaused?: boolean; // Partido en pausa manual
}

export interface MatchSnapshot {
  state: MatchScoreState;
  timestamp: number;
  description: string;
}

export interface HardwareKeyMapping {
  team1PointKeys: string[];
  team2PointKeys: string[];
  undoKeys: string[];
  repeatScoreKeys: string[];
}

export interface TTSSettings {
  enabled: boolean;
  voiceName: string;
  pitch: number;
  rate: number;
  volume: number;
  announcePlayerNames: boolean;
}

export interface MatchRecord {
  id: string;
  date: number;
  courtName: string;
  team1: { name: string; playerNames: [string, string]; scoreSets: number };
  team2: { name: string; playerNames: [string, string]; scoreSets: number };
  sets: SetScore[];
  winner: 'team1' | 'team2' | 'none';
  eloDelta: number;
  status?: 'completed' | 'unfinished' | 'retired';
  timeOfDay?: TimeOfDay;
  goldenPointsCount?: number;
  tieBreaksCount?: number;
  durationSeconds?: number;
}

export interface HeadToHeadStats {
  matchesPlayed: number;
  team1Wins: number;
  team2Wins: number;
  lastMatchDate?: number;
  recentResults: { date: number; winner: 'team1' | 'team2'; score: string }[];
}

export type AppViewMode = 
  | 'auth' 
  | 'host_dashboard' 
  | 'lobby_qr' 
  | 'court_enrollment' 
  | 'scoreboard' 
  | 'community' 
  | 'court_tv'
  | 'participant_join';
