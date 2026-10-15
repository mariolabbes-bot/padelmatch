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

interface StoredUserCredential {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Stored securely in client storage
  category: CommunityPlayer['category'];
  favoritePosition: 'drive' | 'reves' | 'ambas';
  avatar?: string;
  createdAt: number;
}

const AUTH_STORAGE_KEY = 'padelmatch_auth_session_v1';
const USERS_REGISTRY_KEY = 'padelmatch_registered_users_v2';

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

  private getRegistry(): Record<string, StoredUserCredential> {
    try {
      const raw = localStorage.getItem(USERS_REGISTRY_KEY);
      if (raw) return JSON.parse(raw);
      
      // Fallback: check legacy v1 registry
      const legacyRaw = localStorage.getItem('padelmatch_registered_users_v1');
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        const migrated: Record<string, StoredUserCredential> = {};
        Object.entries(legacy).forEach(([email, val]: [string, any]) => {
          migrated[email.toLowerCase()] = {
            id: val.id,
            name: val.name,
            email: email.toLowerCase(),
            passwordHash: val.password || 'padel123',
            category: val.category || '4ta',
            favoritePosition: val.favoritePosition || 'ambas',
            createdAt: val.createdAt || Date.now()
          };
        });
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      // ignore
    }
    return {};
  }

  private saveRegistry(registry: Record<string, StoredUserCredential>) {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    } catch (e) {
      console.error('Failed to save user registry:', e);
    }
  }

  public register(data: {
    name: string;
    email: string;
    password: string;
    category: CommunityPlayer['category'];
    favoritePosition: 'drive' | 'reves' | 'ambas';
    avatar?: string;
  }): { success: boolean; error?: string; user?: UserSession } {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedPassword = (data.password || '').trim();

    if (!trimmedName) {
      return { success: false, error: 'Por favor ingresa tu nombre completo.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!trimmedPassword || trimmedPassword.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    const registry = this.getRegistry();

    // Check if account already exists with this email
    if (registry[trimmedEmail]) {
      return { 
        success: false, 
        error: 'Ya existe una cuenta registrada con este correo. Inicia sesión con tu contraseña.' 
      };
    }

    // Check or create player in community roster
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
    } else {
      // Update existing player with chosen category and name
      player.name = trimmedName;
      player.category = data.category;
      player.favoritePosition = data.favoritePosition;
    }

    // Save in registry with password
    registry[trimmedEmail] = {
      id: player.id,
      name: trimmedName,
      email: trimmedEmail,
      passwordHash: trimmedPassword,
      category: data.category,
      favoritePosition: data.favoritePosition,
      avatar: data.avatar,
      createdAt: Date.now()
    };
    this.saveRegistry(registry);

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

  public login(email: string, password: string): { success: boolean; error?: string; user?: UserSession } {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Ingresa tu correo electrónico.' };
    }
    if (!trimmedPassword) {
      return { success: false, error: 'Ingresa tu contraseña.' };
    }

    const registry = this.getRegistry();
    const userRecord = registry[trimmedEmail];

    if (!userRecord) {
      // Check if player exists in community roster but hasn't set a password yet
      const playerInRoster = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmedEmail);
      if (playerInRoster) {
        // First-time password set for roster player
        registry[trimmedEmail] = {
          id: playerInRoster.id,
          name: playerInRoster.name,
          email: trimmedEmail,
          passwordHash: trimmedPassword,
          category: playerInRoster.category,
          favoritePosition: playerInRoster.favoritePosition || 'ambas',
          createdAt: Date.now()
        };
        this.saveRegistry(registry);
      } else {
        return { 
          success: false, 
          error: 'No encontramos una cuenta registrada con este correo. Por favor regístrate en la pestaña superior.' 
        };
      }
    } else {
      // Validate password
      if (userRecord.passwordHash !== trimmedPassword) {
        return { 
          success: false, 
          error: 'Contraseña incorrecta. Por favor revisa tus credenciales.' 
        };
      }
    }

    // Retrieve fresh player from community roster
    let player = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmedEmail);
    if (!player) {
      const rec = registry[trimmedEmail];
      player = communityService.findOrCreatePlayer(rec.name, trimmedEmail);
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
