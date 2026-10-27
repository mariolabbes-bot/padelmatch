import React, { useState, useEffect, useRef } from 'react';
import type { CommunityPlayer, DirectChatMessage } from '../types/padel';
import { directChatService } from '../services/directChatService';
import type { UserSession } from '../services/authService';
import { 
  X, 
  Send, 
  Calendar, 
  CheckCheck, 
  Check, 
  Sparkles,
  Users
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  partner: CommunityPlayer;
  onOpenScheduleInvite?: (partner: CommunityPlayer) => void;
  onOpenProfile?: (partner: CommunityPlayer) => void;
}

export const PartnerChatModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  partner,
  onOpenScheduleInvite,
  onOpenProfile
}) => {
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = directChatService.getChatId(currentUser.id, partner.id);

  // Load and listen to messages
  useEffect(() => {
    if (!isOpen) return;

    // Start listening
    directChatService.listenToChat(chatId);
    setMessages(directChatService.getMessages(chatId));

    // Mark as read immediately on open
    directChatService.markAsRead(chatId, currentUser.id);

    const unsub = directChatService.subscribe(() => {
      setMessages(directChatService.getMessages(chatId));
      directChatService.markAsRead(chatId, currentUser.id);
    });

    return () => unsub();
  }, [isOpen, chatId, currentUser.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');
    await directChatService.sendMessage({
      sender: currentUser,
      recipientId: partner.id,
      text
    });
    setIsSending(false);
  };

  const isImageAvatar = (avatar?: string) => avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));

  const formatMessageTime = (ts: number) => {
    const d = new Date(ts);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalBoxStyle} className="glass-panel apple-card" onClick={e => e.stopPropagation()}>
        
        {/* 1. HEADER FIJO */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {/* Avatar */}
            <div 
              style={{
                ...partnerAvatarBox,
                cursor: onOpenProfile ? 'pointer' : 'default'
              }}
              onClick={() => onOpenProfile && onOpenProfile(partner)}
              title="Ver perfil completo"
            >
              {partner.avatar ? (
                isImageAvatar(partner.avatar) ? (
                  <img src={partner.avatar} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.25rem' }}>{partner.avatar}</span>
                )
              ) : (
                partner.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Partner Info */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={partnerNameStyle}>{partner.name}</span>
                <span className="badge badge-team1" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                  {partner.category}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={partnerStatusStyle}>
                  <span style={statusDotStyle} className="pulsing-dot" />
                  Partner Conectado
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>•</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
                  {partner.elo || 1200} ELO
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenScheduleInvite && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScheduleInvite(partner);
                }}
                style={inviteMatchBtnStyle}
                title="Invitar a partido en múltiplos de 4"
              >
                <Calendar size={13} />
                <span style={{ display: 'none' }} className="hide-on-compact">Convocatoria</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={closeBtnStyle}
              aria-label="Cerrar chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. CUERPO SCROLLABLE (MENSAJES) */}
        <div style={bodyScrollableStyle}>
          {/* Welcome / Context Bubble */}
          <div style={chatIntroCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--gold-primary)', marginBottom: '4px' }}>
              <Sparkles size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Canal Deportivo Directo</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4 }}>
              Conversación privada con tu partner <strong>{partner.name}</strong> para coordinar turnos en cancha, duelos y torneos.
            </p>
          </div>

          {messages.length === 0 ? (
            <div style={emptyChatStyle}>
              <Users size={32} color="var(--text-dim)" style={{ opacity: 0.4, marginBottom: '8px' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Aún no hay mensajes en este chat
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Escribe un mensaje para coordinar tu próximo partido
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.id;
                const showDateHeader = index === 0 || 
                  new Date(msg.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();

                return (
                  <React.Fragment key={msg.id}>
                    {showDateHeader && (
                      <div style={dateHeaderStyle}>
                        <span>{new Date(msg.timestamp).toLocaleDateString('es-CL', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}>
                      <div style={{
                        ...messageBubbleStyle,
                        background: isMe 
                          ? 'linear-gradient(135deg, #00E676 0%, #00C853 100%)' 
                          : 'rgba(255, 255, 255, 0.08)',
                        color: isMe ? '#050a10' : 'var(--text-main)',
                        borderBottomRightRadius: isMe ? '4px' : '18px',
                        borderBottomLeftRadius: isMe ? '18px' : '4px'
                      }}>
                        {/* Text Content */}
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.45, wordBreak: 'break-word', fontWeight: isMe ? 600 : 500 }}>
                          {msg.text}
                        </div>

                        {/* Meta: Timestamp & Read Status */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px',
                          marginTop: '4px',
                          fontSize: '0.62rem',
                          color: isMe ? 'rgba(5, 10, 16, 0.75)' : 'var(--text-dim)'
                        }}>
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {isMe && (
                            msg.read ? (
                              <CheckCheck size={12} color="#050a10" />
                            ) : (
                              <Check size={12} color="rgba(5, 10, 16, 0.6)" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. FOOTER STICKY (INPUT BAR) */}
        <form onSubmit={handleSend} style={footerFormStyle}>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Escribe a ${partner.name.split(' ')[0]}...`}
            style={chatInputStyle}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            style={{
              ...sendBtnStyle,
              opacity: inputText.trim() && !isSending ? 1 : 0.45,
              cursor: inputText.trim() && !isSending ? 'pointer' : 'not-allowed'
            }}
            aria-label="Enviar mensaje"
          >
            <Send size={15} />
          </button>
        </form>

      </div>
    </div>
  );
};

// --- STYLES ---

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 7, 12, 0.85)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px',
  zIndex: 10000,
  overflowY: 'auto'
};

const modalBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  height: 'min(90vh, 720px)',
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'linear-gradient(180deg, rgba(20, 26, 38, 0.98) 0%, rgba(10, 14, 22, 0.99) 100%)',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(15, 20, 32, 0.95)',
  flexShrink: 0
};

const partnerAvatarBox: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.25) 0%, rgba(0, 176, 255, 0.25) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '1rem',
  color: 'var(--text-main)',
  flexShrink: 0,
  overflow: 'hidden'
};

const partnerNameStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const partnerStatusStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#00E676',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const statusDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#00E676'
};

const inviteMatchBtnStyle: React.CSSProperties = {
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  color: '#00E676',
  padding: '6px 10px',
  borderRadius: '10px',
  fontSize: '0.72rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: 'none',
  color: 'var(--text-muted)',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const bodyScrollableStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const chatIntroCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '14px',
  padding: '10px 14px',
  marginBottom: '6px'
};

const emptyChatStyle: React.CSSProperties = {
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '24px'
};

const dateHeaderStyle: React.CSSProperties = {
  alignSelf: 'center',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'var(--text-dim)',
  background: 'rgba(255, 255, 255, 0.04)',
  padding: '3px 10px',
  borderRadius: '12px',
  margin: '4px 0'
};

const messageBubbleStyle: React.CSSProperties = {
  maxWidth: '78%',
  padding: '10px 14px',
  borderRadius: '18px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
};

const footerFormStyle: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(12, 16, 26, 0.98)'
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '20px',
  padding: '10px 16px',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  outline: 'none'
};

const sendBtnStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--team1-primary)',
  color: '#070a10',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.15s ease'
};
