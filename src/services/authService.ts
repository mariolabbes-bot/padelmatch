import type { CommunityPlayer, DominantHand, UserPlan, SubscriptionTier, UserPrivacySettings } from '../types/padel';
import { DEFAULT_USER_PRIVACY } from '../types/padel';
import { communityService } from './communityService';
import { DEFAULT_INITIAL_ELO } from '../engine/eloEngine';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';
import { referralService } from './referralService';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: CommunityPlayer['category'];
  favoritePosition: 'drive' | 'reves' | 'ambas';
  dominantHand?: DominantHand;
  city?: string;
  club?: string;
  plan?: UserPlan;
  subscriptionExpiresAt?: number;
  hostedMatchesCount?: number;
  avatar?: string;
  elo: number;
  loggedInAt: number;
  privacy?: UserPrivacySettings;
  invitedBy?: {
    userId: string;
    userName?: string;
    at: number;
    source?: string;
  };
}

export interface StoredUserCredential {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  category: CommunityPlayer['category'];
  favoritePosition: 'drive' | 'reves' | 'ambas';
  dominantHand?: DominantHand;
  city?: string;
  club?: string;
  plan?: UserPlan;
  subscriptionExpiresAt?: number;
  hostedMatchesCount?: number;
  avatar?: string;
  privacy?: UserPrivacySettings;
  createdAt: number;
  invitedBy?: {
    userId: string;
    userName?: string;
    at: number;
    source?: string;
  };
}

const AUTH_STORAGE_KEY = 'padelmatch_auth_session_v3';
const USERS_REGISTRY_KEY = 'padelmatch_registered_users_v3';

class AuthService {
  private currentUser: UserSession | null = null;
  private listeners: Set<(user: UserSession | null) => void> = new Set();

  constructor() {
    this.cleanupLegacyStorage();
    this.restoreSession();
    this.initFirestoreSync();
    this.initCommunitySync();
  }

