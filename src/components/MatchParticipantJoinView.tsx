import React, { useState } from 'react';
import type { CommunityPlayer, PlayerCategory } from '../types/padel';
import type { SyncedMatchRoom } from '../services/matchSyncService';
import type { UserSession } from '../services/authService';
import { matchSyncService } from '../services/matchSyncService';
import { 
  Users, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  Flame, 
  Trophy, 
  ShieldCheck, 
  Clock, 
  Eye,
  LogOut,
  ArrowLeft
} from 'lucide-react';

interface Props {
  room: SyncedMatchRoom;
  currentUser: UserSession | null;
  onViewLiveScoreboard: () => void;
  onLogout?: () => void;
  onExitRoom?: () => void;
}

export const MatchParticipantJoinView: React.FC<Props> = ({
  room,
  currentUser,
  onViewLiveScoreboard,
  onLogout,
  onExitRoom
}) => {
  // Check if this device/user is already assigned to a slot
  const myPlayerId = currentUser?.id;
  const myPlayerName = currentUser?.name;

  const currentJoinedSlotKey: 'slot2' | 'slot3' | 'slot4' | null = 
    (room.slots.slot2 && (room.slots.slot2.id === myPlayerId || room.slots.slot2.name === myPlayerName)) ? 'slot2' :
    (room.slots.slot3 && (room.slots.slot3.id === myPlayerId || room.slots.slot3.name === myPlayerName)) ? 'slot3' :
    (room.slots.slot4 && (room.slots.slot4.id === myPlayerId || room.slots.slot4.name === myPlayerName)) ? 'slot4' : null;

  const [name, setName] = useState(currentUser?.name || '');
  const [category, setCategory] = useState<PlayerCategory>(currentUser?.category || '4ta');
  const [position, setPosition] = useState<'drive' | 'reves' | 'ambas'>(currentUser?.favoritePosition || 'ambas');
  const [selectedSlotKey, setSelectedSlotKey] = useState<'slot2' | 'slot3' | 'slot4'>(() => {
    if (!room.slots.slot2) return 'slot2';
    if (!room.slots.slot3) return 'slot3';
    return 'slot4';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa tu nombre de jugador.');
      return;
    }

    // Verify slot is still free
    if (room.slots[selectedSlotKey]) {
      setErrorMsg('Este espacio acaba de ser ocupado por otro jugador. Selecciona otro.');
      return;
    }

    setIsSubmitting(true);
    const newPlayer: CommunityPlayer = {
      id: currentUser?.id || 'guest-' + Math.random().toString(36).substring(2, 8),
      name: name.trim(),
      category,
      favoritePosition: position,
      elo: currentUser?.elo || 1200,
      matchesPlayed: currentUser ? 1 : 0,
      matchesWon: 0,
      winStreak: 0
    };

    const success = await matchSyncService.joinSlot(room.id, selectedSlotKey, newPlayer);
    setIsSubmitting(false);

    if (!success) {
      setErrorMsg('Error al conectar con la sala. Intenta nuevamente.');
    }
  };

  const handleLeave = async () => {
    if (!currentJoinedSlotKey) return;
    setIsSubmitting(true);
    await matchSyncService.leaveSlot(room.id, currentJoinedSlotKey);
    setIsSubmitting(false);
  };

  const isMatchActive = room.status === 'scoreboard' || room.status === 'court_enrollment';

  return (
    <div style={containerStyle}>
      {/* Top Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulsing-dot" style={{ color: 'var(--team1-primary)' }} />
          <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.1rem', color: '#fff' }}>
            PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
          </span>
          <span className="badge badge-team1" style={{ fontSize: '0.65rem' }}>
            SALA EN VIVO
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onExitRoom && (
            <button onClick={onExitRoom} style={exitBtnStyle} title="Volver al inicio">
              <ArrowLeft size={14} />
              <span>Volver</span>
            </button>
          )}
          {currentUser && onLogout && (
            <button onClick={onLogout} style={logoutBtnStyle} title="Cerrar sesión">
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Box */}
      <div style={contentGridStyle}>
        {/* Match Info Card */}
        <div style={matchInfoCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <MapPin size={14} color="var(--team1-primary)" />
                <span>{room.courtName}</span>
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                Partido de {room.hostName}
              </h1>
            </div>

            <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
              Código: {room.id}
            </span>
          </div>

          <div style={rulesTagsRow}>
            <span style={ruleTagItem}>
              {room.rules.format === 'best_of_3' ? 'Mejor de 3 Sets' : '1 Set Pro'}
            </span>
            <span style={ruleTagItem}>
              {room.rules.gameRule === 'golden_point' ? 'Punto de Oro (No-Ad)' : 'Con Ventajas'}
            </span>
            {room.rules.sideChangeEnabled && (
              <span style={ruleTagItem}>
                Cambio de Lado ({room.rules.sideChangeRestSeconds || 90}s)
              </span>
            )}
          </div>

          {/* Quick Notice if Match is Already Active */}
          {isMatchActive && (
            <div style={matchLiveAlertBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="var(--gold-primary)" className="pulsing-dot" />
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff' }}>
                  ¡El partido ya está en juego!
                </span>
              </div>
              <button onClick={onViewLiveScoreboard} style={watchLiveBtnStyle}>
                <Eye size={16} />
                <span>Ver Marcador en Vivo</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 Players Roster Display */}
        <div style={slotsListCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Jugadores en Cancha
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                4 participantes requeridos para iniciar
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="var(--team1-primary)" />
              <span style={{ fontWeight: 900, color: 'var(--team1-primary)', fontSize: '0.9rem' }}>
                {[room.slots.slot1, room.slots.slot2, room.slots.slot3, room.slots.slot4].filter(Boolean).length} / 4
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Slot 1: Host */}
            <div style={{ ...slotCardStyle, borderColor: 'var(--team1-primary)', background: 'rgba(0, 230, 118, 0.08)' }}>
              <div style={slotNumberBadge}>1</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                    {room.slots.slot1.name}
                  </span>
                  <span style={hostPillStyle}>ORGANIZADOR</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Cat: {room.slots.slot1.category} • ELO {room.slots.slot1.elo}
                </div>
              </div>
              <CheckCircle2 size={18} color="var(--team1-primary)" />
            </div>

            {/* Slots 2, 3, 4 */}
            {(['slot2', 'slot3', 'slot4'] as const).map((key, idx) => {
              const slotNumber = idx + 2;
              const player = room.slots[key];
              const isMe = currentJoinedSlotKey === key;

              return (
                <div 
                  key={key} 
                  style={{
                    ...slotCardStyle,
                    borderColor: isMe ? 'var(--gold-primary)' : (player ? 'rgba(0, 176, 255, 0.4)' : 'var(--border-subtle)'),
                    background: isMe ? 'rgba(255, 214, 0, 0.08)' : (player ? 'rgba(0, 176, 255, 0.05)' : 'rgba(0,0,0,0.25)')
                  }}
                >
                  <div style={{
                    ...slotNumberBadge,
                    background: isMe ? 'var(--gold-primary)' : (player ? 'var(--team2-primary)' : 'var(--bg-elevated)'),
                    color: player ? '#070a10' : 'var(--text-muted)'
                  }}>
                    {slotNumber}
                  </div>

                  <div style={{ flex: 1 }}>
                    {player ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                            {player.name}
                          </span>
                          {isMe && <span style={mePillStyle}>TÚ</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Cat: {player.category} • Pos: {player.favoritePosition}
                        </div>
                      </>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                          Espacio {slotNumber} Disponible
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Toca abajo para unirte
                        </div>
                      </div>
                    )}
                  </div>

                  {player ? (
                    <CheckCircle2 size={18} color={isMe ? 'var(--gold-primary)' : 'var(--team2-primary)'} />
                  ) : (
                    <Clock size={16} color="var(--text-dim)" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Join / Status Action Form */}
        <div style={joinActionCardStyle} className="glass-panel">
          {currentJoinedSlotKey ? (
            /* User already joined! */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={successIconBadge}>
                <ShieldCheck size={36} color="var(--team1-primary)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginTop: '10px' }}>
                ¡Estás inscrito en la cancha!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 16px' }}>
                Estás registrado como <strong>{room.slots[currentJoinedSlotKey]?.name}</strong>. Esperando que el organizador confirme las parejas e inicie el partido.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={onViewLiveScoreboard} style={watchLiveBtnPrimaryStyle}>
                  <Eye size={18} />
                  <span>Ver Marcador en Vivo</span>
                </button>
                <button onClick={handleLeave} disabled={isSubmitting} style={leaveBtnStyle}>
                  <span>Cambiar / Salir</span>
                </button>
              </div>
            </div>
          ) : (
            /* Registration / Join Form for new participant */
            <form onSubmit={handleJoin}>
              <div style={{ marginBottom: '14px' }}>
                <span className="badge badge-team1" style={{ marginBottom: '6px' }}>
                  <Sparkles size={12} />
                  UNIRSE AL PARTIDO
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  Ingresa tus datos de jugador
                </h3>
              </div>

              {errorMsg && (
                <div style={errorBannerStyle}>
                  {errorMsg}
                </div>
              )}

              {/* Player Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Tu Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Fernando Belasteguín"
                  style={inputStyle}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Categoría</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {(['1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma', 'Iniciación'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '6px 2px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: category === cat ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                        color: category === cat ? '#070a10' : 'var(--text-muted)',
                        border: '1px solid ' + (category === cat ? 'var(--team1-primary)' : 'var(--border-subtle)')
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Position */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Lado de Cancha Preferido</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'drive', label: 'Derecha (Drive)' },
                    { id: 'reves', label: 'Izquierda (Revés)' },
                    { id: 'ambas', label: 'Indiferente' }
                  ].map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id as any)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: position === pos.id ? 'rgba(0, 230, 118, 0.15)' : 'var(--bg-elevated)',
                        color: position === pos.id ? 'var(--team1-primary)' : 'var(--text-muted)',
                        border: '1px solid ' + (position === pos.id ? 'var(--team1-primary)' : 'var(--border-subtle)')
                      }}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Selector */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Elige tu Posición / Espacio</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(['slot2', 'slot3', 'slot4'] as const).map((key, idx) => {
                    const isTaken = !!room.slots[key];
                    const isSelected = selectedSlotKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isTaken}
                        onClick={() => setSelectedSlotKey(key)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: isTaken ? 'not-allowed' : 'pointer',
                          opacity: isTaken ? 0.4 : 1,
                          background: isSelected ? 'var(--team1-gradient)' : 'var(--bg-elevated)',
                          color: isSelected ? '#070a10' : '#fff',
                          border: '1px solid ' + (isSelected ? 'var(--team1-primary)' : 'var(--border-subtle)')
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>Espacio {idx + 2}</div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                          {isTaken ? 'Ocupado' : 'Disponible'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={submitJoinBtnStyle}
              >
                <span>{isSubmitting ? 'Conectando...' : '¡Unirme al Partido Ahora!'}</span>
                <Trophy size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  background: 'var(--bg-deep)',
  color: 'var(--text-main)',
  boxSizing: 'border-box'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-subtle)',
  maxWidth: '800px',
  margin: '0 auto 16px'
};

const exitBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const logoutBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'rgba(255, 61, 113, 0.1)',
  border: '1px solid rgba(255, 61, 113, 0.3)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--danger-primary)',
  fontSize: '0.78rem',
  fontWeight: 700
};

const contentGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '680px',
  margin: '0 auto'
};

const matchInfoCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: 'var(--radius-lg)'
};

const rulesTagsRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
};

const ruleTagItem: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.75rem',
  color: 'var(--text-muted)'
};

const matchLiveAlertBox: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid var(--gold-primary)',
  borderRadius: 'var(--radius-md)',
  marginTop: '16px'
};

const watchLiveBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'var(--gold-primary)',
  color: '#070a10',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 800,
  fontSize: '0.8rem',
  boxShadow: '0 2px 10px rgba(255, 214, 0, 0.3)'
};

const slotsListCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: 'var(--radius-lg)'
};

const slotCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid',
  transition: 'all var(--transition-fast)'
};

