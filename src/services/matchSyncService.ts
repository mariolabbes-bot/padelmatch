import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import type { MatchRules, MatchScoreState, Team, CommunityPlayer } from '../types/padel';

export interface SyncedMatchRoom {
  id: string;
  hostId: string;
  hostName: string;
  courtName: string;
  rules: MatchRules;
  status: 'lobby' | 'court_enrollment' | 'scoreboard' | 'completed';
  slots: {
    slot1: CommunityPlayer;
    slot2: CommunityPlayer | null;
    slot3: CommunityPlayer | null;
    slot4: CommunityPlayer | null;
  };
  teams: { team1: Team; team2: Team };
  scoreState: MatchScoreState;
  createdAt: number;
  updatedAt: number;
}

class MatchSyncService {
  /**
   * Initializes or updates a match room in Firestore
   */
  public async createOrUpdateMatchRoom(room: SyncedMatchRoom): Promise<void> {
    try {
      const matchRef = doc(db, 'matches', room.id);
      await setDoc(matchRef, {
        ...room,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.warn('MatchSyncService: Failed to sync match to Firestore', error);
    }
  }

  /**
   * Fetches the current state of a match room once
   */
  public async getMatchRoom(matchId: string): Promise<SyncedMatchRoom | null> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const snapshot = await getDoc(matchRef);
      if (snapshot.exists()) {
        return snapshot.data() as SyncedMatchRoom;
      }
      return null;
    } catch (error) {
      console.warn('MatchSyncService: Failed to get match room', error);
      return null;
    }
  }

  /**
   * Subscribes to real-time changes on a match room
   */
  public subscribeMatchRoom(
    matchId: string,
    callback: (room: SyncedMatchRoom | null) => void
  ): () => void {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const unsubscribe = onSnapshot(matchRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as SyncedMatchRoom);
        } else {
          callback(null);
        }
      }, (error) => {
        console.warn('MatchSyncService: Subscription error', error);
      });

      return unsubscribe;
    } catch (e) {
      console.warn('MatchSyncService: Error subscribing to Firestore', e);
      return () => {};
    }
  }

  /**
   * Assigns a player to an open slot (Slot 2, 3, or 4)
   */
  public async joinSlot(
    matchId: string,
    slotKey: 'slot2' | 'slot3' | 'slot4',
    player: CommunityPlayer
  ): Promise<boolean> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        [`slots.${slotKey}`]: player,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('MatchSyncService: Failed to join slot', error);
      return false;
    }
  }

  /**
   * Removes a player from a slot
   */
  public async leaveSlot(
    matchId: string,
    slotKey: 'slot2' | 'slot3' | 'slot4'
  ): Promise<boolean> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        [`slots.${slotKey}`]: null,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('MatchSyncService: Failed to leave slot', error);
      return false;
    }
  }

  /**
   * Updates live match score in Firestore
   */
  public async updateMatchScore(
    matchId: string,
    scoreState: MatchScoreState
  ): Promise<void> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        scoreState,
        updatedAt: Date.now()
      });
    } catch (error) {
      // ignore offline/silent error
    }
  }

  /**
   * Updates match phase status (e.g. court_enrollment or scoreboard)
   */
  public async updateMatchStatus(
    matchId: string,
    status: SyncedMatchRoom['status'],
    teams?: { team1: Team; team2: Team }
  ): Promise<void> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const payload: Record<string, any> = {
        status,
        updatedAt: Date.now()
      };
      if (teams) {
        payload.teams = teams;
      }
      await updateDoc(matchRef, payload);
    } catch (error) {
      console.warn('MatchSyncService: Failed to update status', error);
    }
  }
}

export const matchSyncService = new MatchSyncService();
