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

const CONNECTIONS_KEY = 'padelmatch_partner_connections_v1';
const POSTS_KEY = 'padelmatch_partner_posts_v1';

class PartnerService {
  private connections: PartnerConnection[] = [];
  private posts: PartnerPost[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.seedInitialData();
      return;
    }
    try {
      const rawConn = localStorage.getItem(CONNECTIONS_KEY);
      if (rawConn) {
        this.connections = JSON.parse(rawConn);
      } else {
        this.seedInitialConnections();
      }

      const rawPosts = localStorage.getItem(POSTS_KEY);
      if (rawPosts) {
        this.posts = JSON.parse(rawPosts);
      } else {
        this.seedInitialPosts();
      }
    } catch {
      this.seedInitialData();
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

  private seedInitialData() {
    this.seedInitialConnections();
    this.seedInitialPosts();
  }

  private seedInitialConnections() {
    // Pre-seed Mario Labbé with Fernando González and Rodrigo Valenzuela as accepted partners
    // and Matías Silva with a pending request to Mario
    this.connections = [
      {
        id: 'conn-1',
        requesterId: 'founder-mario-labbe',
        requesterName: 'Mario Labbé',
        requesterCategory: '4ta',
        requesterElo: 1400,
        targetId: 'player-fernando',
        targetName: 'Fernando González',
        status: 'accepted',
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: 'conn-2',
        requesterId: 'founder-mario-labbe',
        requesterName: 'Mario Labbé',
        requesterCategory: '4ta',
        requesterElo: 1400,
        targetId: 'player-rodrigo',
        targetName: 'Rodrigo Valenzuela',
        status: 'accepted',
        createdAt: Date.now() - 86400000 * 5
      },
      {
        id: 'conn-3',
        requesterId: 'player-matias',
        requesterName: 'Matías Silva',
        requesterCategory: '4ta',
        requesterElo: 1380,
        targetId: 'founder-mario-labbe',
        targetName: 'Mario Labbé',
        status: 'pending',
        createdAt: Date.now() - 3600000 * 2 // 2 hours ago
      }
    ];
    this.saveConnections();
  }

  private seedInitialPosts() {
    this.posts = [
      {
        id: 'post-1',
        authorId: 'player-fernando',
        authorName: 'Fernando González',
        authorCategory: '4ta',
        timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
        content: '¡Tremendo partido anoche en Club Padel Oriente! Sacamos adelante el 3er set con punto de oro. ¡Gran nivel de juego!',
        matchSnippet: {
          courtName: 'Club Padel Oriente • Pista 3',
          scoreSets: '6-4 | 4-6 | 7-6 (Punto de Oro)',
          isVictory: true
        },
        clapsCount: 6,
        hasClapped: false,
        comments: [
          {
            id: 'c-1',
            authorId: 'player-rodrigo',
            authorName: 'Rodrigo Valenzuela',
            content: '¡Ese punto de oro estuvo infartante! Hay que repetirlo la próxima semana 🎾🔥',
            timestamp: Date.now() - 1000 * 60 * 20
          }
        ]
      },
      {
        id: 'post-2',
        authorId: 'player-matias',
        authorName: 'Matías Silva',
        authorCategory: '4ta',
        timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
        content: '¿Alguien disponible para un americano este sábado a las 10:00 en Padel City? Nos falta 1 para armar la cuadratura perfecta.',
        clapsCount: 4,
        hasClapped: true,
        comments: [
          {
            id: 'c-2',
            authorId: 'player-ignacio',
            authorName: 'Ignacio Morales',
            content: 'Yo me anoto de revés si confirmamos antes de las 18:00 🙌',
            timestamp: Date.now() - 1000 * 60 * 90
          }
        ]
      },
      {
        id: 'post-3',
        authorId: 'player-rodrigo',
        authorName: 'Rodrigo Valenzuela',
        authorCategory: '4ta',
        timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
        content: 'Estrenando pala nueva hoy. Notable la diferencia de control en las salidas de pared. Listo para el próximo desafío.',
        clapsCount: 9,
        hasClapped: false,
        comments: []
      }
    ];
    this.savePosts();
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

    if (accept) {
      notificationService.addNotification({
        type: 'friend_invite',
        title: '¡Partner Conectado!',
        body: `Ahora estás conectado con ${conn.requesterName}. Pueden ver sus partidos, estadísticas y comentarios.`
      });
    }
  }

  // --- Posts & Feed ---

  public getFeedPosts(): PartnerPost[] {
    return [...this.posts].sort((a, b) => b.timestamp - a.timestamp);
  }

  public createPost(author: UserSession, content: string): PartnerPost {
    const newPost: PartnerPost = {
      id: 'post-' + Date.now().toString(36),
      authorId: author.id,
      authorName: author.name,
      authorCategory: author.category,
      timestamp: Date.now(),
      content: content.trim(),
      clapsCount: 0,
      hasClapped: false,
      comments: []
    };

    this.posts.unshift(newPost);
    this.savePosts();
    return newPost;
  }

  public toggleClap(postId: string) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (post.hasClapped) {
      post.clapsCount = Math.max(0, post.clapsCount - 1);
      post.hasClapped = false;
    } else {
      post.clapsCount += 1;
      post.hasClapped = true;
    }
    this.savePosts();
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
  }

  // --- Clubs & Campaigns ---

  public getClubCampaigns(): ClubCampaign[] {
    return [
      {
        id: 'camp-1',
        clubName: 'Club Padel Oriente',
        clubCity: 'Santiago',
        title: '25% OFF Horario Valle',
        description: 'Pistas panorámicas techadas con descuento de Lunes a Viernes de 10:00 a 16:00 hrs.',
        discountLabel: '25% OFF',
        validUntil: 'Válido todo Octubre',
        tag: 'oferta',
        contactPhone: '+56987654321'
      },
      {
        id: 'camp-2',
        clubName: 'Padel City Santiago',
        clubCity: 'Santiago',
        title: 'Torneo Americano 4ª & 5ª Cat',
        description: 'Sábado 15:30 hrs. Premios en equipamiento Nox & Bullpadel. Inscripciones abiertas.',
        discountLabel: 'TORNEO',
        validUntil: 'Cierre Jueves 20:00',
        tag: 'torneo',
        contactPhone: '+56911223344'
      },
      {
        id: 'camp-3',
        clubName: 'Club Deportivo Padel Pro',
        clubCity: 'Viña del Mar',
        title: 'Clínica de Saque y Volea con Pro',
        description: 'Mejora tu juego ofensivo y salida de pared. Cupos limitados a 8 jugadores.',
        discountLabel: 'CLÍNICA',
        validUntil: 'Domingo 11:00',
        tag: 'clinica',
        contactPhone: '+56955667788'
      }
    ];
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