  private cleanupLegacyStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem('padelmatch_auth_session_v1');
      localStorage.removeItem('padelmatch_auth_session_v2');
      localStorage.removeItem('padelmatch_registered_users_v1');
      localStorage.removeItem('padelmatch_registered_users_v2');
    } catch {
      // ignore
    }
  }

  private restoreSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        this.currentUser = JSON.parse(raw);
        if (this.currentUser) {
          const freshPlayer = communityService.getPlayers().find(
            p => p.id === this.currentUser?.id || p.email?.toLowerCase() === this.currentUser?.email.toLowerCase()
          );
          if (freshPlayer) {
            this.currentUser.elo = freshPlayer.elo;
            this.currentUser.category = freshPlayer.category;
            this.currentUser.phone = freshPlayer.phone;
            this.currentUser.dominantHand = freshPlayer.dominantHand;
            this.currentUser.city = freshPlayer.city;
            this.currentUser.club = freshPlayer.club;
            this.currentUser.plan = freshPlayer.plan;
            if (freshPlayer.avatar) {
              this.currentUser.avatar = freshPlayer.avatar;
            }
          }

          // Check registry for cloud-synced avatar
          const registry = this.getRegistry();
          const freshUser = registry[this.currentUser.email.toLowerCase()];
          if (freshUser && freshUser.avatar && freshUser.avatar !== this.currentUser.avatar) {
            this.currentUser.avatar = freshUser.avatar;
            this.saveSession(this.currentUser);
          }
        }
      }
    } catch {
      this.currentUser = null;
    }
  }

  private initCommunitySync() {
    try {
      communityService.subscribe(() => {
        if (this.currentUser) {
          const player = communityService.getPlayers().find(
            p => p.id === this.currentUser?.id || p.email?.toLowerCase() === this.currentUser?.email.toLowerCase()
          );
          if (player) {
            let updated = false;
            if (player.avatar && player.avatar !== this.currentUser.avatar) {
              this.currentUser.avatar = player.avatar;
              updated = true;
            }
            if (player.elo && player.elo !== this.currentUser.elo) {
              this.currentUser.elo = player.elo;
              updated = true;
            }
            if (player.category && player.category !== this.currentUser.category) {
              this.currentUser.category = player.category;
              updated = true;
            }
            if (player.name && player.name !== this.currentUser.name) {
              this.currentUser.name = player.name;
              updated = true;
            }
            if (updated) {
              this.saveSession(this.currentUser);
              this.notify();
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error subscribing auth to community updates:', e);
    }
  }

  private initFirestoreSync() {
    try {
      onSnapshot(collection(db, 'users'), (snapshot) => {
        const registry = this.getRegistry();
        let changed = false;
        snapshot.forEach(docSnap => {
          const u = docSnap.data() as StoredUserCredential;
          const emailKey = (u?.email || docSnap.id).toLowerCase();
          if (emailKey && emailKey.includes('@')) {
            registry[emailKey] = {
              ...registry[emailKey],
              ...u,
              email: emailKey
            };
            changed = true;
          }
        });

        if (changed) {
          this.saveRegistry(registry);
          if (this.currentUser && this.currentUser.email) {
            const currentEmail = this.currentUser.email.toLowerCase();
            const fresh = registry[currentEmail];
            if (fresh) {
              const prevAvatar = this.currentUser.avatar;
              this.currentUser = {
                ...this.currentUser,
                name: fresh.name || this.currentUser.name,
                phone: fresh.phone || this.currentUser.phone,
                favoritePosition: fresh.favoritePosition || this.currentUser.favoritePosition,
                dominantHand: fresh.dominantHand || this.currentUser.dominantHand,
                category: fresh.category || this.currentUser.category,
                city: fresh.city || this.currentUser.city,
                club: fresh.club || this.currentUser.club,
                avatar: fresh.avatar !== undefined ? fresh.avatar : this.currentUser.avatar,
                plan: fresh.plan || this.currentUser.plan || 'free',
                subscriptionExpiresAt: fresh.subscriptionExpiresAt || this.currentUser.subscriptionExpiresAt,
                hostedMatchesCount: fresh.hostedMatchesCount ?? this.currentUser.hostedMatchesCount
              };
              this.saveSession(this.currentUser);
              this.notify();

              // Also ensure local community player has avatar
              if (fresh.avatar && fresh.avatar !== prevAvatar) {
                const player = communityService.getPlayers().find(
                  p => p.id === this.currentUser?.id || p.email?.toLowerCase() === currentEmail
                );
                if (player && player.avatar !== fresh.avatar) {
                  player.avatar = fresh.avatar;
                  communityService.updatePlayer(player);
                }
              }
            }
          }
        }
      }, (err) => {
        console.warn('Firestore users sync notice:', err);
      });
    } catch (e) {
      console.warn('Error starting Firestore users listener:', e);
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
    let registry: Record<string, StoredUserCredential> = {};
    try {
      const raw = localStorage.getItem(USERS_REGISTRY_KEY);
      if (raw) {
        registry = JSON.parse(raw);
      }
    } catch {
      registry = {};
    }

    // MANDATORY SEED: Ensure Mario Labbé (Founder) is ALWAYS present in registry with clean stats
    if (!registry['mariolabbes@gmail.com']) {
      registry['mariolabbes@gmail.com'] = {
        id: 'founder-mario-labbe',
        name: 'Mario Labbé',
        email: 'mariolabbes@gmail.com',
        phone: '+56912345678',
        passwordHash: 'padel123',
        category: '4ta',
        favoritePosition: 'drive',
        dominantHand: 'diestro',
        city: 'Santiago',
        club: undefined,
        plan: 'pro_founder',
        createdAt: 1700000000000,
        hostedMatchesCount: 0
      };
      this.saveRegistry(registry);
      setDoc(doc(db, 'users', 'mariolabbes@gmail.com'), cleanForFirestore(registry['mariolabbes@gmail.com']), { merge: true }).catch(console.warn);
    }

    return registry;
  }

  private saveRegistry(registry: Record<string, StoredUserCredential>) {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    } catch (e) {
      console.error('Failed to save user registry:', e);
    }
  }

  public async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    category: CommunityPlayer['category'];
    favoritePosition: 'drive' | 'reves' | 'ambas';
    dominantHand?: DominantHand;
    city?: string;
    club?: string;
    avatar?: string;
    invitedBy?: {
      id: string;
      name?: string;
      source?: 'whatsapp_partner' | 'whatsapp_match' | 'direct_invite';
    };
  }): Promise<{ success: boolean; error?: string; user?: UserSession }> {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedPhone = data.phone ? data.phone.trim() : undefined;
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
        phone: trimmedPhone,
        category: data.category,
        favoritePosition: data.favoritePosition,
        dominantHand: data.dominantHand || 'diestro',
        city: data.city,
        club: data.club,
        avatar: data.avatar,
        elo: DEFAULT_INITIAL_ELO
      });
    } else {
      player.name = trimmedName;
      player.category = data.category;
      player.favoritePosition = data.favoritePosition;
      if (trimmedPhone) player.phone = trimmedPhone;
      if (data.dominantHand) player.dominantHand = data.dominantHand;
      if (data.city) player.city = data.city;
      if (data.club) player.club = data.club;
    }

    const invitedByInfo = data.invitedBy?.id ? {
      userId: data.invitedBy.id,
      userName: data.invitedBy.name,
      at: Date.now(),
      source: data.invitedBy.source || 'whatsapp_partner'
    } : undefined;

    const newRecord: StoredUserCredential = {
      id: player.id,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      passwordHash: trimmedPassword,
      category: data.category,
      favoritePosition: data.favoritePosition,
      dominantHand: data.dominantHand || 'diestro',
      city: data.city,
      club: data.club,
      avatar: data.avatar,
      plan: 'free',
      hostedMatchesCount: 0,
      createdAt: Date.now(),
      invitedBy: invitedByInfo
    };

    // Save in registry with password
    registry[trimmedEmail] = newRecord;
    this.saveRegistry(registry);

    // Sync to Cloud Firestore
    try {
      await setDoc(doc(db, 'users', trimmedEmail), cleanForFirestore(newRecord));
    } catch (e) {
      console.warn('Could not save user to Firestore directly:', e);
    }

    const session: UserSession = {
      id: player.id,
      name: player.name,
      email: trimmedEmail,
      phone: player.phone,
      category: player.category,
      favoritePosition: player.favoritePosition || 'ambas',
      dominantHand: player.dominantHand,
      city: player.city,
      club: player.club,
      plan: player.plan || 'free',
      hostedMatchesCount: 0,
      avatar: player.avatar,
      elo: player.elo,
      loggedInAt: Date.now(),
      invitedBy: invitedByInfo
    };

    // Record referral attribution
    if (data.invitedBy?.id && data.invitedBy.id !== player.id) {
      try {
        referralService.recordReferral({
          inviterId: data.invitedBy.id,
          inviterName: data.invitedBy.name || 'Partner',
          referredUserId: player.id,
          referredUserName: trimmedName,
          referredUserEmail: trimmedEmail,
          referredUserPhone: trimmedPhone,
          source: data.invitedBy.source || 'whatsapp_partner'
        });
      } catch (err) {
        console.warn('Could not record referral attribution:', err);
      }
    }

    this.saveSession(session);
    return { success: true, user: session };
  }

  public async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Ingresa tu correo electrónico.' };
    }
    if (!trimmedPassword) {
      return { success: false, error: 'Ingresa tu contraseña.' };
    }

    const registry = this.getRegistry();
    let userRecord = registry[trimmedEmail];

    // If not in local cache, fetch from Cloud Firestore directly
    if (!userRecord) {
      try {
        const snap = await getDoc(doc(db, 'users', trimmedEmail));
        if (snap.exists()) {
          userRecord = snap.data() as StoredUserCredential;
          registry[trimmedEmail] = userRecord;
          this.saveRegistry(registry);
        }
      } catch (e) {
        console.warn('Could not fetch user from Firestore', e);
      }
    }

    // Master Founder Access for Mario Labbé: Always accept & sync password so he is never locked out
    if (trimmedEmail === 'mariolabbes@gmail.com') {
      if (!userRecord) {
        userRecord = {
          id: 'founder-mario-labbe',
          name: 'Mario Labbé',
          email: 'mariolabbes@gmail.com',
          phone: '+56912345678',
          passwordHash: trimmedPassword,
          category: '4ta',
          favoritePosition: 'drive',
          dominantHand: 'diestro',
          city: 'Santiago',
          club: undefined,
          plan: 'pro_founder',
          createdAt: 1700000000000,
          hostedMatchesCount: 0
        };
        registry[trimmedEmail] = userRecord;
        this.saveRegistry(registry);
      } else if (userRecord.passwordHash !== trimmedPassword) {
        userRecord.passwordHash = trimmedPassword;
        this.saveRegistry(registry);
      }
      // Guarantee cloud sync
      setDoc(doc(db, 'users', trimmedEmail), cleanForFirestore(userRecord), { merge: true }).catch(console.warn);
    } else {
      if (!userRecord) {
        // Check if player exists in community roster
        const playerInRoster = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmedEmail);
        if (playerInRoster) {
          userRecord = {
            id: playerInRoster.id,
            name: playerInRoster.name,
            email: trimmedEmail,
            phone: playerInRoster.phone,
            passwordHash: trimmedPassword,
            category: playerInRoster.category,
            favoritePosition: playerInRoster.favoritePosition || 'ambas',
            dominantHand: playerInRoster.dominantHand,
            city: playerInRoster.city,
            club: playerInRoster.club,
            plan: playerInRoster.plan || 'free',
            createdAt: Date.now(),
            hostedMatchesCount: 0
          };
          registry[trimmedEmail] = userRecord;
          this.saveRegistry(registry);
          setDoc(doc(db, 'users', trimmedEmail), cleanForFirestore(userRecord)).catch(console.warn);
        } else {
          return { 
            success: false, 
            error: 'No encontramos una cuenta registrada con este correo en la nube. Por favor regístrate o pulsa restablecer.' 
          };
        }
      } else {
        // Validate password
        if (userRecord.passwordHash !== trimmedPassword) {
          return { 
            success: false, 
            error: 'Contraseña incorrecta. Puedes restablecerla abajo con 1 clic.' 
          };
        }
      }
    }

    // Retrieve fresh player from community roster
    let player = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmedEmail);
    if (!player) {
      player = communityService.findOrCreatePlayer(userRecord.name, trimmedEmail, userRecord.phone);
    }

    const session: UserSession = {
      id: player.id,
      name: player.name,
      email: player.email || trimmedEmail,
      phone: player.phone || userRecord?.phone,
      category: player.category,
      favoritePosition: player.favoritePosition || 'ambas',
      dominantHand: player.dominantHand || userRecord?.dominantHand,
      city: player.city || userRecord?.city,
      club: player.club || userRecord?.club,
      plan: userRecord?.plan || player.plan || 'free',
      subscriptionExpiresAt: userRecord?.subscriptionExpiresAt || player.subscriptionExpiresAt,
      hostedMatchesCount: userRecord?.hostedMatchesCount || 0,
      avatar: player.avatar,
      elo: player.elo,
      loggedInAt: Date.now()
    };

    this.saveSession(session);
    return { success: true, user: session };
  }

  public async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = (newPassword || '').trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Ingresa tu correo electrónico.' };
    }
    if (!trimmedPassword || trimmedPassword.length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    const registry = this.getRegistry();
    let userRecord = registry[trimmedEmail];

    if (!userRecord) {
      // Auto-register player on the fly
      const fallbackName = trimmedEmail.includes('mario') ? 'Mario Labbé' : trimmedEmail.split('@')[0];
      return this.register({
        name: fallbackName,
        email: trimmedEmail,
        password: trimmedPassword,
        category: '4ta',
        favoritePosition: 'drive',
        dominantHand: 'diestro'
      });
    }

    userRecord.passwordHash = trimmedPassword;
    this.saveRegistry(registry);
    setDoc(doc(db, 'users', trimmedEmail), { passwordHash: trimmedPassword }, { merge: true }).catch(console.warn);

    return this.login(trimmedEmail, trimmedPassword);
  }

  public async updateProfile(data: {
    name?: string;
    phone?: string;
    favoritePosition?: 'drive' | 'reves' | 'ambas';
    dominantHand?: DominantHand;
    category?: CommunityPlayer['category'];
    city?: string;
    club?: string;
    avatar?: string;
    privacy?: UserPrivacySettings;
  }): Promise<{ success: boolean; error?: string; user?: UserSession }> {
    if (!this.currentUser) {
      return { success: false, error: 'No hay sesión de usuario activa.' };
    }

    const trimmedName = data.name ? data.name.trim() : this.currentUser.name;
    const trimmedPhone = data.phone !== undefined ? data.phone.trim() : this.currentUser.phone;

    // Update in-memory session
    this.currentUser = {
      ...this.currentUser,
      name: trimmedName,
      phone: trimmedPhone,
      favoritePosition: data.favoritePosition || this.currentUser.favoritePosition,
      dominantHand: data.dominantHand || this.currentUser.dominantHand,
      category: data.category || this.currentUser.category,
      city: data.city !== undefined ? data.city : this.currentUser.city,
      club: data.club !== undefined ? data.club : this.currentUser.club,
      avatar: data.avatar || this.currentUser.avatar,
      privacy: data.privacy ? { ...(this.currentUser.privacy || DEFAULT_USER_PRIVACY), ...data.privacy } : this.currentUser.privacy
    };

    // Update in registry
    const registry = this.getRegistry();
    const userEmail = this.currentUser.email.toLowerCase();
    if (registry[userEmail]) {
      registry[userEmail] = {
        ...registry[userEmail],
        name: this.currentUser.name,
        phone: this.currentUser.phone,
        favoritePosition: this.currentUser.favoritePosition,
        dominantHand: this.currentUser.dominantHand,
        category: this.currentUser.category,
        city: this.currentUser.city,
        club: this.currentUser.club,
        avatar: this.currentUser.avatar,
        privacy: this.currentUser.privacy
      };
      this.saveRegistry(registry);
    }

    // Save session locally
    this.saveSession(this.currentUser);

    // Sync to Firestore users collection
    setDoc(doc(db, 'users', userEmail), cleanForFirestore({
      id: this.currentUser.id,
      name: this.currentUser.name,
      email: userEmail,
      phone: this.currentUser.phone,
      favoritePosition: this.currentUser.favoritePosition,
      dominantHand: this.currentUser.dominantHand,
      category: this.currentUser.category,
      city: this.currentUser.city,
      club: this.currentUser.club,
      avatar: this.currentUser.avatar,
      plan: this.currentUser.plan,
      privacy: this.currentUser.privacy
    }), { merge: true }).catch(console.warn);

    // Sync to communityService player
    const player = communityService.getPlayers().find(p => p.id === this.currentUser?.id || p.email?.toLowerCase() === userEmail);
    if (player) {
      player.name = this.currentUser.name;
      player.favoritePosition = this.currentUser.favoritePosition;
      player.dominantHand = this.currentUser.dominantHand;
      player.category = this.currentUser.category;
      player.phone = this.currentUser.phone;
      player.city = this.currentUser.city;
      player.club = this.currentUser.club;
      player.avatar = this.currentUser.avatar;
      communityService.updatePlayer(player);
    } else {
      communityService.updatePlayer({
        id: this.currentUser.id,
        name: this.currentUser.name,
        email: userEmail,
        category: this.currentUser.category,
        elo: this.currentUser.elo || 1200,
        matchesPlayed: 0,
        matchesWon: 0,
        winStreak: 0,
        avatar: this.currentUser.avatar,
        phone: this.currentUser.phone,
        city: this.currentUser.city,
        club: this.currentUser.club,
        favoritePosition: this.currentUser.favoritePosition,
        dominantHand: this.currentUser.dominantHand,
        plan: this.currentUser.plan
      });
    }

    this.notify();

    return { success: true, user: this.currentUser };
  }

  public async updatePrivacySettings(
    settings: Partial<UserPrivacySettings>,
    targetUser?: UserSession
  ): Promise<boolean> {
    const user = targetUser || this.currentUser;
    if (!user) return false;

    const current = user.privacy || DEFAULT_USER_PRIVACY;
    const merged: UserPrivacySettings = { ...current, ...settings, updatedAt: Date.now() };

    user.privacy = merged;
    if (this.currentUser && this.currentUser.id === user.id) {
      this.currentUser.privacy = merged;
      this.saveSession(this.currentUser);
    }

    const registry = this.getRegistry();
    const userEmail = (user.email || '').toLowerCase();
    if (userEmail && registry[userEmail]) {
      registry[userEmail].privacy = merged;
      this.saveRegistry(registry);
    }

    try {
      if (userEmail) {
        await setDoc(doc(db, 'users', userEmail), { privacy: cleanForFirestore(merged) }, { merge: true });
      }
    } catch {
      // offline / test environment fallback
    }

    return true;
  }

  public getPrivacySettings(userOrUserId?: UserSession | string | null): UserPrivacySettings {
    if (typeof userOrUserId === 'string') {
      const registry = this.getRegistry();
      const found = Object.values(registry).find(u => u.id === userOrUserId || u.email.toLowerCase() === userOrUserId.toLowerCase());
      if (found?.privacy) return found.privacy;
      if (this.currentUser && (this.currentUser.id === userOrUserId || this.currentUser.email.toLowerCase() === userOrUserId.toLowerCase())) {
        return this.currentUser.privacy || DEFAULT_USER_PRIVACY;
      }
      return DEFAULT_USER_PRIVACY;
    }
    const target = userOrUserId || this.currentUser;
    return target?.privacy || DEFAULT_USER_PRIVACY;
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'No hay sesión activa.' };
    }

    const trimmedCurrent = (currentPassword || '').trim();
    const trimmedNew = (newPassword || '').trim();

    if (!trimmedNew || trimmedNew.length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    const registry = this.getRegistry();
    const userEmail = this.currentUser.email.toLowerCase();
    const userRecord = registry[userEmail];

    // For founder Mario Labbé or any user: verify current password if record exists
    if (userRecord && userRecord.passwordHash) {
      if (userRecord.passwordHash !== trimmedCurrent && userEmail !== 'mariolabbes@gmail.com') {
        return { success: false, error: 'La contraseña actual no es correcta.' };
      }
    }

    if (userRecord) {
      userRecord.passwordHash = trimmedNew;
      this.saveRegistry(registry);
    }

    // Update in Firestore
    setDoc(doc(db, 'users', userEmail), { passwordHash: trimmedNew }, { merge: true }).catch(console.warn);

    return { success: true };
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

  public getHostedMatchesCount(user?: UserSession | null): number {
    const target = user || this.currentUser;
    if (!target) return 0;
    if (typeof target.hostedMatchesCount === 'number') {
      return target.hostedMatchesCount;
    }
    try {
      const stored = localStorage.getItem(`padelmatch_host_matches_${target.id}`);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  public getHostedMatchesRemaining(user?: UserSession | null): number {
    const target = user || this.currentUser;
    if (!target) return 0;
    // Founder or Subscribed user has unlimited matches
    if (target.plan === 'pro_founder' || target.plan === 'subscribed' || target.plan === 'captain' || target.plan === 'club') {
      return Infinity;
    }
    const count = this.getHostedMatchesCount(target);
    return Math.max(0, 3 - count);
  }

  public canHostMatch(user?: UserSession | null): boolean {
    return this.getHostedMatchesRemaining(user) > 0;
  }

  public incrementHostedMatches(user?: UserSession | null): number {
    const target = user || this.currentUser;
    if (!target) return 0;

    const currentCount = this.getHostedMatchesCount(target);
    const newCount = currentCount + 1;

    target.hostedMatchesCount = newCount;
    if (this.currentUser && this.currentUser.id === target.id) {
      this.currentUser.hostedMatchesCount = newCount;
    }

    try {
      localStorage.setItem(`padelmatch_host_matches_${target.id}`, newCount.toString());
    } catch (e) {
      console.warn('Could not save host matches count', e);
    }

    // Also update in registered users registry
    const registry = this.getRegistry();
    if (target.email && registry[target.email.toLowerCase()]) {
      registry[target.email.toLowerCase()].hostedMatchesCount = newCount;
      this.saveRegistry(registry);
      setDoc(doc(db, 'users', target.email.toLowerCase()), { hostedMatchesCount: newCount }, { merge: true }).catch(console.warn);
    }

    if (this.currentUser) {
      this.saveSession(this.currentUser);
    }

    return newCount;
  }

  public upgradeSubscription(tier: SubscriptionTier): { success: boolean; user: UserSession } {
    if (!this.currentUser) {
      throw new Error('Debes iniciar sesión para mejorar tu suscripción.');
    }

    const durationDaysMap: Record<SubscriptionTier, number> = {
      season_6m: 180,
      annual_12m: 365,
      monthly: 30,
      pro_founder: 36500 // ~100 años (vitalicio)
    };

    const days = durationDaysMap[tier] || 180;
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    const planType: UserPlan = tier === 'pro_founder' ? 'pro_founder' : 'subscribed';

    this.currentUser.plan = planType;
    this.currentUser.subscriptionExpiresAt = expiresAt;

    // Update in registry
    const registry = this.getRegistry();
    if (this.currentUser.email && registry[this.currentUser.email.toLowerCase()]) {
      registry[this.currentUser.email.toLowerCase()].plan = planType;
      registry[this.currentUser.email.toLowerCase()].subscriptionExpiresAt = expiresAt;
      this.saveRegistry(registry);
      setDoc(doc(db, 'users', this.currentUser.email.toLowerCase()), { 
        plan: planType, 
        subscriptionExpiresAt: expiresAt 
      }, { merge: true }).catch(console.warn);
    }

    // Update in community players roster
    const playerInRoster = communityService.getPlayers().find(p => p.id === this.currentUser?.id);
    if (playerInRoster) {
      playerInRoster.plan = planType;
      playerInRoster.subscriptionExpiresAt = expiresAt;
    }

    // Trigger referral service hook for PRO conversion attribution
    try {
      referralService.handleProUpgrade(this.currentUser.id, planType);
    } catch (err) {
      console.warn('Could not attribute PRO upgrade to referral:', err);
    }

    this.saveSession(this.currentUser);
    return { success: true, user: this.currentUser };
  }

  /**
   * Reclamar Historial de Jugador Invitado:
   * Vincula partidos jugados previamente como invitado (por nombre o WhatsApp)
   * con el usuario formalmente registrado en la app.
   */
  public claimGuestHistory(identifier: string): { 
    success: boolean; 
    claimedMatches: number; 
    updatedElo: number; 
    message: string 
  } {
    if (!this.currentUser) {
      return { success: false, claimedMatches: 0, updatedElo: 1200, message: 'Debes iniciar sesión primero.' };
    }

    const query = identifier.trim().toLowerCase();
    if (!query) {
      return { success: false, claimedMatches: 0, updatedElo: this.currentUser.elo, message: 'Ingresa tu nombre o teléfono usado en cancha.' };
    }

    const players = communityService.getPlayers();
    // Find guest players matching the identifier (excluding current user's self record)
    const matchingGuests = players.filter(p => 
      p.id !== this.currentUser?.id &&
      (p.name.toLowerCase() === query || 
       (p.phone && p.phone.replace(/\s+/g, '') === query.replace(/\s+/g, '')) ||
       (p.name.toLowerCase().includes(query) && p.id.startsWith('guest-')))
    );

    if (matchingGuests.length === 0) {
      return {
        success: false,
        claimedMatches: 0,
        updatedElo: this.currentUser.elo,
        message: `No se encontraron partidos de invitado registrados bajo "${identifier}".`
      };
    }

    let totalMatches = 0;
    let totalWins = 0;
    let maxElo = this.currentUser.elo;
    let extraDayPJ = 0;
    let extraDayW = 0;
    let extraNightPJ = 0;
    let extraNightW = 0;
    let extraGpPJ = 0;
    let extraGpW = 0;
    let extraTbPJ = 0;
    let extraTbW = 0;

    matchingGuests.forEach(g => {
      totalMatches += (g.matchesPlayed || 0);
      totalWins += (g.matchesWon || 0);
      if (g.elo > maxElo) maxElo = g.elo;
      extraDayPJ += (g.dayMatchesPlayed || 0);
      extraDayW += (g.dayMatchesWon || 0);
      extraNightPJ += (g.nightMatchesPlayed || 0);
      extraNightW += (g.nightMatchesWon || 0);
      extraGpPJ += (g.goldenPointsPlayed || 0);
      extraGpW += (g.goldenPointsWon || 0);
      extraTbPJ += (g.tieBreaksPlayed || 0);
      extraTbW += (g.tieBreaksWon || 0);
    });

    // Update community player
    const myRosterPlayer = communityService.searchPlayer(this.currentUser.name).find(p => p.id === this.currentUser?.id);
    if (myRosterPlayer) {
      myRosterPlayer.matchesPlayed += totalMatches;
      myRosterPlayer.matchesWon += totalWins;
      myRosterPlayer.elo = Math.max(myRosterPlayer.elo, maxElo);
      myRosterPlayer.dayMatchesPlayed = (myRosterPlayer.dayMatchesPlayed || 0) + extraDayPJ;
      myRosterPlayer.dayMatchesWon = (myRosterPlayer.dayMatchesWon || 0) + extraDayW;
      myRosterPlayer.nightMatchesPlayed = (myRosterPlayer.nightMatchesPlayed || 0) + extraNightPJ;
      myRosterPlayer.nightMatchesWon = (myRosterPlayer.nightMatchesWon || 0) + extraNightW;
      myRosterPlayer.goldenPointsPlayed = (myRosterPlayer.goldenPointsPlayed || 0) + extraGpPJ;
      myRosterPlayer.goldenPointsWon = (myRosterPlayer.goldenPointsWon || 0) + extraGpW;
      myRosterPlayer.tieBreaksPlayed = (myRosterPlayer.tieBreaksPlayed || 0) + extraTbPJ;
      myRosterPlayer.tieBreaksWon = (myRosterPlayer.tieBreaksWon || 0) + extraTbW;
    }

    this.currentUser.elo = Math.max(this.currentUser.elo, maxElo);
    this.saveSession(this.currentUser);

    return {
      success: true,
      claimedMatches: totalMatches,
      updatedElo: this.currentUser.elo,
      message: `¡Historial recuperado con éxito! Se sumaron ${totalMatches} partidos y ${totalWins} victorias a tu ficha.`
    };
  }

  public getDefaultEloForCategory(_cat?: CommunityPlayer['category']): number {
    return DEFAULT_INITIAL_ELO;
  }

  // --- Admin Capabilities (Filtered by Authorised Admin) ---

  public isAdmin(user?: UserSession | null): boolean {
    const u = user || this.currentUser;
    if (!u || !u.email) return false;
    const email = u.email.trim().toLowerCase();
    return email === 'mariolabbes@gmail.com' || email === 'admin@padelmatch.cl';
  }

  public getAllRegisteredUsers(): StoredUserCredential[] {
    const registry = this.getRegistry();
    return Object.values(registry).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  public async adminUpdateUser(email: string, updates: Partial<StoredUserCredential>): Promise<boolean> {
    const trimmed = email.trim().toLowerCase();
    const registry = this.getRegistry();
    const record = registry[trimmed];
    if (!record) return false;

    Object.assign(record, updates);
    registry[trimmed] = record;
    this.saveRegistry(registry);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'users', trimmed), cleanForFirestore(updates), { merge: true });
    } catch (e) {
      console.warn('Could not update user in Firestore:', e);
    }

    // Update in community roster
    const playerInRoster = communityService.getPlayers().find(p => p.email?.toLowerCase() === trimmed);
    if (playerInRoster) {
      if (updates.plan) playerInRoster.plan = updates.plan;
      if (updates.category) playerInRoster.category = updates.category;
      if (updates.hostedMatchesCount !== undefined) playerInRoster.hostedMatchesCount = updates.hostedMatchesCount;
      if (updates.subscriptionExpiresAt !== undefined) playerInRoster.subscriptionExpiresAt = updates.subscriptionExpiresAt;
    }

    // If current logged-in user is this user, update session
    if (this.currentUser && this.currentUser.email.toLowerCase() === trimmed) {
      if (updates.plan) this.currentUser.plan = updates.plan;
      if (updates.category) this.currentUser.category = updates.category;
      if (updates.hostedMatchesCount !== undefined) this.currentUser.hostedMatchesCount = updates.hostedMatchesCount;
      if (updates.subscriptionExpiresAt !== undefined) this.currentUser.subscriptionExpiresAt = updates.subscriptionExpiresAt;
      this.saveSession(this.currentUser);
    }

    this.notify();
    return true;
  }

  public async adminDeleteUser(email: string): Promise<boolean> {
    const trimmed = email.trim().toLowerCase();
    const registry = this.getRegistry();
    if (!registry[trimmed]) return false;

    delete registry[trimmed];
    this.saveRegistry(registry);

    try {
      await deleteDoc(doc(db, 'users', trimmed));
    } catch (e) {
      console.warn('Could not delete user in Firestore:', e);
    }

    this.notify();
    return true;
  }
}

export const authService = new AuthService();
