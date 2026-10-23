import React, { useState, useEffect } from 'react';
import type { ScheduledMatch } from '../types/padel';
import type { UserSession } from '../services/authService';
import { scheduleService } from '../services/scheduleService';
import { isImageAvatar } from '../utils/imageOptimizer';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';

interface Props {
  matchId: string | null;
  currentUser: UserSession | null;
  onClose: () => void;
  onMatchConfirmed?: () => void;
}

export const PublicMatchInviteModal: React.FC<Props> = ({
  matchId,
  currentUser,
  onClose,
  onMatchConfirmed
}) => {
  const [match, setMatch] = useState<ScheduledMatch | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      return;
    }
    const m = scheduleService.getMatchById(matchId);
    setMatch(m);

    const unsub = scheduleService.subscribe(() => {
      const updated = scheduleService.getMatchById(matchId);
      setMatch(updated);
    });

    return () => unsub();
  }, [matchId]);

  if (!matchId) return null;

  const confirmedSlots = match ? match.slots.filter(s => s.status === 'confirmed') : [];
  const remainingSlots = match ? 4 - confirmedSlots.length : 0;
  const isCanchaLlena = remainingSlots <= 0;

  // Check if current user is already confirmed
  const isAlreadyConfirmed = !!match && !!currentUser && match.slots.some(
    s => s.status === 'confirmed' && (
      (s.playerId && s.playerId === currentUser.id) ||
      (s.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
    )
  );

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;

    const responder = currentUser ? {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      avatar: currentUser.avatar,
      category: currentUser.category
    } : {
      name: guestName.trim(),
      phone: guestPhone.trim() || undefined
    };

    if (!responder.name) {
      setFeedback({ text: 'Por favor ingresa tu nombre para confirmar.', isError: true });
      return;
    }

    const res = scheduleService.respondInvite(match.id, responder, true);
    if (res.success) {
      setHasConfirmed(true);
      setFeedback({ text: '¡Excelente! Tu lugar ha sido confirmado en la cancha 🎾' });
      if (onMatchConfirmed) onMatchConfirmed();
    } else {
      setFeedback({ text: res.error || 'No se pudo confirmar tu lugar', isError: true });
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
        <button 
          type="button" 
          onClick={onClose} 
          style={closeBtnStyle}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {!match ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <AlertCircle size={36} color="var(--gold-primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
              Convocatoria no encontrada
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Es posible que este partido haya finalizado o haya sido cancelado por el organizador.
            </p>
          </div>
        ) : (
          <div>
            {/* Organizer Header */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={organizerAvatarCircle}>
                {match.creatorAvatar ? (
                  isImageAvatar(match.creatorAvatar) ? (
                    <img src={match.creatorAvatar} alt={match.creatorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>{match.creatorAvatar}</span>
                  )
                ) : (
                  match.creatorName.charAt(0).toUpperCase()
                )}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                INVITACIÓN A PARTIDO DE PÁDEL
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 2px' }}>
                {match.creatorName} te invita a jugar
              </h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                📍 {match.clubName} {match.courtName ? `• ${match.courtName}` : ''}
              </div>
            </div>

            {/* Match Meta Card */}
            <div style={metaCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--team1-primary)" />
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 800 }}>FECHA</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>
                    {formatReadableDate(match.matchDate)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--gold-primary)" />
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 800 }}>HORA</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                    {match.matchTime} hrs
                  </div>
                </div>
              </div>
            </div>

            {/* Quorum Progress Bar */}
            <div style={quorumProgressBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Quórum de la Cancha
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: isCanchaLlena ? 'var(--team1-primary)' : 'var(--gold-primary)' }}>
                  {confirmedSlots.length} de 4 {isCanchaLlena ? '(Completa)' : `(¡Falta ${remainingSlots}!)`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {match.slots.map((s, idx) => (
                  <div 
                    key={s.id || idx}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '8px',
                      background: s.status === 'confirmed' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: s.status === 'confirmed' ? '1px solid var(--team1-primary)' : '1px dashed var(--border-subtle)',
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: s.status === 'confirmed' ? 'var(--team1-primary)' : 'var(--text-dim)'
                    }}
                  >
                    {s.status === 'confirmed' ? s.name.split(' ')[0] : 'Disponible'}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback message */}
            {feedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: feedback.isError ? 'rgba(255, 82, 82, 0.15)' : 'rgba(0, 230, 118, 0.15)',
                border: `1px solid ${feedback.isError ? '#ff5252' : 'var(--team1-primary)'}`,
                color: feedback.isError ? '#ff5252' : 'var(--team1-primary)',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {feedback.text}
              </div>
            )}

            {/* Confirmation Area */}
            {hasConfirmed || isAlreadyConfirmed ? (
              <div style={successConfirmedBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--team1-primary)', fontWeight: 900, fontSize: '1rem', marginBottom: '6px' }}>
                  <Check size={20} strokeWidth={3} />
                  <span>¡Ya estás confirmado para este partido!</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.4 }}>
                  Te esperamos el {formatReadableDate(match.matchDate)} a las {match.matchTime} hrs en {match.clubName}.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  style={doneBtnStyle}
                >
                  Entendido / Volver
                </button>
              </div>
            ) : isCanchaLlena ? (
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  ¡Llegaste tarde! Los 4 cupos para este partido ya fueron completados.
                </span>
              </div>
            ) : (
              <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentUser ? (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
                      Has iniciado sesión como <strong style={{ color: '#fff' }}>{currentUser.name}</strong> ({currentUser.category} Cat).
                    </div>
                    <button
                      type="submit"
                      style={confirmActionBtn}
                    >
                      <Check size={18} strokeWidth={3} />
                      <span>Confirmar mi asistencia como {currentUser.name.split(' ')[0]}</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={labelStyle}>Tu Nombre y Apellido</label>
                      <input 
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={labelStyle}>Teléfono / WhatsApp (Opcional)</label>
                      <input 
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      style={confirmActionBtn}
                    >
                      <Sparkles size={18} />
                      <span>Confirmar mi lugar en la Cancha 🎾</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '16px'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '24px',
  padding: '28px 24px',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
  position: 'relative'
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: 'rgba(255, 255, 255, 0.05)',
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

const organizerAvatarCircle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2), rgba(0, 176, 255, 0.2))',
  border: '2px solid var(--team1-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 900,
  color: '#fff',
  margin: '0 auto 10px',
  overflow: 'hidden'
};

const metaCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  padding: '12px 14px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '14px',
  marginBottom: '14px'
};

const quorumProgressBox: React.CSSProperties = {
  padding: '12px 14px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '14px',
  marginBottom: '18px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  marginBottom: '4px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const confirmActionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
  padding: '14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 900,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0, 230, 118, 0.35)'
};

const successConfirmedBox: React.CSSProperties = {
  textAlign: 'center',
  padding: '18px 14px',
  background: 'rgba(0, 230, 118, 0.1)',
  border: '1px solid var(--team1-primary)',
  borderRadius: '16px'
};

const doneBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#fff',
  border: '1px solid var(--border-medium)',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '0.85rem',
  cursor: 'pointer'
};
