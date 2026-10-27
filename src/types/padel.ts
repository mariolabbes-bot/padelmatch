export type MatchFormat = 'best_of_3' | 'best_of_5' | 'single_set';
export type GameRule = 'golden_point' | 'advantage'; // Punto de Oro vs Ventaja tradicional
export type TieBreakRule = 'standard' | 'long_set'; // A 7 puntos vs diferencia de 2 games
export type ThirdSetRule = 'full_set' | 'super_tiebreak'; // Set completo vs Super Tie-break
export type SuperTieBreakTarget = 10 | 12 | 13;

export type PlayerCategory = '1ra' | '2da' | '3ra' | '4ta' | '5ta' | '6ta' | '7ma' | 'Iniciación';

export type DominantHand = 'diestro' | 'zurdo';
export type UserPlan = 'free' | 'pro_founder' | 'captain' | 'club' | 'subscribed';
export type SubscriptionTier = 'season_6m' | 'annual_12m' | 'monthly' | 'pro_founder';

export interface SubscriptionPlanDetail {
  id: SubscriptionTier;
  title: string;
  tagline: string;
  priceClp: number;
  periodLabel: string;
  monthlyEquivalentClp: number;
  isPopular?: boolean;
  badge?: string;
  features: string[];
}
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
  subscriptionExpiresAt?: number;
  hostedMatchesCount?: number;
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
  
  // Disponibilidad y Preferencias de Juego
  availableDays?: string[]; // Ej: ['Lunes', 'Miércoles', 'Sábado']
  availableTimeSlots?: string[]; // Ej: ['Mañana (08:00 - 12:00)', 'Tarde (18:00 - 21:00)']
  preferredClubs?: string[]; // Ej: ['Club Padel Oriente', 'Padel Center']

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
  | 'groups'
  | 'lobby_qr' 
  | 'court_enrollment' 
  | 'scoreboard' 
  | 'community' 
  | 'court_tv' 
  | 'participant_join'
  | 'user_profile'
  | 'admin';

export interface AppNotification {
  id: string;
  type: 'open_match' | 'friend_invite' | 'club_offer' | 'match_result';
  title: string;
  body: string;
  timestamp: number;
  clubName?: string;
  category?: PlayerCategory;
  courtName?: string;
  matchId?: string;
  discountPercentage?: number;
  read: boolean;
  actionUrl?: string;
}

// ==========================================
// MÓDULO GRUPOS Y CONVOCATORIAS (MÚLTIPLOS DE 4)
// ==========================================

export interface GroupMember {
  playerId: string;
  name: string;
  category: PlayerCategory;
  elo: number;
  role: 'admin' | 'member';
  joinedAt: number;
  avatar?: string;
  matchesPlayedInGroup: number;
}

export interface GroupCallout {
  id: string;
  groupId: string;
  creatorId: string;
  creatorName: string;
  clubName: string;
  courtName?: string;
  matchDate: string; // YYYY-MM-DD
  matchTime: string; // HH:mm
  deadlineTime: string; // Límite de confirmación
  categoryTarget: PlayerCategory | 'abierta';
  acceptedPlayerIds: string[];
  rejectedPlayerIds: string[];
  status: 'open' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: number;
}

export interface PadelGroup {
  id: string;
  name: string;
  description: string;
  city: string;
  clubPreferred: string;
  categoryLevel: PlayerCategory | 'abierta';
  members: GroupMember[];
  callouts: GroupCallout[];
  createdAt: number;
  avatar?: string;
  bannerColor?: string;
  isPrivate?: boolean;
}

// ==========================================
// MÓDULO PRIVACIDAD Y GOBERNANZA DE DATOS
// ==========================================

export type PrivacyScope = 'public' | 'partners' | 'private';

export interface UserPrivacySettings {
  phoneVisibility: PrivacyScope;        // Quién puede ver mi WhatsApp / teléfono
  historyVisibility: PrivacyScope;      // Quién puede ver mis tanteadores e historial de partidos
  eloVisibility: PrivacyScope;          // Quién puede ver mi gráfica de evolución de ELO
  presenceVisibility: 'partners' | 'private'; // Quién puede ver si estoy jugando ahora
  invitesAllowed: 'all' | 'partners' | 'none'; // Quién puede invitarme a partidos
  updatedAt?: number;
}

