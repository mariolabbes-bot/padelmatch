import React, { useState } from 'react';
import type { ScheduledMatch, CommunityPlayer } from '../types/padel';
import type { UserSession } from '../services/authService';
import { scheduleService } from '../services/scheduleService';
import { partnerService } from '../services/partnerService';
import { isImageAvatar } from '../utils/imageOptimizer';
import { 
  Calendar, 
  Clock, 
  Users, 
  X, 
  Check, 
  Share2, 
  UserPlus, 
  Trash2, 
  Play, 
  AlertTriangle,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  match: ScheduledMatch | null;
  currentUser: UserSession;
  onClose: () => void;
  onLaunchMatch: (match: ScheduledMatch) => void;
}

export const ScheduledMatchDetailModal: React.FC<Props> = ({
  isOpen,
  match,
  currentUser,
  onClose,
  onLaunchMatch
}) => {
  const [isInvitePartnerOpen, setIsInvitePartnerOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  if (!isOpen || !match) return null;

  const isHost = match.creatorId === currentUser.id || match.creatorEmail.toLowerCase() === currentUser.email.toLowerCase();
  const confirmedSlots = match.slots.filter(s => s.status === 'confirmed');
  const isCanchaCompleta = confirmedSlots.length >= 4;

  const mySlot = match.slots.find(s => 
    (s.playerId && s.playerId === currentUser.id) || 
    (s.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
  );
  const isPendingMyResponse = mySlot?.status === 'pending';
  const isConfirmedParticipant = mySlot?.status === 'confirmed' || isHost;

  const allPartners = partnerService.getPartners(currentUser);
  const uninvitedPartners = allPartners.filter(p => !match.slots.some(s => s.playerId === p.id && s.status !== 'declined'));

  const showFeedback = (text: string, isError = false) => {
    setFeedbackMsg({ text, isError });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRespond = (accept: boolean) => {
    const res = scheduleService.respondInvite(match.id, {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      avatar: currentUser.avatar,
      category: currentUser.category
    }, accept);

    if (res.success) {
      showFeedback(accept ? '¡Confirmaste tu lugar en la cancha! 🎾' : 'Has declinado la invitación.');
      if (accept && res.isComplete) {
        showFeedback('¡Cancha completa (4/4)! El partido ya tiene a sus 4 jugadores.');
      }
    } else {
      showFeedback(res.error || 'No se pudo registrar la respuesta', true);
    }
  };

  const handleConfirmAndClose = () => {
    const res = scheduleService.confirmAndCloseMatch(match.id, currentUser);
    if (res.success) {
      showFeedback('🎉 ¡Partido confirmado y agendado para los 4 jugadores!');
    } else {
      showFeedback(res.error || 'Error al confirmar', true);
    }
  };

  const handleCancelMatch = () => {
    const res = scheduleService.cancelScheduledMatch(match.id, currentUser, 'Cancelado por el organizador');
    if (res.success) {
      setIsConfirmingCancel(false);
      showFeedback('Convocatoria cancelada.');
      setTimeout(() => onClose(), 1500);
    } else {
      showFeedback(res.error || 'Error al cancelar', true);
    }
  };

  const handleShareWhatsApp = () => {
    const text = scheduleService.generateWhatsAppInviteText(match, currentUser.name);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleInvitePartner = (partner: CommunityPlayer) => {
    const ok = scheduleService.inviteAdditionalPartner(match.id, partner, currentUser);
    if (ok) {
      showFeedback(`Invitación enviada a ${partner.name}`);
      setIsInvitePartnerOpen(false);
    } else {
      showFeedback('No hay cupos disponibles o el jugador ya está invitado.', true);
    }
  };

  const formatReadableDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div 
        style={modalCardStyle} 
        className="glass-panel apple-card" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={getStatusBadgeStyle(match.status)}>
                {getStatusLabel(match.status)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800 }}>
                {match.id}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {match.clubName}
            </h3>
            {match.courtName && (
              <span style={{ fontSize: '0.8rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                📍 {match.courtName}
              </span>
            )}
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={closeBtnStyle}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Date & Time Highlights */}
        <div style={matchMetaBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--team1-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
                Fecha
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-main)' }}>
                {formatReadableDate(match.matchDate)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--gold-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
                Hora
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                {match.matchTime} hrs
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: feedbackMsg.isError ? 'rgba(255, 82, 82, 0.15)' : 'rgba(0, 230, 118, 0.15)',
            border: `1px solid ${feedbackMsg.isError ? '#ff5252' : 'var(--team1-primary)'}`,
            color: feedbackMsg.isError ? '#ff5252' : 'var(--team1-primary)',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Pending RSVP Callout Banner for Invited Partner */}
        {match.status === 'open' && isPendingMyResponse && (
          <div style={rsvpBannerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="var(--gold-primary)" />
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                ¿Asistirás a este partido?
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
              {match.creatorName} te invitó a jugar. Confirma tu lugar para asegurar uno de los 4 cupos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleRespond(true)}
                style={acceptBtnStyle}
              >
                <Check size={16} strokeWidth={3} />
                <span>Asistiré (Confirmar)</span>
              </button>
              <button
                type="button"
                onClick={() => handleRespond(false)}
                style={declineBtnStyle}
              >
                <X size={16} strokeWidth={2} />
                <span>No podré</span>
              </button>
            </div>
          </div>
        )}

        {/* Notes (if any) */}
        {match.notes && (
          <div style={notesBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800, marginBottom: '2px' }}>
              <MessageSquare size={13} />
              <span>NOTAS DEL ORGANIZADOR</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
              "{match.notes}"
            </div>
          </div>
        )}

        {/* 4 Player Slots Grid */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="var(--team1-primary)" />
              <span>Jugadores Convocados</span>
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isCanchaCompleta ? 'var(--team1-primary)' : 'var(--gold-primary)' }}>
              {confirmedSlots.length} de 4 confirmados
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {match.slots.map((slot, index) => {
              const isConfirmed = slot.status === 'confirmed';
              const isPending = slot.status === 'pending';
              const isDeclined = slot.status === 'declined';

              return (
                <div 
                  key={slot.id || index}
                  style={{
                    ...slotCardStyle,
                    borderColor: isConfirmed 
                      ? 'rgba(0, 230, 118, 0.4)' 
                      : (isPending ? 'rgba(255, 214, 0, 0.3)' : 'var(--border-subtle)'),
                    background: isConfirmed 
                      ? 'rgba(0, 230, 118, 0.08)' 
                      : (isPending ? 'rgba(255, 214, 0, 0.05)' : 'rgba(0, 0, 0, 0.3)')
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      ...slotAvatarCircle,
                      borderColor: isConfirmed ? 'var(--team1-primary)' : 'var(--border-medium)',
                      overflow: 'hidden'
                    }}>
                      {slot.avatar ? (
                        isImageAvatar(slot.avatar) ? (
                          <img src={slot.avatar} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.2rem' }}>{slot.avatar}</span>
                        )
                      ) : (
                        slot.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {slot.name}
                        </span>
                        {slot.isHost && (
                          <span style={hostBadge}>HOST</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: isConfirmed ? 'var(--team1-primary)' : 'var(--gold-primary)', fontWeight: 700 }}>
                        {isConfirmed && '✅ Confirmado'}
                        {isPending && '⏳ Esperando resp.'}
                        {isDeclined && '❌ Declinó'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini Picker for Additional Partners (Host Only) */}
        {isInvitePartnerOpen && (
          <div style={invitePartnerDrawer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Selecciona un Partner para invitar
              </span>
              <button 
                type="button" 
                onClick={() => setIsInvitePartnerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            {uninvitedPartners.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {uninvitedPartners.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleInvitePartner(p)}
                    style={drawerPartnerItem}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={miniAvatarStyle}>
                        {p.avatar ? (isImageAvatar(p.avatar) ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.avatar) : p.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{p.category} Cat • ELO {p.elo}</div>
                      </div>
                    </div>
                    <span style={sendInvitePill}>+ Invitar</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                Todos tus partners ya han sido convocados. ¡Usa el botón de WhatsApp para invitar a amigos externos!
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Match Day Action: Enter Court (Available for all 4 confirmed players when match is confirmed or in progress) */}
          {(match.status === 'confirmed' || match.status === 'in_progress') && isConfirmedParticipant && (
            <button
              type="button"
              onClick={() => {
                onLaunchMatch(match);
                onClose();
              }}
              style={enterCourtBtnStyle}
            >
              <Play size={20} fill="#070a10" color="#070a10" />
              <span>🎾 Entrar a Cancha / Iniciar Partido</span>
            </button>
          )}

          {/* Host Actions: Confirm & Close Match when 4/4 */}
          {isHost && match.status === 'open' && isCanchaCompleta && (
            <button
              type="button"
              onClick={handleConfirmAndClose}
              style={confirmMatchBtnStyle}
            >
              <Check size={20} strokeWidth={3} />
              <span>Cerrar Convocatoria y Agendar Partido (4/4)</span>
            </button>
          )}

          {/* Host Actions: Share WhatsApp & Additional Invites when < 4 */}
          {isHost && match.status === 'open' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={whatsappShareBtn}
              >
                <Share2 size={16} />
                <span>Invitar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInvitePartnerOpen(!isInvitePartnerOpen)}
                style={inviteMoreBtn}
              >
                <UserPlus size={16} />
                <span>+ Invitar Partner</span>
              </button>
            </div>
          )}

          {/* Cancel Match Option for Host */}
          {isHost && match.status !== 'cancelled' && match.status !== 'completed' && (
            <div>
              {isConfirmingCancel ? (
                <div style={confirmCancelBox}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff5252', fontSize: '0.8rem', fontWeight: 800 }}>
                    <AlertTriangle size={16} />
                    <span>¿Deseas cancelar esta programación? Se notificará a los confirmados.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCancelMatch}
                      style={cancelConfirmBtn}
                    >
                      Sí, Cancelar Partido
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCancel(false)}
                      style={cancelAbortBtn}
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(true)}
                  style={cancelLinkBtn}
                >
                  <Trash2 size={14} />
                  <span>Cancelar esta convocatoria</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Helpers
function getStatusLabel(status: string): string {
  switch (status) {
    case 'open': return '🟡 En Convocatoria';
    case 'confirmed': return '🟢 Partido Agendado';
    case 'in_progress': return '🎾 En Cancha';
    case 'completed': return '🏁 Finalizado';
    case 'cancelled': return '🔴 Cancelado';
    default: return status;
  }
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'open':
      return {
        fontSize: '0.68rem',
        fontWeight: 900,
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(255, 214, 0, 0.15)',
        color: 'var(--gold-primary)',
        border: '1px solid rgba(255, 214, 0, 0.4)'
      };
    case 'confirmed':
      return {
        fontSize: '0.68rem',
        fontWeight: 900,
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(0, 230, 118, 0.15)',
        color: 'var(--team1-primary)',
        border: '1px solid rgba(0, 230, 118, 0.4)'
      };
    case 'in_progress':
      return {
        fontSize: '0.68rem',
        fontWeight: 900,
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(0, 176, 255, 0.15)',
        color: 'var(--team2-primary)',
        border: '1px solid rgba(0, 176, 255, 0.4)'
      };
    case 'cancelled':
      return {
        fontSize: '0.68rem',
        fontWeight: 900,
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(255, 82, 82, 0.15)',
        color: '#ff5252',
        border: '1px solid rgba(255, 82, 82, 0.4)'
      };
    default:
      return { fontSize: '0.68rem', fontWeight: 800 };
  }
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.82)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const matchMetaBanner: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  padding: '14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '16px',
  marginBottom: '16px'
};

const rsvpBannerStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--gold-primary)',
  borderLeft: '4px solid var(--gold-primary)',
  marginBottom: '16px'
};

const acceptBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 900,
  fontSize: '0.84rem',
  cursor: 'pointer'
};

const declineBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px',
  background: 'rgba(255, 82, 82, 0.15)',
  color: '#ff5252',
  border: '1px solid rgba(255, 82, 82, 0.3)',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.84rem',
  cursor: 'pointer'
};

const notesBoxStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--bg-elevated)',
  border: '1px dashed var(--border-subtle)',
  borderRadius: '12px',
  marginBottom: '16px'
};

const slotCardStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '14px',
  border: '1.5px solid var(--border-subtle)',
  boxSizing: 'border-box'
};

const slotAvatarCircle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '0.9rem',
  color: 'var(--team1-primary)',
  flexShrink: 0
};

const hostBadge: React.CSSProperties = {
  fontSize: '0.58rem',
  fontWeight: 900,
  padding: '1px 4px',
  borderRadius: '3px',
  background: 'rgba(0, 230, 118, 0.2)',
  color: 'var(--team1-primary)',
  border: '1px solid var(--team1-primary)'
};

const invitePartnerDrawer: React.CSSProperties = {
  padding: '14px',
  borderRadius: '16px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  marginBottom: '16px'
};

const drawerPartnerItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 10px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  cursor: 'pointer'
};

const miniAvatarStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--bg-card)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 900,
  color: 'var(--team1-primary)',
  overflow: 'hidden'
};

