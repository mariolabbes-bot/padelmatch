import type { 
  PartnerConnection, 
  PartnerPost, 
  PartnerComment, 
  ClubCampaign, 
  PadelNewsItem,
  CommunityPlayer
} from '../types/padel';
import type { UserSession } from './authService';
import { communityService } from './communityService';
import { notificationService } from './notificationService';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

const CONNECTIONS_KEY = 'padelmatch_partner_connections_v2';
const POSTS_KEY = 'padelmatch_partner_posts_v2';

class PartnerService {
  private connections: PartnerConnection[] = [];
  private posts: PartnerPost[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cleanupLegacyStorage();
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private cleanupLegacyStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem('padelmatch_partner_connections_v1');
      localStorage.removeItem('padelmatch_partner_posts_v1');
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.connections = [];
      this.posts = [];
      return;
    }
    try {
      const rawConn = localStorage.getItem(CONNECTIONS_KEY);
      this.connections = rawConn ? JSON.parse(rawConn) : [];

      const rawPosts = localStorage.getItem(POSTS_KEY);
      this.posts = rawPosts ? JSON.parse(rawPosts) : [];
    } catch {
      this.connections = [];
      this.posts = [];
    }
  }

  private initFirestoreSync() {
    try {
      // 1. Sync Partner Connections
      onSnapshot(collection(db, 'partner_connections'), (snapshot) => {
        const cloudConn: PartnerConnection[] = [];
        snapshot.forEach(docSnap => {
          cloudConn.push(docSnap.data() as PartnerConnection);
        });
        this.connections = cloudConn;
        this.saveConnections();
      }, (err) => {
        console.warn('Firestore connections sync notice:', err);
      });

      // 2. Sync Partner Posts
      onSnapshot(collection(db, 'partner_posts'), (snapshot) => {
        const cloudPosts: PartnerPost[] = [];
        snapshot.forEach(docSnap => {
          cloudPosts.push(docSnap.data() as PartnerPost);
        });
        this.posts = cloudPosts;
        this.savePosts();
      }, (err) => {
        console.warn('Firestore posts sync notice:', err);
      });
    } catch (e) {
      console.warn('Error starting Firestore partner sync:', e);
    }
  }

  private saveConnections() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(this.connections));
      } catch (e) {
        console.warn('Error saving partner connections:', e);
      }
    }
    this.notify();
  }

  private savePosts() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(POSTS_KEY, JSON.stringify(this.posts));
      } catch (e) {
        console.warn('Error saving partner posts:', e);
      }
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

  // --- Partner Management ---

  public getPartners(user: UserSession | null): CommunityPlayer[] {
    if (!user) return [];
    const acceptedTargetIds = new Set<string>();

    this.connections.forEach(conn => {
      if (conn.status === 'accepted') {
        if (conn.requesterId === user.id || conn.requesterName.toLowerCase() === user.name.toLowerCase()) {
          acceptedTargetIds.add(conn.targetId);
        } else if (conn.targetId === user.id || conn.targetName.toLowerCase() === user.name.toLowerCase()) {
          acceptedTargetIds.add(conn.requesterId);
        }
      }
    });

    const allPlayers = communityService.getPlayers();
    return allPlayers.filter(p => acceptedTargetIds.has(p.id) || acceptedTargetIds.has(p.name));
  }

  public getPendingRequests(user: UserSession | null): PartnerConnection[] {
    if (!user) return [];
    return this.connections.filter(c => 
      c.status === 'pending' && 
      (c.targetId === user.id || c.targetName.toLowerCase() === user.name.toLowerCase())
    );
  }

  public isPartner(user: UserSession | null, targetId: string): boolean {
    if (!user) return false;
    return this.connections.some(c => 
      c.status === 'accepted' && 
      ((c.requesterId === user.id && c.targetId === targetId) ||
       (c.targetId === user.id && c.requesterId === targetId))
    );
  }

  public hasPendingRequest(user: UserSession | null, targetId: string): boolean {
    if (!user) return false;
    return this.connections.some(c => 
      c.status === 'pending' && 
      ((c.requesterId === user.id && c.targetId === targetId) ||
       (c.targetId === user.id && c.requesterId === targetId))
    );
  }

  public sendPartnerRequest(requester: UserSession, target: CommunityPlayer): { success: boolean; message: string } {
    if (this.isPartner(requester, target.id)) {
      return { success: false, message: 'Ya están conectados como Partners.' };
    }
    if (this.hasPendingRequest(requester, target.id)) {
      return { success: false, message: 'Ya existe una solicitud pendiente.' };
    }

    const newConn: PartnerConnection = {
      id: 'conn-' + Date.now().toString(36),
      requesterId: requester.id,
      requesterName: requester.name,
      requesterCategory: requester.category,
      requesterElo: requester.elo,
      targetId: target.id,
      targetName: target.name,
      status: 'pending',
      createdAt: Date.now()
    };

    this.connections.unshift(newConn);
    this.saveConnections();

    // Push to Cloud Firestore
    setDoc(doc(db, 'partner_connections', newConn.id), cleanForFirestore(newConn)).catch(console.warn);

    // Trigger in-app notification
    notificationService.addNotification({
      type: 'friend_invite',
      title: 'Nueva Solicitud de Partner',
      body: `${requester.name} (${requester.category} Cat) quiere conectar contigo como Partner.`
    });

    return { success: true, message: `Solicitud enviada a ${target.name}. Se notificará para aceptar.` };
  }

  public respondToRequest(requestId: string, accept: boolean) {
    const conn = this.connections.find(c => c.id === requestId);
    if (!conn) return;

    conn.status = accept ? 'accepted' : 'rejected';
    this.saveConnections();

    // Push update to Cloud Firestore
    setDoc(doc(db, 'partner_connections', conn.id), cleanForFirestore(conn), { merge: true }).catch(console.warn);

    if (accept) {
      notificationService.addNotification({
        type: 'friend_invite',
        title: '¡Partner Conectado!',
        body: `Ahora estás conectado con ${conn.requesterName}. Pueden ver sus partidos, estadísticas y comentarios.`
      });
    }
  }

  // --- External Partner WhatsApp Invitations ---

  public generateWhatsAppPartnerInviteText(inviter: UserSession, customMessage?: string, friendName?: string): string {
    const inviteUrl = `https://padelmatch.web.app#register?invite-partner=${inviter.id}&name=${encodeURIComponent(inviter.name)}`;
    const greeting = friendName?.trim() ? `¡Hola ${friendName.trim()}! 🎾` : '¡Hola! 🎾';
    const noteText = customMessage?.trim() ? `\n\n💬 *Mensaje de ${inviter.name}:*\n"${customMessage.trim()}"` : '';

    return (
      `${greeting}\n\n` +
      `Te invito a sumarte a mi lista de partners en *PadelMatch*, la app oficial que uso para llevar el marcador inteligente con arbitraje por voz, estadísticas de partido y ranking ELO.\n` +
      `${noteText}\n\n` +
      `👉 *Regístrate gratis aquí para conectar automáticamente como partners:*\n${inviteUrl}\n\n` +
      `¡Nos vemos en la pista! 🏆`
    );
  }

  public autoConnectInvitedPartner(newUser: UserSession, inviterId: string, inviterName?: string): boolean {
    if (!inviterId || inviterId === newUser.id) return false;

    // Check if already connected or pending
    const existing = this.connections.find(c => 
      (c.requesterId === inviterId && c.targetId === newUser.id) ||
      (c.targetId === inviterId && c.requesterId === newUser.id)
    );

    if (existing) {
      existing.status = 'accepted';
      this.saveConnections();
      setDoc(doc(db, 'partner_connections', existing.id), cleanForFirestore(existing), { merge: true }).catch(console.warn);
      return true;
    }

    // Create mutual accepted connection
    const newConn: PartnerConnection = {
      id: 'conn-' + Date.now().toString(36),
      requesterId: inviterId,
      requesterName: inviterName || 'Partner',
      requesterCategory: '4ta',
      requesterElo: 1400,
      targetId: newUser.id,
      targetName: newUser.name,
      status: 'accepted',
      createdAt: Date.now()
    };

    this.connections.unshift(newConn);
    this.saveConnections();
    setDoc(doc(db, 'partner_connections', newConn.id), cleanForFirestore(newConn)).catch(console.warn);

    // Notify both users
    notificationService.addNotification({
      type: 'friend_invite',
      title: '🤝 ¡Nuevo Partner Conectado!',
      body: `Te has conectado como partner con ${inviterName || 'tu amigo'}. Ahora pueden ver sus estadísticas y programar partidos juntos.`
    });

    return true;
  }

  // --- Posts & Feed ---

  public getFeedPosts(): PartnerPost[] {
    return [...this.posts].sort((a, b) => b.timestamp - a.timestamp);
  }

  public createPost(
    author: UserSession, 
    content: string, 
    options?: {
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
    }
  ): PartnerPost {
    const newPost: PartnerPost = {
      id: 'post-' + Date.now().toString(36),
      authorId: author.id,
      authorName: author.name,
      authorCategory: author.category,
      authorAvatar: author.avatar,
      authorClub: author.club,
      timestamp: Date.now(),
      content: content.trim(),
      type: options?.type || (options?.matchSnippet ? 'match_result' : 'user_update'),
      matchSnippet: options?.matchSnippet,
      b2bMeta: options?.b2bMeta,
      clapsCount: 0,
      hasClapped: false,
      reactions: [],
      comments: []
    };

    this.posts.unshift(newPost);
    this.savePosts();

    // Push to Cloud Firestore
    setDoc(doc(db, 'partner_posts', newPost.id), cleanForFirestore(newPost)).catch(console.warn);

    return newPost;
  }

  public toggleReaction(postId: string, user: UserSession, reactionType: 'clap' | 'fire' | 'trophy' | 'muscle') {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.reactions) post.reactions = [];

    const existingIdx = post.reactions.findIndex(r => r.userId === user.id);
    if (existingIdx >= 0) {
      if (post.reactions[existingIdx].type === reactionType) {
        // Toggle off
        post.reactions.splice(existingIdx, 1);
        post.userReaction = undefined;
        if (reactionType === 'clap') {
          post.clapsCount = Math.max(0, post.clapsCount - 1);
          post.hasClapped = false;
        }
      } else {
        // Change reaction type
        post.reactions[existingIdx].type = reactionType;
        post.userReaction = reactionType;
      }
    } else {
      // Add new reaction
      post.reactions.push({
        userId: user.id,
        userName: user.name,
        type: reactionType,
        timestamp: Date.now()
      });
      post.userReaction = reactionType;
      if (reactionType === 'clap') {
        post.clapsCount = (post.clapsCount || 0) + 1;
        post.hasClapped = true;
      }
    }

    this.savePosts();
    setDoc(doc(db, 'partner_posts', post.id), cleanForFirestore(post), { merge: true }).catch(console.warn);
  }

  public toggleClap(postId: string) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (post.hasClapped) {
      post.clapsCount = Math.max(0, post.clapsCount - 1);
      post.hasClapped = false;
      post.userReaction = undefined;
    } else {
      post.clapsCount = (post.clapsCount || 0) + 1;
      post.hasClapped = true;
      post.userReaction = 'clap';
    }
    this.savePosts();

    // Push to Cloud Firestore
    setDoc(doc(db, 'partner_posts', post.id), cleanForFirestore(post), { merge: true }).catch(console.warn);
  }

  public deletePost(postId: string, userId: string, isAdmin?: boolean): boolean {
    const idx = this.posts.findIndex(p => p.id === postId);
    if (idx < 0) return false;

    const post = this.posts[idx];
    if (post.authorId !== userId && !isAdmin) return false;

    this.posts.splice(idx, 1);
    this.savePosts();
    return true;
  }

  public addComment(postId: string, author: UserSession, content: string) {
    const post = this.posts.find(p => p.id === postId);
    if (!post || !content.trim()) return;

    const comment: PartnerComment = {
      id: 'c-' + Date.now().toString(36),
      authorId: author.id,
      authorName: author.name,
      content: content.trim(),
      timestamp: Date.now()
    };

    post.comments.push(comment);
    this.savePosts();

    // Push to Cloud Firestore
    setDoc(doc(db, 'partner_posts', post.id), cleanForFirestore(post), { merge: true }).catch(console.warn);
  }

  // --- Clubs & Campaigns ---

  public getClubCampaigns(): ClubCampaign[] {
    return [];
  }

  // --- Padel News ---

  public getPadelNews(): PadelNewsItem[] {
    return [
      {
        id: 'news-1',
        title: 'Premier Padel anuncia nuevo calendario y fechas para Sudamérica',
        summary: 'El circuito profesional confirmó las sedes del tour internacional con paradas clave en Chile y Argentina.',
        category: 'circuito',
        timestamp: Date.now() - 3600000 * 4,
        readTimeMinutes: 3,
        source: 'Padel Magazine'
      },
      {
        id: 'news-2',
        title: 'Táctica Pro: La bandeja flotada vs el remate por 3',
        summary: 'Aprende a elegir el golpe aéreo según la profundidad de la bola y la posición de tus rivales en la red.',
        category: 'tactica',
        timestamp: Date.now() - 3600000 * 18,
        readTimeMinutes: 4,
        source: 'Entrenadores FIP'
      },
      {
        id: 'news-3',
        title: 'Análisis de palas 2026: Rugosidad 3D y balance medio',
        summary: 'Las nuevas tecnologías de carbono y goma EVA blanda dominan los lanzamientos de la temporada.',
        category: 'equipamiento',
        timestamp: Date.now() - 3600000 * 36,
        readTimeMinutes: 2,
        source: 'Padel Review'
      }
    ];
  }
}

export const partnerService = new PartnerService();
