import type { CommunityPlayer, MatchRecord, HeadToHeadStats, SetScore, DominantHand, UserPlan, TimeOfDay } from '../types/padel';

const PLAYERS_STORAGE_KEY = 'padelmatch_community_players_v2';
const MATCHES_STORAGE_KEY = 'padelmatch_community_matches_v2';

class CommunityService {
  private players: CommunityPlayer[] = [];
  private matches: MatchRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear legacy v1 mock data if present
        localStorage.removeItem('padelmatch_community_players_v1');
        localStorage.removeItem('padelmatch_community_matches_v1');

        const rawPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
        this.players = rawPlayers ? JSON.parse(rawPlayers) : [];

        // Ensure Mario Labbé (Founder) is always seeded in roster
        if (!this.players.some(p => p.email?.toLowerCase() === 'mariolabbes@gmail.com')) {
          this.players.unshift({
            id: 'founder-mario-labbe',
            name: 'Mario Labbé',
            email: 'mariolabbes@gmail.com',
            phone: '+56912345678',
            elo: 1400,
            category: '4ta',
            matchesPlayed: 14,
            matchesWon: 10,
            winStreak: 3,
            favoritePosition: 'drive',
            dominantHand: 'diestro',
            city: 'Santiago',
            club: 'Club Padel Pro',
            plan: 'pro_founder',
            registeredAt: 1700000000000,
            dayMatchesPlayed: 8,
            dayMatchesWon: 6,
            nightMatchesPlayed: 6,
            nightMatchesWon: 4,
            goldenPointsPlayed: 7,
            goldenPointsWon: 5
          });
          localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(this.players));
        }

        const rawMatches = localStorage.getItem(MATCHES_STORAGE_KEY);
        this.matches = rawMatches ? JSON.parse(rawMatches) : [];
      } else {
        this.players = [];
        this.matches = [];
      }
    } catch {
      this.players = [];
      this.matches = [];
    }
  }

  public getPlayers(): CommunityPlayer[] {
    return [...this.players].sort((a, b) => b.elo - a.elo);
  }

  public getMatches(): MatchRecord[] {
    return [...this.matches].sort((a, b) => b.date - a.date);
  }

  public searchPlayer(query: string): CommunityPlayer[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.players.slice(0, 10);

    return this.players.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  }

  public addPlayer(playerData: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    elo?: number;
    category?: CommunityPlayer['category'];
    favoritePosition?: 'drive' | 'reves' | 'ambas';
    dominantHand?: DominantHand;
    city?: string;
    club?: string;
    plan?: UserPlan;
    leadSource?: 'direct_registration' | 'qr_guest';
  }): CommunityPlayer {
    const newPlayer: CommunityPlayer = {
      id: 'cp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: playerData.name.trim(),
      email: playerData.email?.trim() || undefined,
      phone: playerData.phone?.trim() || undefined,
      avatar: playerData.avatar?.trim() || undefined,
      elo: playerData.elo || 1200,
      category: playerData.category || '4ta',
      matchesPlayed: 0,
      matchesWon: 0,
      winStreak: 0,
      favoritePosition: playerData.favoritePosition || 'ambas',
      dominantHand: playerData.dominantHand || 'diestro',
      city: playerData.city?.trim() || undefined,
      club: playerData.club?.trim() || undefined,
      plan: playerData.plan || 'free',
      leadSource: playerData.leadSource || 'direct_registration',
      registeredAt: Date.now(),
      dayMatchesPlayed: 0,
      dayMatchesWon: 0,
      nightMatchesPlayed: 0,
      nightMatchesWon: 0,
      goldenPointsPlayed: 0,
      goldenPointsWon: 0,
      tieBreaksPlayed: 0,
      tieBreaksWon: 0
    };

    this.players.push(newPlayer);
    this.savePlayers();
    return newPlayer;
  }

  public findOrCreatePlayer(name: string, email?: string, phone?: string): CommunityPlayer {
    const existing = this.players.find(p => 
      (email && p.email?.toLowerCase() === email.toLowerCase()) ||
      (phone && p.phone === phone) ||
      p.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      if (phone && !existing.phone) {
        existing.phone = phone;
        this.savePlayers();
      }
      return existing;
    }

    return this.addPlayer({ name, email, phone, leadSource: 'qr_guest' });
  }

  public deletePlayer(id: string) {
    this.players = this.players.filter(p => p.id !== id);
    this.savePlayers();
  }

  public clearAllData() {
    this.players = [];
    this.matches = [];
    try {
      localStorage.removeItem(PLAYERS_STORAGE_KEY);
      localStorage.removeItem(MATCHES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  public saveMatchResult(
    courtName: string,
    team1Name: string,
    team1PlayerNames: [string, string],
    team2Name: string,
    team2PlayerNames: [string, string],
    sets: SetScore[],
    winner: 'team1' | 'team2' | 'none',
    eloDelta: number,
    status: 'completed' | 'unfinished' | 'retired' = 'completed',
    extra?: {
      goldenPointsCount?: number;
      tieBreaksCount?: number;
      durationSeconds?: number;
    }
  ): MatchRecord {
    const team1SetsWon = sets.filter(s => s.team1 > s.team2).length;
    const team2SetsWon = sets.filter(s => s.team2 > s.team1).length;

    // Detect if match was played with Natural Light (08:00 - 18:30) or Artificial Light (18:30+)
    const currentHour = new Date().getHours();
    const timeOfDay: TimeOfDay = (currentHour >= 8 && currentHour < 19) ? 'day' : 'night';

    const record: MatchRecord = {
      id: 'match-' + Date.now().toString(36),
      date: Date.now(),
      courtName,
      team1: { name: team1Name, playerNames: team1PlayerNames, scoreSets: team1SetsWon },
      team2: { name: team2Name, playerNames: team2PlayerNames, scoreSets: team2SetsWon },
      sets,
      winner,
      eloDelta: winner === 'none' ? 0 : eloDelta,
      status,
      timeOfDay,
      goldenPointsCount: extra?.goldenPointsCount || 0,
      tieBreaksCount: extra?.tieBreaksCount || 0,
      durationSeconds: extra?.durationSeconds || 75 * 60
    };

    this.matches.unshift(record);
    this.saveMatches();

    // Ensure all 4 players exist in the roster
    [...team1PlayerNames, ...team2PlayerNames].forEach(pName => {
      this.findOrCreatePlayer(pName);
    });

    const isDay = timeOfDay === 'day';
    const isNight = timeOfDay === 'night';
    const gpCount = extra?.goldenPointsCount || 0;
    const tbCount = extra?.tieBreaksCount || 0;

    if (winner !== 'none') {
      const winningNames = winner === 'team1' ? team1PlayerNames : team2PlayerNames;
      const losingNames = winner === 'team1' ? team2PlayerNames : team1PlayerNames;

      this.players = this.players.map(p => {
        if (winningNames.includes(p.name)) {
          const updated: CommunityPlayer = {
            ...p,
            matchesPlayed: p.matchesPlayed + 1,
            matchesWon: p.matchesWon + 1,
            winStreak: p.winStreak + 1,
            elo: p.elo + Math.abs(eloDelta),
            dayMatchesPlayed: (p.dayMatchesPlayed || 0) + (isDay ? 1 : 0),
            dayMatchesWon: (p.dayMatchesWon || 0) + (isDay ? 1 : 0),
            nightMatchesPlayed: (p.nightMatchesPlayed || 0) + (isNight ? 1 : 0),
            nightMatchesWon: (p.nightMatchesWon || 0) + (isNight ? 1 : 0),
            goldenPointsPlayed: (p.goldenPointsPlayed || 0) + gpCount,
            goldenPointsWon: (p.goldenPointsWon || 0) + Math.ceil(gpCount * 0.6), // Estimación proporcional
            tieBreaksPlayed: (p.tieBreaksPlayed || 0) + tbCount,
            tieBreaksWon: (p.tieBreaksWon || 0) + (tbCount > 0 ? 1 : 0)
          };
          return updated;
        }
        if (losingNames.includes(p.name)) {
          const updated: CommunityPlayer = {
            ...p,
            matchesPlayed: p.matchesPlayed + 1,
            winStreak: 0,
            elo: Math.max(600, p.elo - Math.abs(eloDelta)),
            dayMatchesPlayed: (p.dayMatchesPlayed || 0) + (isDay ? 1 : 0),
            dayMatchesWon: p.dayMatchesWon || 0,
            nightMatchesPlayed: (p.nightMatchesPlayed || 0) + (isNight ? 1 : 0),
            nightMatchesWon: p.nightMatchesWon || 0,
            goldenPointsPlayed: (p.goldenPointsPlayed || 0) + gpCount,
            goldenPointsWon: (p.goldenPointsWon || 0) + Math.floor(gpCount * 0.4),
            tieBreaksPlayed: (p.tieBreaksPlayed || 0) + tbCount,
            tieBreaksWon: p.tieBreaksWon || 0
          };
          return updated;
        }
        return p;
      });
    } else {
      // Unfinished match without declared winner
      this.players = this.players.map(p => {
        if ([...team1PlayerNames, ...team2PlayerNames].includes(p.name)) {
          return {
            ...p,
            matchesPlayed: p.matchesPlayed + 1,
            dayMatchesPlayed: (p.dayMatchesPlayed || 0) + (isDay ? 1 : 0),
            nightMatchesPlayed: (p.nightMatchesPlayed || 0) + (isNight ? 1 : 0)
          };
        }
        return p;
      });
    }

    // Recalculate Pair Chemistry (Best Partner & Nemesis)
    [...team1PlayerNames, ...team2PlayerNames].forEach(pName => {
      this.recalculateSynergyAndNemesis(pName);
    });

    this.savePlayers();
    return record;
  }

  private recalculateSynergyAndNemesis(playerName: string) {
    const player = this.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) return;

    const partnerStats: Record<string, { matches: number; wins: number }> = {};
    const rivalStats: Record<string, { matches: number; losses: number }> = {};

    this.matches.forEach(m => {
      const isTeam1 = m.team1.playerNames.includes(player.name);
      const isTeam2 = m.team2.playerNames.includes(player.name);
      if (!isTeam1 && !isTeam2) return;

      const myTeam = isTeam1 ? m.team1 : m.team2;
      const rivalTeam = isTeam1 ? m.team2 : m.team1;
      const won = (m.winner === 'team1' && isTeam1) || (m.winner === 'team2' && isTeam2);

      // Partner
      const partner = myTeam.playerNames.find(p => p !== player.name);
      if (partner) {
        if (!partnerStats[partner]) partnerStats[partner] = { matches: 0, wins: 0 };
        partnerStats[partner].matches++;
        if (won) partnerStats[partner].wins++;
      }

      // Rivals
      rivalTeam.playerNames.forEach(rival => {
        if (!rivalStats[rival]) rivalStats[rival] = { matches: 0, losses: 0 };
        rivalStats[rival].matches++;
        if (!won && m.winner !== 'none') rivalStats[rival].losses++;
      });
    });

    // Best Partner: partner with highest win rate (min 1 match)
    let bestPartner: { name: string; winRate: number; matchesTogether: number } | undefined;
    let maxPartnerScore = -1;
    Object.entries(partnerStats).forEach(([name, s]) => {
      const rate = Math.round((s.wins / s.matches) * 100);
      if (s.matches >= 1 && (rate > maxPartnerScore || (rate === maxPartnerScore && s.matches > (bestPartner?.matchesTogether || 0)))) {
        maxPartnerScore = rate;
        bestPartner = { name, winRate: rate, matchesTogether: s.matches };
      }
    });

    // Nemesis: rival against whom player has most losses / highest loss rate
    let nemesis: { name: string; lossRate: number; matchesAgainst: number } | undefined;
    let maxNemesisLosses = 0;
    Object.entries(rivalStats).forEach(([name, s]) => {
      if (s.losses > maxNemesisLosses) {
        maxNemesisLosses = s.losses;
        nemesis = { name, lossRate: Math.round((s.losses / s.matches) * 100), matchesAgainst: s.matches };
      }
    });

    player.bestPartner = bestPartner;
    player.nemesis = nemesis;
  }

  public getHeadToHead(playerNames1: string[], playerNames2: string[]): HeadToHeadStats {
    const directMatches = this.matches.filter(m => {
      const hasT1 = m.team1.playerNames.some(p => playerNames1.includes(p)) ||
                    m.team2.playerNames.some(p => playerNames1.includes(p));
      const hasT2 = m.team1.playerNames.some(p => playerNames2.includes(p)) ||
                    m.team2.playerNames.some(p => playerNames2.includes(p));
      return hasT1 && hasT2;
    });

    let t1Wins = 0;
    let t2Wins = 0;

    const recentResults = directMatches.map(m => {
      const isT1Team1 = m.team1.playerNames.some(p => playerNames1.includes(p));
      const winnerIsOurTeam1 = (m.winner === 'team1' && isT1Team1) || (m.winner === 'team2' && !isT1Team1);

      if (winnerIsOurTeam1) {
        t1Wins++;
      } else {
        t2Wins++;
      }

      const scoreStr = m.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
      return {
        date: m.date,
        winner: winnerIsOurTeam1 ? ('team1' as const) : ('team2' as const),
        score: scoreStr
      };
    });

    return {
      matchesPlayed: directMatches.length,
      team1Wins: t1Wins,
      team2Wins: t2Wins,
      lastMatchDate: directMatches[0]?.date,
      recentResults: recentResults.slice(0, 5)
    };
  }

  private savePlayers() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(this.players));
    } catch (e) {
      console.error('Error saving players:', e);
    }
  }

  private saveMatches() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(this.matches));
    } catch (e) {
      console.error('Error saving matches:', e);
    }
  }
}

export const communityService = new CommunityService();