const sendInvitePill: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 800,
  color: 'var(--team1-primary)',
  background: 'rgba(0, 230, 118, 0.15)',
  padding: '3px 8px',
  borderRadius: '6px'
};

const enterCourtBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '15px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: '16px',
  fontWeight: 900,
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 8px 28px rgba(0, 230, 118, 0.35)',
  animation: 'pulse 2s infinite'
};

const confirmMatchBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px',
  background: 'var(--gold-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 900,
  fontSize: '0.92rem',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(255, 214, 0, 0.35)'
};

const whatsappShareBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  background: '#25D366',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '0.85rem',
  cursor: 'pointer'
};

const inviteMoreBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-medium)',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '0.85rem',
  cursor: 'pointer'
};

const cancelLinkBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-dim)',
  fontSize: '0.76rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  padding: '6px',
  margin: '0 auto'
};

const confirmCancelBox: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255, 82, 82, 0.1)',
  border: '1px solid rgba(255, 82, 82, 0.3)',
  borderRadius: '12px',
  textAlign: 'center'
};

const cancelConfirmBtn: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  background: '#ff5252',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 800,
  fontSize: '0.78rem',
  cursor: 'pointer'
};

const cancelAbortBtn: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'var(--text-main)',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 800,
  fontSize: '0.78rem',
  cursor: 'pointer'
};
