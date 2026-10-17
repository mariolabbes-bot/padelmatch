import type { AppNotification } from '../types/padel';

const NOTIFICATIONS_STORAGE_KEY = 'padelmatch_notifications_feed';
const NOTIF_PERMISSION_KEY = 'padelmatch_push_permission_requested';

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Array<(notifications: AppNotification[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(NOTIF_PERMISSION_KEY, 'true');
      
      if (permission === 'granted') {
        // Send a celebratory welcome notification
        this.sendNativeNotification('🎾 ¡Notificaciones PadelMatch Activadas!', {
          body: 'Recibirás alertas de partidos abiertos (falta 1), invitaciones y ofertas de clubes.',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'welcome_padelmatch'
        });
      }
      return permission;
    } catch (e) {
      console.warn('Error solicitando permisos de notificación:', e);
      return 'denied';
    }
  }

  public async sendNativeNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Prefer Service Worker notification if available (works on mobile / background)
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await (registration as any).showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
            ...options
          });
          return true;
        }
      }

      // Fallback to desktop Notification constructor
      new Notification(title, {
        icon: '/pwa-192x192.png',
        ...options
      });
      return true;
    } catch (err) {
      console.warn('Error enviando notificación nativa:', err);
      return false;
    }
  }

  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public markAsRead(id: string): void {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.saveToStorage();
    this.notify();
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveToStorage();
    this.notify();
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notification,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      read: false
    };

    this.notifications = [newNotif, ...this.notifications];
    this.saveToStorage();
    this.notify();

    // Trigger native device notification as well
    this.sendNativeNotification(newNotif.title, {
      body: newNotif.body,
      tag: newNotif.id
    });

    return newNotif;
  }

  public sendTestAlert(type: 'open_match' | 'friend_invite' | 'club_offer'): void {
    if (type === 'open_match') {
      this.addNotification({
        type: 'open_match',
        title: '🎾 ¡Falta 1 en 4ª Categoría!',
        body: 'Partido hoy a las 19:30 en Club Central Padel (Cancha 2). Toca para sumarte.',
        clubName: 'Club Central Padel',
        courtName: 'Cancha 2',
        category: '4ta'
      });
    } else if (type === 'friend_invite') {
      this.addNotification({
        type: 'friend_invite',
        title: '✉️ Invitación a Partido',
        body: 'Mario Labbé te ha invitado a un partido desafiante en Club Deportivo Oriente.',
        clubName: 'Club Deportivo Oriente'
      });
    } else {
      this.addNotification({
        type: 'club_offer',
        title: '🔥 Hora Valle: 30% Descuento',
        body: 'Pistas libres hoy entre 14:00 y 17:00 en Club Padel Park con tarifa reducida.',
        clubName: 'Club Padel Park',
        discountPercentage: 30
      });
    }
  }

  public subscribe(listener: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getNotifications());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l(this.getNotifications()));
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        this.notifications = JSON.parse(saved);
      } else {
        // Initial Demo / Welcome Feed
        this.notifications = [
          {
            id: 'notif-demo-1',
            type: 'open_match',
            title: '🎾 ¡Falta 1 en 4ª Categoría!',
            body: 'Partido hoy a las 19:30 en Club Central Padel (Cancha 2). Buscan jugador de Drive.',
            timestamp: Date.now() - 1000 * 60 * 25,
            clubName: 'Club Central Padel',
            courtName: 'Cancha 2',
            category: '4ta',
            read: false
          },
          {
            id: 'notif-demo-2',
            type: 'friend_invite',
            title: '✉️ Invitación de Mario Labbé',
            body: 'Te ha invitado a un partido de revancha este sábado a las 11:00 hrs.',
            timestamp: Date.now() - 1000 * 60 * 90,
            clubName: 'Club Padel Oriente',
            read: false
          },
          {
            id: 'notif-demo-3',
            type: 'club_offer',
            title: '🔥 30% Descuento en Pistas Libres',
            body: 'Club Deportivo Padel: Canchas techadas disponibles hoy entre 14:00 y 17:00 con tarifa promocional.',
            timestamp: Date.now() - 1000 * 60 * 180,
            clubName: 'Club Deportivo Padel',
            discountPercentage: 30,
            read: true
          }
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Error loading notifications:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('Error saving notifications:', e);
    }
  }
}

export const notificationService = new NotificationService();