export const DEFAULT_USER_PRIVACY: UserPrivacySettings = {
  phoneVisibility: 'partners',
  historyVisibility: 'partners',
  eloVisibility: 'public',
  presenceVisibility: 'partners',
  invitesAllowed: 'all'
};

// ==========================================
// MÓDULO MENSAJERÍA DIRECTA ENTRE PARTNERS (CHAT 1-TO-1)
// ==========================================

export interface DirectChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  text: string;
  timestamp: number;
  read: boolean;
  matchInviteId?: string; // ID de partido para invitar directamente en 1 tap
}

export interface DirectChatConversation {
  chatId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerCategory?: PlayerCategory;
  lastMessage?: DirectChatMessage;
  unreadCount: number;
  updatedAt: number;
}

// ==========================================
// MÓDULO PARTNERS (RED DE AMIGOS DE PÁDEL)
// ==========================================

export type PartnerStatus = 'pending' | 'accepted' | 'rejected';

export interface PartnerConnection {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterCategory: PlayerCategory;
  requesterElo: number;
  targetId: string;
  targetName: string;
  status: PartnerStatus;
  createdAt: number;
}

export interface PartnerComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export type PostReactionType = 'clap' | 'fire' | 'trophy' | 'muscle';

export interface PostReactionRecord {
  userId: string;
  userName: string;
  type: PostReactionType;
  timestamp: number;
}

export interface PartnerPost {
  id: string;
  authorId: string;
  authorName: string;
  authorCategory: PlayerCategory;
  authorAvatar?: string;
  authorClub?: string;
  timestamp: number;
  content: string;
  type?: 'user_update' | 'match_result' | 'club_announcement' | 'tournament_promo' | 'brand_deal';
  matchSnippet?: {
    courtName: string;
    scoreSets: string;
    isVictory: boolean;
    rivalsNames?: string;
  };
  b2bMeta?: {
    sponsorName: string;
    sponsorLogo?: string;
    actionLabel?: string;
    actionUrl?: string;
    discountCode?: string;
    badgeText?: string;
  };
  clapsCount: number;
  hasClapped?: boolean;
  reactions?: PostReactionRecord[];
  userReaction?: PostReactionType;
  comments: PartnerComment[];
}

// ==========================================
// MÓDULO CLUBES, CAMPAÑAS Y NOTICIAS
// ==========================================

export interface ClubCampaign {
  id: string;
  clubName: string;
  clubCity: string;
  title: string;
  description: string;
  discountLabel?: string;
  validUntil?: string;
  tag: 'oferta' | 'torneo' | 'evento' | 'clinica';
  contactPhone?: string;
  imageUrl?: string;
}

export interface PadelNewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'circuito' | 'tactica' | 'equipamiento' | 'comunidad';
  timestamp: number;
  readTimeMinutes: number;
  source: string;
}

export interface PadelClub {
  id: string;
  name: string;
  city: 'La Serena' | 'Coquimbo' | string;
  commune?: string;
  address?: string;
  courtsCount?: number;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'mixto';
  phone?: string;
  instagram?: string;
  website?: string;
  services?: string[];
  verified?: boolean;
  createdAt?: number;
}

// ==========================================
// MÓDULO PARTIDOS PROGRAMADOS Y CONVOCATORIAS
// ==========================================

export type ScheduledMatchStatus = 'open' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface ScheduledPlayerSlot {
  id: string;
  slotIndex: number; // 0 (Anfitrión), 1, 2, 3
  playerId?: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  category?: PlayerCategory;
  isHost: boolean;
  status: 'confirmed' | 'pending' | 'declined';
  invitedVia: 'app_partner' | 'whatsapp' | 'manual';
  confirmedAt?: number;
}

export interface ScheduledMatch {
  id: string; // e.g. "SCH-ABC12"
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatar?: string;
  clubName: string;
  courtName?: string;
  matchDate: string; // YYYY-MM-DD
  matchTime: string; // HH:mm
  slots: ScheduledPlayerSlot[]; // 4 slots
  invitedPlayerIds: string[];
  status: ScheduledMatchStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  matchSyncRoomId?: string;
}
