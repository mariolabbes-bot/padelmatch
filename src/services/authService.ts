import type { CommunityPlayer } from '../types/padel';
import { communityService } from './communityService';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  category: CommunityPlayer['category'];
  favoritePosition: 'drive' | 'reves' | 'ambas';
  avatar?: string;
  elo: number;
  loggedInAt: number;
}

const AUTH_STORAGE_KEY = 'padelmatch_auth_session_v1';
const USERS_REGISTRY_KEY = 'padelmatch_registered_users_v1';

class AuthService {
  private currentUser: UserSession | null = null;
  private listeners: Set<(user: UserSession | null) => void> = new Set();

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        this.currentUser = JSON.parse(raw);
        // Sync with communityService in case ELO updated
        if (this.currentUser) {
          const fresh = communityService.searchPlayer(this.currentUser.name).find(p => p.id === this.currentUser?.id);
          if (fresh) {
            this.currentUser.elo = fresh.elo;
            this.currentUser.category = fresh.category;
          }
        }
      }
    } catch {
      this.currentUser = null;
    }
  }

  public getCurrentUser(): UserSession | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public subscribe(listener: (user: UserSession | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  public register(data: {
    name: string;
    email: string;
    password?: string;
    category: CommunityPlayer['category'];
    favoritePosition: 'drive' | 'reves' | 'ambas';
    avatar?: string;
  }): { success: boolean; error?: string; user?: UserSession } {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Por favor ingresa tu nombre completo.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
    }

    // Check if player already exists in community roster
    let player = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmedEmail);
    if (!player) {
      player = communityService.addPlayer({
        name: trimmedName,
        email: trimmedEmail,
        category: data.category,
        favoritePosition: data.favoritePosition,
        avatar: data.avatar,
        elo: this.getDefaultEloForCategory(data.category)
      });
    }

    // Save user credentials in local registry
    try {
      const rawUsers = localStorage.getItem(USERS_REGISTRY_KEY);
      const registry: Record<string, any> = rawUsers ? JSON.parse(rawUsers) : {};
      registry[trimmedEmail] = {
        id: player.id,
        name: trimmedName,
        email: trimmedEmail,
        password: data.password || 'padel123',
        category: data.category,
        favoritePosition: data.favoritePosition,
        createdAt: Date.now()
      };
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    } catch (e) {
      console.warn('Could not save user in registry', e);
    }

    const session: UserSession = {
      id: player.id,
      name: player.name,
      email: trimmedEmail,
      category: player.category,
      favoritePosition: player.favoritePosition || 'ambas',
      avatar: player.avatar,
      elo: player.elo,
      loggedInAt: Date.now()
    };

    this.saveSession(session);
    return { success: true, user: session };
  }

  public login(email: string, _password?: string): { success: boolean; error?: string; user?: UserSession } {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return { success: false, error: 'Ingresa tu correo registrado.' };
    }

    // Check local registry or community roster
    let player = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmedEmail);

    if (!player) {
      // Check if user is registered by name match
      player = communityService.getPlayers().find(p => p.name.toLowerCase() === trimmedEmail);
    }

    if (!player) {
      return { 
        success: false, 
        error: 'No encontramos una cuenta con ese correo. Puedes registrarte en la pestaña superior.' 
      };
    }

    const session: UserSession = {
      id: player.id,
      name: player.name,
      email: player.email || trimmedEmail,
      category: player.category,
      favoritePosition: player.favoritePosition || 'ambas',
      avatar: player.avatar,
      elo: player.elo,
      loggedInAt: Date.now()
    };

    this.saveSession(session);
    return { success: true, user: session };
  }

  public logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notify();
  }

  private saveSession(session: UserSession) {
    this.currentUser = session;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Error saving session', e);
    }
    this.notify();
  }

  private getDefaultEloForCategory(cat: CommunityPlayer['category']): number {
    switch (cat) {
      case '1ra': return 1900;
      case '2da': return 1700;
      case '3ra': return 1500;
      case '4ta': return 1300;
      case '5ta': return 1100;
      case '6ta': return 950;
      case '7ma': return 800;
      default: return 1200;
    }
  }
}

export const authService = new AuthService();
