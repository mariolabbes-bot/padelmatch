import type { PadelGroup, GroupCallout, GroupMember, CommunityPlayer, PlayerCategory } from '../types/padel';
import { communityService } from './communityService';
import { notificationService } from './notificationService';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

const GROUPS_STORAGE_KEY = 'padelmatch_groups_v3';

class GroupService {
  private groups: PadelGroup[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cleanupLegacyStorage();
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private cleanupLegacyStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem('padelmatch_groups_v1');
      localStorage.removeItem('padelmatch_groups_v2');
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.seedInitialGroups();
      return;
    }
    try {
      const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (raw) {
        this.groups = (JSON.parse(raw) as PadelGroup[]).filter(g => g && g.id !== 'grp-cruzados-4ta');
      } else {
        this.seedInitialGroups();
      }
    } catch {
      this.seedInitialGroups();
    }
  }

  private initFirestoreSync() {
    try {
      // Purge any legacy mock group from remote Firestore
      deleteDoc(doc(db, 'groups', 'grp-cruzados-4ta')).catch(() => {});

      onSnapshot(collection(db, 'groups'), (snapshot) => {
        const cloudGroups: PadelGroup[] = [];
        snapshot.forEach(docSnap => {
          if (docSnap.id === 'grp-cruzados-4ta') {
            deleteDoc(doc(db, 'groups', 'grp-cruzados-4ta')).catch(() => {});
            return;
          }
          cloudGroups.push(docSnap.data() as PadelGroup);
        });

        this.groups = cloudGroups;
        this.saveToStorage(false);
      }, (err) => {
        console.warn('Firestore groups sync notice:', err);
      });
    } catch (e) {
      console.warn('Error starting Firestore groups sync:', e);
    }
  }

  private saveToStorage(syncToCloud = true) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.notify();
      return;
    }
    try {
      this.groups = this.groups.filter(g => g.id !== 'grp-cruzados-4ta');
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(this.groups));
    } catch (e) {
      console.warn('Error saving groups:', e);
    }
    if (syncToCloud) {
      this.groups.filter(g => g.id !== 'grp-cruzados-4ta').forEach(g => {
        setDoc(doc(db, 'groups', g.id), cleanForFirestore(g), { merge: true }).catch(console.warn);
      });
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private seedInitialGroups() {
    this.groups = [];
    this.saveToStorage(false);
  }

  public getGroups(): PadelGroup[] {
    return this.groups;
  }

  public getGroupById(groupId: string): PadelGroup | undefined {
    return this.groups.find(g => g.id === groupId);
  }

  public getUserGroups(playerId: string): PadelGroup[] {
    return this.groups.filter(g => g.members.some(m => m.playerId === playerId));
  }

  public createGroup(data: {
    name: string;
    description: string;
    city: string;
    clubPreferred: string;
    categoryLevel: PlayerCategory | 'abierta';
    creator: { id: string; name: string; category: PlayerCategory; elo: number };
    avatar?: string;
    initialMembers?: Array<{ id: string; name: string; category: PlayerCategory; elo: number }>;
  }): PadelGroup {
    const creatorMember: GroupMember = {
      playerId: data.creator.id,
      name: data.creator.name,
      category: data.creator.category,
      elo: data.creator.elo,
      role: 'admin',
      joinedAt: Date.now(),
      matchesPlayedInGroup: 0
    };

    const invitedMembers: GroupMember[] = (data.initialMembers || [])
      .filter(m => m.id !== data.creator.id)
      .map(m => ({
        playerId: m.id,
        name: m.name,
        category: m.category,
        elo: m.elo,
        role: 'member',
        joinedAt: Date.now(),
        matchesPlayedInGroup: 0
      }));

    const newGroup: PadelGroup = {
      id: `grp-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name.trim(),
      description: data.description.trim(),
      city: data.city.trim() || 'Santiago',
      clubPreferred: data.clubPreferred.trim() || 'Club de Pádel',
      categoryLevel: data.categoryLevel,
      members: [creatorMember, ...invitedMembers],
      callouts: [],
      createdAt: Date.now(),
      avatar: data.avatar || '🎾'
    };

    this.groups.unshift(newGroup);
    this.saveToStorage();

    // Send in-app notification to invited initial members
    invitedMembers.forEach(_invited => {
      notificationService.addNotification({
        type: 'friend_invite',
        title: `🎾 Te agregaron al grupo "${newGroup.name}"`,
        body: `${data.creator.name} te ha sumado como miembro al grupo de pádel "${newGroup.name}". ¡Entra a revisar las convocatorias!`,
        actionUrl: `#join-group=${newGroup.id}`
      });
    });

    return newGroup;
  }

  public joinGroup(groupId: string, player: { id: string; name: string; category: PlayerCategory; elo: number }) {
    const group = this.getGroupById(groupId);
    if (!group) return;

    if (!group.members.some(m => m.playerId === player.id)) {
      group.members.push({
        playerId: player.id,
        name: player.name,
        category: player.category,
        elo: player.elo,
        role: 'member',
        joinedAt: Date.now(),
        matchesPlayedInGroup: 0
      });
      this.saveToStorage();
    }
  }

  public inviteMember(
    groupId: string, 
    player: { id: string; name: string; category: PlayerCategory; elo: number }, 
    inviterName?: string
  ): { success: boolean; message: string } {
    const group = this.getGroupById(groupId);
    if (!group) return { success: false, message: 'Grupo no encontrado.' };

    if (group.members.some(m => m.playerId === player.id)) {
      return { success: false, message: `${player.name} ya es miembro de este grupo.` };
    }

    group.members.push({
      playerId: player.id,
      name: player.name,
      category: player.category,
      elo: player.elo,
      role: 'member',
      joinedAt: Date.now(),
      matchesPlayedInGroup: 0
    });
    this.saveToStorage();

    // In-app notification
    notificationService.addNotification({
      type: 'friend_invite',
      title: `🎾 Invitación a Grupo: ${group.name}`,
      body: `${inviterName || 'Un jugador'} te ha invitado al grupo de pádel "${group.name}". ¡Súmate a las próximas partidas!`,
      actionUrl: `#join-group=${group.id}`
    });

    return { success: true, message: `¡${player.name} ha sido invitado al grupo!` };
  }

  public getWhatsAppInviteText(group: PadelGroup, inviterName: string, inviteUrl: string): string {
    return `¡Hola! 🎾 ${inviterName} te está invitando a unirte al grupo de pádel "${group.name}" en PadelMatch.\n\n` +
      `🏆 ¿Qué es PadelMatch?\n` +
      `Es el ecosistema inteligente para jugadores y clubes de pádel:\n` +
      `• 🎙️ Árbitro en vivo por voz durante tus partidos\n` +
      `• ⌚ Control de tanteo desde Smartwatch y pulsadores\n` +
      `• ⚡ Convocatorias de partidos en múltiplos de 4 (¡nunca más falta 1!)\n` +
      `• 📊 Ranking ELO dinámico, tarjetas de partido y estadísticas\n` +
      `• 🤝 Comunidad con amigos, grupos y beneficios en clubes\n\n` +
      `👉 Súmate al grupo y activa tu cuenta gratis aquí:\n` +
      `${inviteUrl}\n\n` +
      `¡Te esperamos en la cancha! 🎾🔥`;
  }

  public leaveGroup(groupId: string, playerId: string) {
    const group = this.getGroupById(groupId);
    if (!group) return;

    group.members = group.members.filter(m => m.playerId !== playerId);
    this.saveToStorage();
  }

  public createCallout(groupId: string, data: {
    creatorId: string;
    creatorName: string;
    clubName: string;
    courtName?: string;
    matchDate: string;
    matchTime: string;
    deadlineTime: string;
    categoryTarget: PlayerCategory | 'abierta';
    notes?: string;
  }): GroupCallout | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const newCallout: GroupCallout = {
      id: `callout-${Date.now().toString(36)}`,
      groupId,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      clubName: data.clubName,
      courtName: data.courtName,
      matchDate: data.matchDate,
      matchTime: data.matchTime,
      deadlineTime: data.deadlineTime,
      categoryTarget: data.categoryTarget,
      acceptedPlayerIds: [data.creatorId], // Creador ya está confirmado
      rejectedPlayerIds: [],
      status: 'open',
      notes: data.notes,
      createdAt: Date.now()
    };

    group.callouts.unshift(newCallout);
    this.saveToStorage();
    return newCallout;
  }

  public respondCallout(groupId: string, calloutId: string, playerId: string, response: 'accept' | 'reject') {
    const group = this.getGroupById(groupId);
    if (!group) return;

    const callout = group.callouts.find(c => c.id === calloutId);
    if (!callout) return;

    callout.acceptedPlayerIds = callout.acceptedPlayerIds.filter(id => id !== playerId);
    callout.rejectedPlayerIds = callout.rejectedPlayerIds.filter(id => id !== playerId);

    if (response === 'accept') {
      callout.acceptedPlayerIds.push(playerId);
    } else {
      callout.rejectedPlayerIds.push(playerId);
    }

    this.saveToStorage();
  }

  /**
   * CÁLCULO INTELIGENTE DE MÚLTIPLOS DE 4 (Lógica central definida por Mario Labbé)
   * Determina si las canchas están completas (4, 8, 12 jugadores),
   * cuántos jugadores faltan para cerrar la siguiente cancha,
   * y lista candidatos ideales recomendados de la comunidad fuera del grupo.
   */
  public getCalloutSlotStatus(groupId: string, calloutId: string): {
    totalAccepted: number;
    isMultipleOfFour: boolean;
    completedCourts: number;
    slotsNeededToComplete: number;
    recommendedPlayers: CommunityPlayer[];
  } {
    const group = this.getGroupById(groupId);
    if (!group) {
      return { totalAccepted: 0, isMultipleOfFour: false, completedCourts: 0, slotsNeededToComplete: 4, recommendedPlayers: [] };
    }

    const callout = group.callouts.find(c => c.id === calloutId);
    if (!callout) {
      return { totalAccepted: 0, isMultipleOfFour: false, completedCourts: 0, slotsNeededToComplete: 4, recommendedPlayers: [] };
    }

    const totalAccepted = callout.acceptedPlayerIds.length;
    const remainder = totalAccepted % 4;
    const isMultipleOfFour = totalAccepted > 0 && remainder === 0;
    const completedCourts = Math.floor(totalAccepted / 4);
    const slotsNeededToComplete = isMultipleOfFour ? 0 : (4 - remainder);

    // Buscar candidatos recomendados en la comunidad que:
    // 1. No estén ya aceptados en la convocatoria
    // 2. Sean del mismo club o misma categoría
    const allCommunity = communityService.getPlayers();
    const recommendedPlayers = allCommunity.filter(p => {
      const alreadyAccepted = callout.acceptedPlayerIds.includes(p.id);
      if (alreadyAccepted) return false;

      const matchesClub = !callout.clubName || (p.club && p.club.toLowerCase().includes(callout.clubName.toLowerCase())) || true;
      const matchesCategory = callout.categoryTarget === 'abierta' || p.category === callout.categoryTarget;

      return matchesClub && matchesCategory;
    }).slice(0, 4);

    return {
      totalAccepted,
      isMultipleOfFour,
      completedCourts,
      slotsNeededToComplete,
      recommendedPlayers
    };
  }
}

export const groupService = new GroupService();
