import type { 
  ScheduledMatch, 
  ScheduledPlayerSlot, 
  CommunityPlayer,
  PlayerCategory 
} from '../types/padel';
import type { UserSession } from './authService';
import { notificationService } from './notificationService';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

const SCHEDULE_STORAGE_KEY = 'padelmatch_scheduled_matches_v1';

class ScheduleService {
  private matches: ScheduledMatch[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (raw) {
        this.matches = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error loading scheduled matches from localStorage:', e);
      this.matches = [];
    }
  }

  private saveToStorage(notifyListeners: boolean = true) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(this.matches));
    } catch (e) {
      console.warn('Error saving scheduled matches to localStorage:', e);
    }
    if (notifyListeners) {
      this.notify();
    }
  }

  private initFirestoreSync() {
    try {
      onSnapshot(collection(db, 'scheduled_matches'), (snapshot) => {
        let changed = false;
        snapshot.forEach(docSnap => {
          const remote = docSnap.data() as ScheduledMatch;
          if (remote && remote.id) {
            const idx = this.matches.findIndex(m => m.id === remote.id);
            if (idx === -1) {
              this.matches.unshift(remote);
              changed = true;
            } else if (remote.updatedAt > (this.matches[idx].updatedAt || 0)) {
              this.matches[idx] = remote;
              changed = true;
            }
          }
        });

        if (changed) {
          this.matches.sort((a, b) => b.createdAt - a.createdAt);
          this.saveToStorage(true);
        }
      }, (err) => {
        console.warn('Firestore scheduled_matches notice:', err);
      });
    } catch (e) {
      console.warn('Error starting Firestore scheduled_matches listener:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Core Lifecycle Methods ---

  public createScheduledMatch(
    creator: UserSession,
    data: {
      clubName: string;
      courtName?: string;
      matchDate: string; // YYYY-MM-DD
      matchTime: string; // HH:mm
      invitedPartners?: CommunityPlayer[];
      notes?: string;
    }
  ): ScheduledMatch {
    const id = `SCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Slot 0: Host (Confirmed)
    const hostSlot: ScheduledPlayerSlot = {
      id: `slot-0-${id}`,
      slotIndex: 0,
      playerId: creator.id,
      name: creator.name,
      email: creator.email,
      phone: creator.phone,
      avatar: creator.avatar,
      category: creator.category,
      isHost: true,
      status: 'confirmed',
      invitedVia: 'app_partner',
      confirmedAt: Date.now()
    };

    const invitedPartners = data.invitedPartners || [];
    const invitedPlayerIds: string[] = [];

    // Slots 1, 2, 3: Pre-assigned to invited partners or open for WhatsApp/Manual
    const slots: ScheduledPlayerSlot[] = [hostSlot];

    for (let i = 1; i < 4; i++) {
      const partner = invitedPartners[i - 1];
      if (partner) {
        invitedPlayerIds.push(partner.id);
        slots.push({
          id: `slot-${i}-${id}`,
          slotIndex: i,
          playerId: partner.id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          avatar: partner.avatar,
          category: partner.category,
          isHost: false,
          status: 'pending',
          invitedVia: 'app_partner'
        });
      } else {
        slots.push({
          id: `slot-${i}-${id}`,
          slotIndex: i,
          name: `Cupo ${i + 1} (Por invitar)`,
          isHost: false,
          status: 'pending',
          invitedVia: 'whatsapp'
        });
      }
    }

    const newMatch: ScheduledMatch = {
      id,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorEmail: creator.email,
      creatorAvatar: creator.avatar,
      clubName: data.clubName.trim(),
      courtName: data.courtName ? data.courtName.trim() : undefined,
      matchDate: data.matchDate,
      matchTime: data.matchTime,
      slots,
      invitedPlayerIds,
      status: 'open',
      notes: data.notes ? data.notes.trim() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.matches.unshift(newMatch);
    this.saveToStorage(true);

    // Push to Cloud Firestore
    setDoc(doc(db, 'scheduled_matches', newMatch.id), cleanForFirestore(newMatch)).catch(console.warn);

    // Notify invited partners in-app
    invitedPartners.forEach(() => {
      notificationService.addNotification({
        type: 'open_match',
        title: `🎾 ${creator.name} te invitó a un partido`,
        body: `Fecha: ${data.matchDate} a las ${data.matchTime} en ${data.clubName}. ¡Toca para confirmar o declinar tu lugar!`,
        actionUrl: `#scheduled-match=${newMatch.id}`,
        clubName: data.clubName
      });
    });

    return newMatch;
  }

  public inviteAdditionalPartner(matchId: string, partner: CommunityPlayer, inviter: UserSession): boolean {
    const match = this.matches.find(m => m.id === matchId);
    if (!match || match.status !== 'open') return false;

    // Check if partner is already in a slot
    const existingSlot = match.slots.find(s => s.playerId === partner.id);
    if (existingSlot && existingSlot.status !== 'declined') {
      return false; // already in slot
    }

    // Find first available pending slot without an active user, or replace declined
    let targetSlot = match.slots.find(s => !s.isHost && (!s.playerId || s.status === 'declined'));
    if (!targetSlot) {
      // Find any slot with pending
      targetSlot = match.slots.find(s => !s.isHost && s.status === 'pending');
    }

    if (targetSlot) {
      targetSlot.playerId = partner.id;
      targetSlot.name = partner.name;
      targetSlot.email = partner.email;
      targetSlot.phone = partner.phone;
      targetSlot.avatar = partner.avatar;
      targetSlot.category = partner.category;
      targetSlot.status = 'pending';
      targetSlot.invitedVia = 'app_partner';
      targetSlot.confirmedAt = undefined;
    }

    if (!match.invitedPlayerIds.includes(partner.id)) {
      match.invitedPlayerIds.push(partner.id);
    }

    match.updatedAt = Date.now();
    this.saveToStorage(true);
    setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);

    // Send in-app notification
    notificationService.addNotification({
      type: 'open_match',
      title: `🎾 ${inviter.name} te invitó a un partido`,
      body: `Fecha: ${match.matchDate} a las ${match.matchTime} en ${match.clubName}. ¡Toca para confirmar o declinar tu lugar!`,
      actionUrl: `#scheduled-match=${match.id}`,
      clubName: match.clubName
    });

    return true;
  }

  public respondInvite(
    matchId: string,
    responder: {
      id?: string;
      name: string;
      email?: string;
      phone?: string;
      avatar?: string;
      category?: PlayerCategory;
    },
    accept: boolean
  ): { success: boolean; isComplete: boolean; error?: string } {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return { success: false, isComplete: false, error: 'Partido no encontrado' };

    if (match.status !== 'open') {
      return { 
        success: false, 
        isComplete: match.status === 'confirmed', 
        error: match.status === 'confirmed' ? 'Este partido ya fue cerrado y confirmado con sus 4 jugadores.' : 'Esta convocatoria ya no está activa.' 
      };
    }

    if (accept) {
      // 1. Try to find if user already occupies a slot
      let slot = match.slots.find(s => 
        (responder.id && s.playerId === responder.id) ||
        (responder.email && s.email && s.email.toLowerCase() === responder.email.toLowerCase())
      );

      // 2. If not found, look for first available open/pending slot
      if (!slot) {
        slot = match.slots.find(s => !s.isHost && s.status !== 'confirmed');
      }

      if (!slot) {
        return { success: false, isComplete: true, error: 'Lo sentimos, los 4 cupos de este partido ya fueron completados.' };
      }

      slot.playerId = responder.id || slot.playerId || `guest-${Date.now().toString(36)}`;
      slot.name = responder.name.trim();
      if (responder.email) slot.email = responder.email;
      if (responder.phone) slot.phone = responder.phone;
      if (responder.avatar) slot.avatar = responder.avatar;
      if (responder.category) slot.category = responder.category;
      slot.status = 'confirmed';
      slot.confirmedAt = Date.now();

      const confirmedCount = match.slots.filter(s => s.status === 'confirmed').length;
      const isComplete = confirmedCount >= 4;

      match.updatedAt = Date.now();
      this.saveToStorage(true);
      setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);

      // Notify host that player accepted
      notificationService.addNotification({
        type: 'friend_invite',
        title: `✅ ${responder.name} confirmó asistencia`,
        body: `Aceptó tu convocatoria para el ${match.matchDate} en ${match.clubName} (${confirmedCount}/4 jugadores listos).`,
        actionUrl: `#scheduled-match=${match.id}`
      });

      if (isComplete) {
        notificationService.addNotification({
          type: 'friend_invite',
          title: `🎉 ¡Cancha completa (4/4)!`,
          body: `Ya tienes los 4 jugadores listos para el partido del ${match.matchDate} en ${match.clubName}. ¡Puedes cerrar y agendar el partido!`,
          actionUrl: `#scheduled-match=${match.id}`
        });
      }

      return { success: true, isComplete };
    } else {
      // Responder declines
      const slot = match.slots.find(s => 
        (responder.id && s.playerId === responder.id) ||
        (responder.email && s.email && s.email.toLowerCase() === responder.email.toLowerCase())
      );

      if (slot && !slot.isHost) {
        slot.status = 'declined';
        slot.name = `Cupo ${slot.slotIndex + 1} (Disponible)`;
        slot.playerId = undefined;
        slot.confirmedAt = undefined;
      }

      match.updatedAt = Date.now();
      this.saveToStorage(true);
      setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);

      // Notify host
      notificationService.addNotification({
        type: 'friend_invite',
        title: `❌ ${responder.name} declinó la invitación`,
        body: `No podrá asistir al partido del ${match.matchDate} en ${match.clubName}. El cupo quedó disponible para invitar a otro jugador.`,
        actionUrl: `#scheduled-match=${match.id}`
      });

      return { success: true, isComplete: false };
    }
  }

  public confirmAndCloseMatch(matchId: string, host: UserSession): { success: boolean; error?: string } {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return { success: false, error: 'Partido no encontrado.' };

    if (match.creatorId !== host.id && match.creatorEmail.toLowerCase() !== host.email.toLowerCase()) {
      return { success: false, error: 'Solo el anfitrión organizador puede cerrar y confirmar este partido.' };
    }

    const confirmedSlots = match.slots.filter(s => s.status === 'confirmed');
    if (confirmedSlots.length < 4) {
      return { 
        success: false, 
        error: `Faltan jugadores para cerrar el partido (hay ${confirmedSlots.length} de 4 confirmados). Invita a más amigos para completar los 4.` 
      };
    }

    match.status = 'confirmed';
    match.updatedAt = Date.now();
    this.saveToStorage(true);
    setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);

    // Notify all 4 confirmed players
    match.slots.forEach(slot => {
      if (slot.playerId) {
        notificationService.addNotification({
          type: 'friend_invite',
          title: `🎾 ¡Partido Confirmado y Agendado!`,
          body: `Nos vemos el ${match.matchDate} a las ${match.matchTime} en ${match.clubName}. El partido ya está agendado en tu Dashboard.`,
          actionUrl: `#scheduled-match=${match.id}`,
          clubName: match.clubName
        });
      }
    });

    return { success: true };
  }

  public cancelScheduledMatch(matchId: string, host: UserSession, reason?: string): { success: boolean; error?: string } {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return { success: false, error: 'Partido no encontrado.' };

    if (match.creatorId !== host.id && match.creatorEmail.toLowerCase() !== host.email.toLowerCase()) {
      return { success: false, error: 'Solo el anfitrión organizador puede cancelar este partido.' };
    }

    match.status = 'cancelled';
    match.updatedAt = Date.now();
    this.saveToStorage(true);
    setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);

    // Notify all confirmed participants
    match.slots.forEach(slot => {
      if (slot.playerId && !slot.isHost) {
        notificationService.addNotification({
          type: 'friend_invite',
          title: `⚠️ Partido Cancelado`,
          body: `El partido del ${match.matchDate} en ${match.clubName} ha sido cancelado por el organizador${reason ? ': ' + reason : '.'}`,
          actionUrl: '#dashboard'
        });
      }
    });

    return { success: true };
  }

  public markInProgress(matchId: string, matchSyncRoomId?: string) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;
    match.status = 'in_progress';
    if (matchSyncRoomId) match.matchSyncRoomId = matchSyncRoomId;
    match.updatedAt = Date.now();
    this.saveToStorage(true);
    setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);
  }

  public markCompleted(matchId: string) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;
    match.status = 'completed';
    match.updatedAt = Date.now();
    this.saveToStorage(true);
    setDoc(doc(db, 'scheduled_matches', match.id), cleanForFirestore(match), { merge: true }).catch(console.warn);
  }

  // --- Queries ---

  public getMatches(): ScheduledMatch[] {
    return this.matches;
  }

  public getMatchById(matchId: string): ScheduledMatch | null {
    return this.matches.find(m => m.id === matchId) || null;
  }

  public getMatchesForUser(user: UserSession): {
    confirmedUpcoming: ScheduledMatch[];
    myOpenCallouts: ScheduledMatch[];
    pendingInvitesToMe: ScheduledMatch[];
    pastMatches: ScheduledMatch[];
  } {
    const normEmail = user.email.toLowerCase();
    const confirmedUpcoming: ScheduledMatch[] = [];
    const myOpenCallouts: ScheduledMatch[] = [];
    const pendingInvitesToMe: ScheduledMatch[] = [];
    const pastMatches: ScheduledMatch[] = [];

    this.matches.forEach(m => {
      const isCreator = m.creatorId === user.id || m.creatorEmail.toLowerCase() === normEmail;
      const mySlot = m.slots.find(s => 
        (s.playerId && s.playerId === user.id) || 
        (s.email && s.email.toLowerCase() === normEmail)
      );

      const isInvited = m.invitedPlayerIds?.includes(user.id) || (mySlot && mySlot.status === 'pending');

      if (m.status === 'cancelled') {
        pastMatches.push(m);
      } else if (m.status === 'completed') {
        pastMatches.push(m);
      } else if (m.status === 'confirmed') {
        if (isCreator || (mySlot && mySlot.status === 'confirmed')) {
          confirmedUpcoming.push(m);
        }
      } else if (m.status === 'open') {
        if (isCreator) {
          myOpenCallouts.push(m);
        } else if (isInvited && mySlot?.status === 'pending') {
          pendingInvitesToMe.push(m);
        }
      }
    });

    return {
      confirmedUpcoming,
      myOpenCallouts,
      pendingInvitesToMe,
      pastMatches
    };
  }

  // --- WhatsApp Text Generators ---

  public generateWhatsAppInviteText(match: ScheduledMatch, inviterName: string): string {
    const confirmedCount = match.slots.filter(s => s.status === 'confirmed').length;
    const remainingCount = 4 - confirmedCount;
    const inviteUrl = `https://padelmatch.web.app#match-invite=${match.id}`;

    return (
      `🎾 *¡CONVOCATORIA DE PÁDEL!* 🎾\n\n` +
      `Hola! ${inviterName} te invita a jugar un partido de pádel:\n\n` +
      `📅 *Fecha:* ${this.formatReadableDate(match.matchDate)}\n` +
      `⏰ *Hora:* ${match.matchTime} hrs\n` +
      `📍 *Club:* ${match.clubName}${match.courtName ? ` (${match.courtName})` : ''}\n` +
      `👥 *Quórum actual:* ${confirmedCount}/4 jugadores confirmados\n` +
      (remainingCount > 0 ? `🔥 *¡Faltan solo ${remainingCount} para cerrar la cancha!*\n\n` : `\n`) +
      `👉 *Confirma tu lugar con un solo toque aquí:*\n${inviteUrl}\n\n` +
      `_PadelMatch: Marcador Inteligente & Comunidad de Pádel_`
    );
  }

  public generateWhatsAppCancellationText(match: ScheduledMatch, reason?: string): string {
    return (
      `⚠️ *AVISO: PARTIDO DE PÁDEL CANCELADO* ⚠️\n\n` +
      `Estimados, el partido programado para el *${this.formatReadableDate(match.matchDate)} a las ${match.matchTime} hrs* en *${match.clubName}* ha sido cancelado por el organizador${reason ? ` (Motivo: ${reason})` : ''}.\n\n` +
      `¡Nos organizamos para el próximo turno en PadelMatch!`
    );
  }

  private formatReadableDate(dateStr: string): string {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  }
}

export const scheduleService = new ScheduleService();
