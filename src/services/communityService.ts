import type { CommunityPlayer, MatchRecord, HeadToHeadStats, SetScore } from '../types/padel';

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
      favoritePosition: playerData.favoritePosition || 'ambas'
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

    if (existing) return existing;

    return this.addPlayer({ name, email, phone });
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
    status: 'completed' | 'unfinished' | 'retired' = 'completed'
  ): MatchRecord {
    const team1SetsWon = sets.filter(s => s.team1 > s.team2).length;
    const team2SetsWon = sets.filter(s => s.team2 > s.team1).length;

    const record: MatchRecord = {
      id: 'match-' + Date.now().toString(36),
      date: Date.now(),
      courtName,
      team1: { name: team1Name, playerNames: team1PlayerNames, scoreSets: team1SetsWon },
      team2: { name: team2Name, playerNames: team2PlayerNames, scoreSets: team2SetsWon },
      sets,
      winner,
      eloDelta: winner === 'none' ? 0 : eloDelta,
      status
    };

    this.matches.unshift(record);
    this.saveMatches();

    // Ensure all 4 players exist in the roster
    [...team1PlayerNames, ...team2PlayerNames].forEach(pName => {
      this.findOrCreatePlayer(pName);
    });

    if (winner !== 'none') {
      const winningNames = winner === 'team1' ? team1PlayerNames : team2PlayerNames;
      const losingNames = winner === 'team1' ? team2PlayerNames : team1PlayerNames;

      this.players = this.players.map(p => {
        if (winningNames.includes(p.name)) {
          return {
            ...p,
            matchesPlayed: p.matchesPlayed + 1,
            matchesWon: p.matchesWon + 1,
            winStreak: p.winStreak + 1,
            elo: p.elo + Math.abs(eloDelta)
          };
        }
        if (losingNames.includes(p.name)) {
          return {
            ...p,
            matchesPlayed: p.matchesPlayed + 1,
            winStreak: 0,
            elo: Math.max(600, p.elo - Math.abs(eloDelta))
          };
        }
        return p;
      });
    } else {
      // Unfinished match without declared winner: register match played, preserve streaks and ELO
      this.players = this.players.map(p => {
        if ([...team1PlayerNames, ...team2PlayerNames].includes(p.name)) {
          return {
            ...p,
            matchesPlayed: p.matchesPlayed + 1
          };
        }
        return p;
      });
    }

    this.savePlayers();
    return record;
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