const slotNumberBadge: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const hostPillStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 900,
  padding: '2px 6px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(0, 230, 118, 0.15)',
  color: 'var(--team1-primary)',
  border: '1px solid var(--team1-primary)'
};

const mePillStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 900,
  padding: '2px 6px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(255, 214, 0, 0.2)',
  color: 'var(--gold-primary)',
  border: '1px solid var(--gold-primary)'
};

const joinActionCardStyle: React.CSSProperties = {
  padding: '22px',
  borderRadius: 'var(--radius-lg)'
};

const successIconBadge: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '2px solid var(--team1-primary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 25px var(--team1-glow)'
};

const watchLiveBtnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 20px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: 'var(--radius-md)',
  fontWeight: 900,
  fontSize: '0.9rem',
  boxShadow: '0 4px 18px var(--team1-glow)'
};

const leaveBtnStyle: React.CSSProperties = {
  padding: '12px 18px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  color: 'var(--text-muted)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 700,
  fontSize: '0.85rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const submitJoinBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: 'var(--radius-md)',
  fontWeight: 900,
  fontSize: '0.95rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px var(--team1-glow)'
};

const errorBannerStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255, 61, 113, 0.12)',
  border: '1px solid var(--danger-primary)',
  color: 'var(--danger-primary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.82rem',
  marginBottom: '14px'
};
