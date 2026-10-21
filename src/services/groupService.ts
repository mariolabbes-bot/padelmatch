import type { PadelGroup, GroupCallout, GroupMember, CommunityPlayer, PlayerCategory } from '../types/padel';
import { communityService } from './communityService';
import { notificationService } from './notificationService';

const GROUPS_STORAGE_KEY = 'padelmatch_groups_v1';

class GroupService {
  private groups: PadelGroup[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.seedInitialGroups();
      return;
    }
    try {
      const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (raw) {
        this.groups = JSON.parse(raw);
      } else {
        this.seedInitialGroups();
      }
    } catch {
      this.seedInitialGroups();
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.notify();
      return;
    }
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(this.groups));
    } catch (e) {
      console.warn('Error saving groups:', e);
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
    const players = communityService.getPlayers();
    const mario = players.find(p => p.email === 'mariolabbes@gmail.com') || players[0] || {
      id: 'founder-mario-labbe',
      name: 'Mario Labbé',
      category: '4ta' as const,
      elo: 1400
    };
    const fernando = players.find(p => p.name.includes('Fernando')) || players[1] || {
      id: 'player-fernando',
      name: 'Fernando González',
      category: '4ta' as const,
      elo: 1420
    };
    const matias = players.find(p => p.name.includes('Matías')) || players[2] || {
      id: 'player-matias',
      name: 'Matías Silva',
      category: '4ta' as const,
      elo: 1380
    };
    const rodrigo = players.find(p => p.name.includes('Rodrigo')) || players[3] || {
      id: 'player-rodrigo',
      name: 'Rodrigo Valenzuela',
      category: '4ta' as const,
      elo: 1395
    };
    const ignacio = players.find(p => p.name.includes('Ignacio')) || players[4] || {
      id: 'player-ignacio',
      name: 'Ignacio Morales',
      category: '4ta' as const,
      elo: 1360
    };
    const diego = players.find(p => p.name.includes('Diego')) || players[5] || {
      id: 'player-diego',
      name: 'Diego Castro',
      category: '4ta' as const,
      elo: 1350
    };
    const cristian = players.find(p => p.name.includes('Cristian')) || players[6] || {
      id: 'player-cristian',
      name: 'Cristian Rojas',
      category: '4ta' as const,
      elo: 1340
    };

    const initialMembers1: GroupMember[] = [
      {
        playerId: mario.id,
        name: mario.name,
        category: mario.category,
        elo: mario.elo,
        role: 'admin',
        joinedAt: Date.now() - 30 * 86400000,
        matchesPlayedInGroup: 12
      },
      {
        playerId: fernando.id,
        name: fernando.name,
        category: fernando.category,
        elo: fernando.elo,
        role: 'member',
        joinedAt: Date.now() - 25 * 86400000,
        matchesPlayedInGroup: 10
      },
      {
        playerId: matias.id,
        name: matias.name,
        category: matias.category,
        elo: matias.elo,
        role: 'member',
        joinedAt: Date.now() - 20 * 86400000,
        matchesPlayedInGroup: 8
      },
      {
        playerId: rodrigo.id,
        name: rodrigo.name,
        category: rodrigo.category,
        elo: rodrigo.elo,
        role: 'member',
        joinedAt: Date.now() - 18 * 86400000,
        matchesPlayedInGroup: 7
      },
      {
        playerId: ignacio.id,
        name: ignacio.name,
        category: ignacio.category,
        elo: ignacio.elo,
        role: 'member',
        joinedAt: Date.now() - 15 * 86400000,
        matchesPlayedInGroup: 6
      },
      {
        playerId: diego.id,
        name: diego.name,
        category: diego.category,
        elo: diego.elo,
        role: 'member',
        joinedAt: Date.now() - 10 * 86400000,
        matchesPlayedInGroup: 5
      },
      {
        playerId: cristian.id,
        name: cristian.name,
        category: cristian.category,
        elo: cristian.elo,
        role: 'member',
        joinedAt: Date.now() - 5 * 86400000,
        matchesPlayedInGroup: 3
      }
    ];

    // Seed callout with 7 players accepted -> Missing 1 to reach multiple of 4 (8 players / 2 courts)
    const callout1: GroupCallout = {
      id: 'callout-jueves-pro',
      groupId: 'grp-cruzados-4ta',
      creatorId: mario.id,
      creatorName: mario.name,
      clubName: 'Club Padel Oriente',
      courtName: 'Cancha 1 y Cancha 2',
      matchDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      matchTime: '19:30',
      deadlineTime: 'Jueves 14:00 hrs',
      categoryTarget: '4ta',
      acceptedPlayerIds: [mario.id, fernando.id, matias.id, rodrigo.id, ignacio.id, diego.id, cristian.id],
      rejectedPlayerIds: [],
      status: 'open',
      notes: '¡Convocatoria para 2 canchas (8 cupos)! Falta 1 para cerrar.',
      createdAt: Date.now() - 3600000 * 5
    };

    this.groups = [
      {
        id: 'grp-cruzados-4ta',
        name: 'Los Cruzados del Pádel (4ª Cat)',
        description: 'Grupo oficial de partidos semanales martes y jueves. Competitividad alta, tercer tiempo asegurado.',
        city: 'Santiago',
        clubPreferred: 'Club Padel Oriente',
        categoryLevel: '4ta',
        members: initialMembers1,
        callouts: [callout1],
        createdAt: Date.now() - 86400000 * 45,
        avatar: '🎾'
      },
      {
        id: 'grp-nocturno-oriente',
        name: 'Pádel Nocturno Santiago',
        description: 'Partidos bajo foco artificial después de las 20:00 hrs. Categorías 3ª y 4ª.',
        city: 'Santiago',
        clubPreferred: 'Club Padel Pro La Dehesa',
        categoryLevel: 'abierta',
        members: [
          {
            playerId: mario.id,
            name: mario.name,
            category: mario.category,
            elo: mario.elo,
            role: 'member',
            joinedAt: Date.now() - 15 * 86400000,
            matchesPlayedInGroup: 4
          },
          {
            playerId: fernando.id,
            name: fernando.name,
            category: fernando.category,
            elo: fernando.elo,
            role: 'admin',
            joinedAt: Date.now() - 40 * 86400000,
            matchesPlayedInGroup: 18
          }
        ],
        callouts: [],
        createdAt: Date.now() - 86400000 * 60,
        avatar: '🌙'
      },
      {
        id: 'grp-circuito-chile',
        name: 'Circuito Americano Metropolitano',
        description: 'Torneos relámpago americanos de 2 horas. Cambios de pareja y ranking acumulado.',
        city: 'Santiago',
        clubPreferred: 'Padel Center Ciudad Deportiva',
        categoryLevel: 'abierta',
        members: [
          {
            playerId: mario.id,
            name: mario.name,
            category: mario.category,
            elo: mario.elo,
            role: 'member',
            joinedAt: Date.now() - 10 * 86400000,
            matchesPlayedInGroup: 2
          }
        ],
        callouts: [],
        createdAt: Date.now() - 86400000 * 30,
        avatar: '🏆'
      }
    ];

    this.saveToStorage();
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
