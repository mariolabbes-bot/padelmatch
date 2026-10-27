import type { DirectChatMessage, DirectChatConversation } from '../types/padel';
import type { UserSession } from './authService';
import { partnerService } from './partnerService';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

const CHAT_STORAGE_KEY = 'padelmatch_direct_chats_v1';

class DirectChatService {
  private messages: Map<string, DirectChatMessage[]> = new Map(); // chatId -> messages
  private listeners: Set<() => void> = new Set();
  private activeChatSubscriptions: Map<string, () => void> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Deterministic room ID so both players always map to the same conversation
   */
  public getChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.messages = new Map(Object.entries(parsed));
      }
    } catch {
      this.messages = new Map();
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const obj: Record<string, DirectChatMessage[]> = {};
      this.messages.forEach((msgs, cId) => {
        obj[cId] = msgs;
      });
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Error saving direct chats:', e);
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

  /**
   * Starts listening to real-time messages for a specific conversation
   */
  public listenToChat(chatId: string) {
    if (this.activeChatSubscriptions.has(chatId)) return;

    try {
      const q = query(
        collection(db, 'direct_chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: DirectChatMessage[] = [];
        snapshot.forEach(docSnap => {
          msgs.push(docSnap.data() as DirectChatMessage);
        });

        if (msgs.length > 0) {
          this.messages.set(chatId, msgs);
          this.saveToStorage();
        }
      }, (err) => {
        console.warn('Firestore direct chat sync notice:', err);
      });

      this.activeChatSubscriptions.set(chatId, unsub);
    } catch (e) {
      console.warn('Error initializing direct chat listener:', e);
    }
  }

  public getMessages(chatIdOrUser1: string, user2?: string): DirectChatMessage[] {
    const chatId = user2 ? this.getChatId(chatIdOrUser1, user2) : chatIdOrUser1;
    return this.messages.get(chatId) || [];
  }

  /**
   * Sends a message directly to a confirmed partner
   */
  public async sendMessage(
    paramsOrSender: { sender: UserSession; recipientId: string; text: string; matchInviteId?: string } | UserSession,
    recipientIdArg?: string,
    textArg?: string,
    matchInviteIdArg?: string
  ): Promise<DirectChatMessage> {
    let sender: UserSession;
    let recipientId: string;
    let text: string;
    let matchInviteId: string | undefined;

    if ('sender' in paramsOrSender) {
      sender = paramsOrSender.sender;
      recipientId = paramsOrSender.recipientId;
      text = paramsOrSender.text;
      matchInviteId = paramsOrSender.matchInviteId;
    } else {
      sender = paramsOrSender;
      recipientId = recipientIdArg || '';
      text = textArg || '';
      matchInviteId = matchInviteIdArg;
    }

    const chatId = this.getChatId(sender.id, recipientId);

    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newMessage: DirectChatMessage = {
      id: messageId,
      chatId,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      recipientId,
      text: text.trim(),
      timestamp: Date.now(),
      read: false,
      matchInviteId
    };

    // 1. Optimistic in-memory & local storage update
    const currentList = this.messages.get(chatId) || [];
    this.messages.set(chatId, [...currentList, newMessage]);
    this.saveToStorage();

    // 2. Persist to Firestore
    try {
      await setDoc(
        doc(db, 'direct_chats', chatId, 'messages', messageId),
        cleanForFirestore(newMessage)
      );
    } catch (e) {
      console.warn('Could not save direct message to Firestore:', e);
    }

    return newMessage;
  }

  /**
   * Marks all messages in a conversation as read by the current user
   */
  public markAsRead(chatIdOrCurrentUser: string, userIdOrPartnerId: string) {
    let chatId = chatIdOrCurrentUser;
    let currentUserId = userIdOrPartnerId;

    if (!this.messages.has(chatId)) {
      const derivedChatId = this.getChatId(chatIdOrCurrentUser, userIdOrPartnerId);
      if (this.messages.has(derivedChatId)) {
        chatId = derivedChatId;
        currentUserId = chatIdOrCurrentUser;
      }
    }

    const list = this.messages.get(chatId);
    if (!list) return;

    let modified = false;
    list.forEach(msg => {
      if ((msg.recipientId === currentUserId || msg.recipientId === chatIdOrCurrentUser) && !msg.read) {
        msg.read = true;
        modified = true;
        // Sync read status to Firestore in background
        setDoc(
          doc(db, 'direct_chats', chatId, 'messages', msg.id),
          { read: true },
          { merge: true }
        ).catch(() => {});
      }
    });

    if (modified) {
      this.saveToStorage();
    }
  }

  /**
   * Returns unread count for a specific partner conversation or all conversations
   */
  public getUnreadCount(currentUserId: string, partnerId?: string): number {
    if (partnerId) {
      const chatId = this.getChatId(currentUserId, partnerId);
      const list = this.messages.get(chatId) || [];
      return list.filter(m => m.recipientId === currentUserId && !m.read).length;
    }
    return this.getTotalUnreadCount(currentUserId);
  }

  /**
   * Calculates total unread messages across all conversations for a user
   */
  public getTotalUnreadCount(currentUserId: string): number {
    let unread = 0;
    this.messages.forEach(msgs => {
      msgs.forEach(m => {
        if (m.recipientId === currentUserId && !m.read) {
          unread++;
        }
      });
    });
    return unread;
  }

  /**
   * Returns list of conversations for current user with confirmed partners
   */
  public getConversations(currentUser: UserSession): DirectChatConversation[] {
    const partners = partnerService.getPartners(currentUser);
    const conversations: DirectChatConversation[] = [];

    partners.forEach(partner => {
      const chatId = this.getChatId(currentUser.id, partner.id);
      const msgs = this.messages.get(chatId) || [];
      const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      const unreadCount = msgs.filter(m => m.recipientId === currentUser.id && !m.read).length;

      conversations.push({
        chatId,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerAvatar: partner.avatar,
        partnerCategory: partner.category,
        lastMessage,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.timestamp : 0
      });
    });

    // Sort by recent activity
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export const directChatService = new DirectChatService();
