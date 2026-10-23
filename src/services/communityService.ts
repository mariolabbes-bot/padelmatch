import type { CommunityPlayer, MatchRecord, HeadToHeadStats, SetScore, DominantHand, UserPlan, TimeOfDay } from '../types/padel';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

const PLAYERS_STORAGE_KEY = 'padelmatch_community_players_v3';
const MATCHES_STORAGE_KEY = 'padelmatch_community_matches_v3';

class CommunityService {
  private players: CommunityPlayer[] = [];
  private matches: MatchRecord[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear legacy mock versions
        localStorage.removeItem('padelmatch_community_players_v1');
        localStorage.removeItem('padelmatch_community_matches_v1');
        localStorage.removeItem('padelmatch_community_players_v2');
        localStorage.removeItem('padelmatch_community_matches_v2');

        const rawPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
        if (rawPlayers) {
          const parsed: CommunityPlayer[] = JSON.parse(rawPlayers);
          // Filter out legacy mock players
          this.players = parsed.filter(p => !p.id.startsWith('player-'));
        }

        // Pristine Mario Labbé (Founder)
        if (!this.players.some(p => p.email?.toLowerCase() === 'mariolabbes@gmail.com')) {
          this.players.unshift({
            id: 'founder-mario-labbe',
            name: 'Mario Labbé',
            email: 'mariolabbes@gmail.com',
            phone: '+56912345678',
            elo: 1400,
            category: '4ta',
            matchesPlayed: 0,
            matchesWon: 0,
            winStreak: 0,
            favoritePosition: 'drive',
            dominantHand: 'diestro',
            city: 'Santiago',
            club: undefined,
            plan: 'pro_founder',
            registeredAt: Date.now(),
            dayMatchesPlayed: 0,
            dayMatchesWon: 0,
            nightMatchesPlayed: 0,
            nightMatchesWon: 0,
            goldenPointsPlayed: 0,
            goldenPointsWon: 0,
            tieBreaksPlayed: 0,
            tieBreaksWon: 0
          });
          this.savePlayers();
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

  private initFirestoreSync() {
    try {
      // 1. Sync Players from Cloud Firestore
      onSnapshot(collection(db, 'players'), (snapshot) => {
        const cloudPlayers: CommunityPlayer[] = [];
        snapshot.forEach(docSnap => {
          cloudPlayers.push(docSnap.data() as CommunityPlayer);
        });

        if (cloudPlayers.length > 0) {
          this.players = cloudPlayers;
          this.savePlayers();
          this.notify();
        } else {
          // If Firestore is empty, seed clean Mario Labbé
          const mario = this.players.find(p => p.email?.toLowerCase() === 'mariolabbes@gmail.com');
          if (mario) {
            setDoc(doc(db, 'players', mario.id), cleanForFirestore(mario)).catch(console.warn);
          }
        }
      }, (err) => {
        console.warn('Firestore players sync notice:', err);
      });

      // 2. Sync Completed Matches from Cloud Firestore
      onSnapshot(collection(db, 'completed_matches'), (snapshot) => {
        const cloudMatches: MatchRecord[] = [];
        snapshot.forEach(docSnap => {
          cloudMatches.push(docSnap.data() as MatchRecord);
        });
        this.matches = cloudMatches;
        this.saveMatches();
        this.notify();
      }, (err) => {
        console.warn('Firestore matches sync notice:', err);
      });
    } catch (e) {
      console.warn('Firestore sync init error:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
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
    id?: string;
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
    matchesPlayed?: number;
    matchesWon?: number;
    winStreak?: number;
    dayMatchesPlayed?: number;
    dayMatchesWon?: number;
    nightMatchesPlayed?: number;
    nightMatchesWon?: number;
    goldenPointsPlayed?: number;
    goldenPointsWon?: number;
    tieBreaksPlayed?: number;
    tieBreaksWon?: number;
  }): CommunityPlayer {
    const newPlayer: CommunityPlayer = {
      id: playerData.id || ('cp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6)),
      name: playerData.name.trim(),
      email: playerData.email?.trim() || undefined,
      phone: playerData.phone?.trim() || undefined,
      avatar: playerData.avatar?.trim() || undefined,
      elo: playerData.elo || 1200,
      category: playerData.category || '4ta',
      matchesPlayed: playerData.matchesPlayed || 0,
      matchesWon: playerData.matchesWon || 0,
      winStreak: playerData.winStreak || 0,
      favoritePosition: playerData.favoritePosition || 'ambas',
      dominantHand: playerData.dominantHand || 'diestro',
      city: playerData.city?.trim() || undefined,
      club: playerData.club?.trim() || undefined,
      plan: playerData.plan || 'free',
      leadSource: playerData.leadSource || 'direct_registration',
      registeredAt: Date.now(),
      dayMatchesPlayed: playerData.dayMatchesPlayed || 0,
      dayMatchesWon: playerData.dayMatchesWon || 0,
      nightMatchesPlayed: playerData.nightMatchesPlayed || 0,
      nightMatchesWon: playerData.nightMatchesWon || 0,
      goldenPointsPlayed: playerData.goldenPointsPlayed || 0,
      goldenPointsWon: playerData.goldenPointsWon || 0,
      tieBreaksPlayed: playerData.tieBreaksPlayed || 0,
      tieBreaksWon: playerData.tieBreaksWon || 0
    };

    this.players.push(newPlayer);
    this.savePlayers();

    // Push to Cloud Firestore
    setDoc(doc(db, 'players', newPlayer.id), cleanForFirestore(newPlayer), { merge: true }).catch(err => {
      console.warn('Failed to sync player to Firestore:', err);
    });

    this.notify();
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
        setDoc(doc(db, 'players', existing.id), cleanForFirestore(existing), { merge: true }).catch(console.warn);
      }
      return existing;
    }

    return this.addPlayer({ name, email, phone, leadSource: 'qr_guest' });
  }

  public deletePlayer(id: string) {
    this.players = this.players.filter(p => p.id !== id);
    this.savePlayers();
    deleteDoc(doc(db, 'players', id)).catch(console.warn);
    this.notify();
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
    this.notify();
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
            goldenPointsWon: (p.goldenPointsWon || 0) + Math.ceil(gpCount * 0.6),
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

    // Sync match and players to Cloud Firestore
    setDoc(doc(db, 'completed_matches', record.id), cleanForFirestore(record)).catch(err => {
      console.warn('Failed to sync completed match to Firestore:', err);
    });

    this.players.forEach(p => {
      if ([...team1PlayerNames, ...team2PlayerNames].includes(p.name)) {
        setDoc(doc(db, 'players', p.id), cleanForFirestore(p), { merge: true }).catch(console.warn);
      }
    });

    this.notify();
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

      const partner = myTeam.playerNames.find(p => p !== player.name);
      if (partner) {
        if (!partnerStats[partner]) partnerStats[partner] = { matches: 0, wins: 0 };
        partnerStats[partner].matches++;
        if (won) partnerStats[partner].wins++;
      }

      rivalTeam.playerNames.forEach(rival => {
        if (!rivalStats[rival]) rivalStats[rival] = { matches: 0, losses: 0 };
        rivalStats[rival].matches++;
        if (!won && m.winner !== 'none') rivalStats[rival].losses++;
      });
    });

    let bestPartner: { name: string; winRate: number; matchesTogether: number } | undefined;
    let maxPartnerScore = -1;
    Object.entries(partnerStats).forEach(([name, s]) => {
      const rate = Math.round((s.wins / s.matches) * 100);
      if (s.matches >= 1 && (rate > maxPartnerScore || (rate === maxPartnerScore && s.matches > (bestPartner?.matchesTogether || 0)))) {
        maxPartnerScore = rate;
        bestPartner = { name, winRate: rate, matchesTogether: s.matches };
      }
    });

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

  public updatePlayer(updatedPlayer: CommunityPlayer) {
    const idx = this.players.findIndex(p => p.id === updatedPlayer.id);
    if (idx !== -1) {
      this.players[idx] = updatedPlayer;
    } else {
      this.players.push(updatedPlayer);
    }
    this.savePlayers();
    setDoc(doc(db, 'players', updatedPlayer.id), cleanForFirestore(updatedPlayer), { merge: true }).catch(console.warn);
    this.notify();
  }

  public getUserDuoInsights(playerName: string): {
    bestPartner: { name: string; winRate: number; matchesTogether: number; matchesWon: number } | null;
    nemesis: { name: string; lossRate: number; matchesAgainst: number; matchesLost: number } | null;
    nemesisDuo: { rivalNames: string; lossRate: number; matchesAgainst: number; matchesLost: number } | null;
  } {
    const norm = playerName.trim().toLowerCase();
    const partnerStats: Record<string, { matches: number; wins: number }> = {};
    const rivalPlayerStats: Record<string, { matches: number; losses: number }> = {};
    const rivalDuoStats: Record<string, { matches: number; losses: number }> = {};

    this.matches.forEach(m => {
      const isTeam1 = m.team1.playerNames.some(p => p.toLowerCase() === norm);
      const isTeam2 = m.team2.playerNames.some(p => p.toLowerCase() === norm);
      if (!isTeam1 && !isTeam2) return;

      const myTeam = isTeam1 ? m.team1 : m.team2;
      const rivalTeam = isTeam1 ? m.team2 : m.team1;
      const won = (m.winner === 'team1' && isTeam1) || (m.winner === 'team2' && isTeam2);

      // Partner Stats
      const partner = myTeam.playerNames.find(p => p.toLowerCase() !== norm);
      if (partner) {
        if (!partnerStats[partner]) partnerStats[partner] = { matches: 0, wins: 0 };
        partnerStats[partner].matches++;
        if (won) partnerStats[partner].wins++;
      }

      // Individual Rival Stats
      rivalTeam.playerNames.forEach(rival => {
        if (!rivalPlayerStats[rival]) rivalPlayerStats[rival] = { matches: 0, losses: 0 };
        rivalPlayerStats[rival].matches++;
        if (!won && m.winner !== 'none') rivalPlayerStats[rival].losses++;
      });

      // Duo Rival Stats
      const duoKey = [...rivalTeam.playerNames].sort().join(' & ');
      if (!rivalDuoStats[duoKey]) rivalDuoStats[duoKey] = { matches: 0, losses: 0 };
      rivalDuoStats[duoKey].matches++;
      if (!won && m.winner !== 'none') rivalDuoStats[duoKey].losses++;
    });

    // Best Partner (highest win rate, prioritized by matches won)
    let bestPartner: { name: string; winRate: number; matchesTogether: number; matchesWon: number } | null = null;
    let maxWins = -1;
    let maxRate = -1;
    Object.entries(partnerStats).forEach(([name, s]) => {
      const rate = Math.round((s.wins / s.matches) * 100);
      if (s.wins > maxWins || (s.wins === maxWins && rate > maxRate)) {
        maxWins = s.wins;
        maxRate = rate;
        bestPartner = { name, winRate: rate, matchesTogether: s.matches, matchesWon: s.wins };
      }
    });

    // Nemesis Individual
    let nemesis: { name: string; lossRate: number; matchesAgainst: number; matchesLost: number } | null = null;
    let maxLosses = 0;
    Object.entries(rivalPlayerStats).forEach(([name, s]) => {
      if (s.losses > maxLosses) {
        maxLosses = s.losses;
        nemesis = { name, lossRate: Math.round((s.losses / s.matches) * 100), matchesAgainst: s.matches, matchesLost: s.losses };
      }
    });

    // Nemesis Duo
    let nemesisDuo: { rivalNames: string; lossRate: number; matchesAgainst: number; matchesLost: number } | null = null;
    let maxDuoLosses = 0;
    Object.entries(rivalDuoStats).forEach(([duo, s]) => {
      if (s.losses > maxDuoLosses) {
        maxDuoLosses = s.losses;
        nemesisDuo = { rivalNames: duo, lossRate: Math.round((s.losses / s.matches) * 100), matchesAgainst: s.matches, matchesLost: s.losses };
      }
    });

    return {
      bestPartner,
      nemesis,
      nemesisDuo
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

  public adminDeleteMatch(matchId: string): boolean {
    const idx = this.matches.findIndex(m => m.id === matchId);
    if (idx < 0) return false;

    this.matches.splice(idx, 1);
    this.saveMatches();

    try {
      deleteDoc(doc(db, 'completed_matches', matchId)).catch(console.warn);
      deleteDoc(doc(db, 'matches', matchId)).catch(console.warn);
    } catch (e) {
      console.warn('Could not delete match in Firestore:', e);
    }

    this.notify();
    return true;
  }
}

export const communityService = new CommunityService();
