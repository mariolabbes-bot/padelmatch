import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

export interface ReferralRecord {
  id: string; // e.g. ref_${inviterId}_${referredUserId}
  inviterId: string;
  inviterName: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail?: string;
  referredUserPhone?: string;
  source: 'whatsapp_partner' | 'whatsapp_match' | 'direct_invite';
  registeredAt: number;
  hasSubscribedPro: boolean;
  proSubscribedAt?: number;
  planType?: string;
  rewardClaimed?: boolean;
}

export interface InviterReferralStats {
  totalInvited: number;
  proSubscribedCount: number;
  referrals: ReferralRecord[];
}

const STORAGE_KEY = 'padelmatch_referrals_v1';

class ReferralService {
  private referrals: ReferralRecord[] = [];
  private listeners: Set<() => void> = new Set();
  private isListeningFirestore = false;

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          this.referrals = JSON.parse(data);
        }
      }
    } catch (e) {
      console.warn('Could not load referrals from localStorage:', e);
      this.referrals = [];
    }
  }

  private saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.referrals));
      }
    } catch (e) {
      console.warn('Could not save referrals to localStorage:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('Error in referral listener:', err); }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private initFirestoreSync() {
    if (this.isListeningFirestore) return;
    try {
      const refCol = collection(db, 'referrals');
      onSnapshot(refCol, snapshot => {
        let changed = false;
        snapshot.docChanges().forEach(change => {
          const remoteData = change.doc.data() as ReferralRecord;
          const idx = this.referrals.findIndex(r => r.id === remoteData.id);

          if (change.type === 'added' || change.type === 'modified') {
            if (idx >= 0) {
              this.referrals[idx] = remoteData;
            } else {
              this.referrals.unshift(remoteData);
            }
            changed = true;
          } else if (change.type === 'removed') {
            if (idx >= 0) {
              this.referrals.splice(idx, 1);
              changed = true;
            }
          }
        });

        if (changed) {
          this.saveToStorage();
        }
      }, err => {
        console.warn('Referrals Firestore snapshot sync warning:', err);
      });
      this.isListeningFirestore = true;
    } catch (err) {
      console.warn('Firestore referrals sync disabled in current environment:', err);
    }
  }

  /**
   * Registra una atribución de referido cuando un nuevo usuario se da de alta
   */
  public recordReferral(params: {
    inviterId: string;
    inviterName: string;
    referredUserId: string;
    referredUserName: string;
    referredUserEmail?: string;
    referredUserPhone?: string;
    source?: 'whatsapp_partner' | 'whatsapp_match' | 'direct_invite';
  }): ReferralRecord {
    const { inviterId, inviterName, referredUserId, referredUserName, referredUserEmail, referredUserPhone } = params;
    const source = params.source || 'whatsapp_partner';

    // Evitar auto-referidos
    if (inviterId === referredUserId) {
      throw new Error('Un usuario no puede referirse a sí mismo');
    }

    const recordId = `ref_${inviterId}_${referredUserId}`;
    const existingIndex = this.referrals.findIndex(r => r.id === recordId || r.referredUserId === referredUserId);

    if (existingIndex >= 0) {
      return this.referrals[existingIndex];
    }

    const newRecord: ReferralRecord = {
      id: recordId,
      inviterId,
      inviterName,
      referredUserId,
      referredUserName,
      referredUserEmail,
      referredUserPhone,
      source,
      registeredAt: Date.now(),
      hasSubscribedPro: false
    };

    this.referrals.unshift(newRecord);
    this.saveToStorage();

    // Sync to Cloud Firestore
    try {
      setDoc(doc(db, 'referrals', recordId), cleanForFirestore(newRecord)).catch(console.warn);
    } catch (e) {
      console.warn('Could not write referral record to Firestore:', e);
    }

    return newRecord;
  }

  /**
   * Hook disparado cuando un usuario cambia su plan a PRO / Subscribed
   * Detecta si vino por recomendación y acredita la conversión al invitador
   */
  public handleProUpgrade(referredUserId: string, planType: string): ReferralRecord | null {
    const record = this.referrals.find(r => r.referredUserId === referredUserId);
    if (!record) return null;

    if (!record.hasSubscribedPro) {
      record.hasSubscribedPro = true;
      record.proSubscribedAt = Date.now();
      record.planType = planType;
      this.saveToStorage();

      try {
        setDoc(doc(db, 'referrals', record.id), cleanForFirestore(record), { merge: true }).catch(console.warn);
      } catch (e) {
        console.warn('Could not update referral PRO status in Firestore:', e);
      }
    }

    return record;
  }

  /**
   * Obtiene las estadísticas de referidos de un usuario en particular
   */
  public getStatsForInviter(inviterId: string): InviterReferralStats {
    const userReferrals = this.referrals.filter(r => r.inviterId === inviterId);
    const proSubscribedCount = userReferrals.filter(r => r.hasSubscribedPro).length;

    return {
      totalInvited: userReferrals.length,
      proSubscribedCount,
      referrals: userReferrals
    };
  }

  /**
   * Obtiene la totalidad de los referidos de la plataforma (para analítica del fundador)
   */
  public getAllReferrals(): ReferralRecord[] {
    return [...this.referrals].sort((a, b) => b.registeredAt - a.registeredAt);
  }

  /**
   * Retorna el top de usuarios que más jugadores han traído
   */
  public getTopReferrers(): { inviterId: string; inviterName: string; totalInvited: number; proSubscribedCount: number }[] {
    const map = new Map<string, { inviterId: string; inviterName: string; totalInvited: number; proSubscribedCount: number }>();

    for (const r of this.referrals) {
      const existing = map.get(r.inviterId) || {
        inviterId: r.inviterId,
        inviterName: r.inviterName,
        totalInvited: 0,
        proSubscribedCount: 0
      };
      existing.totalInvited += 1;
      if (r.hasSubscribedPro) {
        existing.proSubscribedCount += 1;
      }
      map.set(r.inviterId, existing);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.proSubscribedCount !== a.proSubscribedCount) {
        return b.proSubscribedCount - a.proSubscribedCount;
      }
      return b.totalInvited - a.totalInvited;
    });
  }
}

export const referralService = new ReferralService();
