import React, { useState } from 'react';
import type { MatchRules, CommunityPlayer } from '../types/padel';
import { communityService } from '../services/communityService';
import type { UserSession } from '../services/authService';
import { 
  QrCode, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  ChevronRight, 
  ArrowLeft
} from 'lucide-react';

interface Props {
  rules: MatchRules;
  hostUser: UserSession;
  matchId: string;
  onConfirmPlayers: (selectedPlayers: [CommunityPlayer, CommunityPlayer, CommunityPlayer, CommunityPlayer]) => void;
  onBackToDashboard: () => void;
}

export const MatchLobbyQrView: React.FC<Props> = ({
  rules,
  hostUser,
  matchId,
  onConfirmPlayers,
  onBackToDashboard
}) => {
  // 4 Player Slots
  const [slot1] = useState<CommunityPlayer>(() => {
    return communityService.findOrCreatePlayer(hostUser.name, hostUser.email);
  });
  const [slot2, setSlot2] = useState<CommunityPlayer | null>(null);
  const [slot3, setSlot3] = useState<CommunityPlayer | null>(null);
  const [slot4, setSlot4] = useState<CommunityPlayer | null>(null);

  const [activeSlotTarget, setActiveSlotTarget] = useState<2 | 3 | 4 | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Available real players from roster (excluding already picked)
  const pickedIds = [slot1?.id, slot2?.id, slot3?.id, slot4?.id].filter(Boolean);
  const availablePlayers = communityService.getPlayers().filter(p => 
    !pickedIds.includes(p.id) && (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Current Share URL with hash
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#match=${matchId}&court=${encodeURIComponent(rules.courtName || 'Padel Central')}`
    : `https://padelmatch.web.app/#match=${matchId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(shareUrl)}&bgcolor=0e1524&color=00e676&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
  };

  const handleSelectPlayer = (player: CommunityPlayer) => {
    if (activeSlotTarget === 2) setSlot2(player);
    else if (activeSlotTarget === 3) setSlot3(player);
    else if (activeSlotTarget === 4) setSlot4(player);
    setActiveSlotTarget(null);
    setNewPlayerName('');
    setSearchQuery('');
  };

  const handleCreateAndAssignPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const created = communityService.addPlayer({
      name: newPlayerName.trim(),
      category: '4ta',
      favoritePosition: 'ambas'
    });

    handleSelectPlayer(created);
  };

  const allPlayersReady = !!(slot1 && slot2 && slot3 && slot4);

  const handleProceed = () => {
    if (allPlayersReady) {
      onConfirmPlayers([slot1, slot2!, slot3!, slot4!]);
    }
  };

  const renderSlotCard = (
    slotNumber: number,
    player: CommunityPlayer | null,
    onRemove?: () => void,
    onAdd?: () => void
  ) => {
    return (
      <div 
        style={{
          ...slotCardStyle,
          borderColor: player ? 'rgba(0, 230, 118, 0.4)' : 'var(--border-subtle)',
          background: player ? 'var(--bg-card)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: player ? 'var(--team1-gradient)' : 'var(--bg-elevated)',
              color: player ? '#070a10' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem'
            }}
          >
            {slotNumber}
          </div>

          <div>
            {player ? (
              <>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                  {player.name}
                  {slotNumber === 1 && (
                    <span style={hostBadgeStyle}>ANFITRIÓN</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <span>Cat: {player.category}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--gold-primary)' }}>ELO: {player.elo}</span>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Jugador {slotNumber} (Esperando)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Escanea el código QR o añádelo abajo
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {player && slotNumber !== 1 ? (
            <button
              onClick={onRemove}
              style={iconBtnStyle}
              title="Quitar jugador"
            >
              <Trash2 size={16} color="var(--danger-primary)" />
            </button>
          ) : !player ? (
            <button
              onClick={onAdd}
              style={addSlotBtnStyle}
            >
              <UserPlus size={14} />
              <span>Agregar</span>
            </button>
          ) : (
            <CheckCircle2 size={20} color="var(--team1-primary)" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      {/* Top Header */}
      <header style={headerStyle}>
        <button onClick={onBackToDashboard} style={backBtnStyle}>
          <ArrowLeft size={18} />
          <span>Configuración</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            SALA DE ESPERA
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--team1-primary)' }}>
            {matchId}
          </div>
        </div>

        <div style={{ width: '80px' }} />
      </header>

      {/* Main Content Layout */}
      <div style={contentGridStyle}>
        {/* Left Column: QR Code & Link */}
        <div style={qrCardStyle} className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span className="badge badge-team1" style={{ marginBottom: '8px' }}>
              <QrCode size={12} />
              CÓDIGO QR EN CANCHA
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Escanear para Sumarse</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Los participantes pueden apuntar la cámara de su celular
            </p>
          </div>

          <div style={qrWrapperStyle}>
            <img 
              src={qrImageUrl} 
              alt="Código QR de incorporación al partido" 
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }} 
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              style={linkInputStyle} 
            />
            <button 
              onClick={handleCopyLink} 
              style={copyBtnStyle}
              title="Copiar enlace"
            >
              {copiedLink ? <Check size={16} color="var(--team1-primary)" /> : <Copy size={16} />}
              <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div style={rulesSummaryPillStyle}>
            <span>{rules.courtName}</span>
            <span>•</span>
            <span>{rules.gameRule === 'golden_point' ? 'Punto de Oro' : 'Ventajas'}</span>
            <span>•</span>
            <span>{rules.format === 'best_of_3' ? 'Mejor de 3' : '1 Set Pro'}</span>
          </div>
        </div>

        {/* Right Column: 4 Player Slots */}
        <div style={slotsCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--team1-primary)" />
                Jugadores de la Cancha
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Se requieren 4 participantes para el partido
              </p>
            </div>

            <div style={statusBadgeStyle}>
              <Clock size={14} color="var(--gold-primary)" />
              <span>{[slot1, slot2, slot3, slot4].filter(Boolean).length} / 4 Listos</span>
            </div>
          </div>

          {/* Slots List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renderSlotCard(1, slot1)}
            {renderSlotCard(2, slot2, () => setSlot2(null), () => setActiveSlotTarget(2))}
            {renderSlotCard(3, slot3, () => setSlot3(null), () => setActiveSlotTarget(3))}
            {renderSlotCard(4, slot4, () => setSlot4(null), () => setActiveSlotTarget(4))}
          </div>

          {/* CTA Button when 4 ready */}
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={handleProceed}
              disabled={!allPlayersReady}
              style={{
                ...proceedBtnStyle,
                opacity: allPlayersReady ? 1 : 0.45,
                cursor: allPlayersReady ? 'pointer' : 'not-allowed',
                boxShadow: allPlayersReady ? '0 4px 25px var(--team1-glow)' : 'none'
              }}
            >
              <span>{allPlayersReady ? 'Confirmar y Asignar Parejas' : 'Esperando 4 Jugadores...'}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Quick Player Selector */}
      {activeSlotTarget !== null && (
        <div style={modalBackdropStyle} onClick={() => setActiveSlotTarget(null)}>
          <div style={modalDialogStyle} className="glass-panel" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px' }}>
              Agregar Jugador a la Posición {activeSlotTarget}
            </h3>

            {/* Quick add custom name */}
            <form onSubmit={handleCreateAndAssignPlayer} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  required
                  placeholder="Escribir nombre del jugador..."
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  style={searchInputStyle}
                />
                <button type="submit" style={assignBtnStyle}>
                  Agregar
                </button>
              </div>
            </form>

            {/* Existing Roster */}
            {availablePlayers.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  O seleccionar de la comunidad:
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {availablePlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPlayer(p)}
                      style={rosterItemBtnStyle}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Cat: {p.category} • ELO: {p.elo}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--team1-primary)', fontWeight: 700 }}>
                        Elegir →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => setActiveSlotTarget(null)}
              style={closeModalBtnStyle}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
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
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-subtle)'
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
  fontWeight: 600
};

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px',
  maxWidth: '1000px',
  margin: '0 auto'
};

const qrCardStyle: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 'var(--radius-lg)'
};

const qrWrapperStyle: React.CSSProperties = {
  width: '240px',
  height: '240px',
  padding: '8px',
  background: 'var(--bg-card)',
  border: '2px solid rgba(0, 230, 118, 0.3)',
  borderRadius: '16px',
  boxShadow: '0 0 30px rgba(0, 230, 118, 0.15)'
};

const linkInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-muted)',
  fontSize: '0.8rem',
  outline: 'none'
};

const copyBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  color: '#fff',
  fontSize: '0.85rem',
  fontWeight: 700
};

const rulesSummaryPillStyle: React.CSSProperties = {
  marginTop: '16px',
  display: 'flex',
  gap: '8px',
  fontSize: '0.75rem',
  color: 'var(--text-dim)',
  padding: '6px 12px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 'var(--radius-full)'
};

const slotsCardStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: 'var(--radius-lg)'
};

const statusBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--gold-primary)'
};

const slotCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  border: '1px solid',
  borderRadius: 'var(--radius-md)',
  transition: 'all var(--transition-fast)'
};

const hostBadgeStyle: React.CSSProperties = {
  marginLeft: '8px',
  fontSize: '0.65rem',
  fontWeight: 800,
  padding: '2px 6px',
  background: 'rgba(0, 230, 118, 0.2)',
  color: 'var(--team1-primary)',
  borderRadius: '4px'
};

const addSlotBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--team1-primary)'
};

const iconBtnStyle: React.CSSProperties = {
  padding: '8px',
  background: 'rgba(255, 61, 113, 0.1)',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const proceedBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: 'var(--radius-md)',
  fontWeight: 900,
  fontSize: '1.05rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 1000
};

const modalDialogStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  padding: '20px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-card)'
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none'
};

const assignBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: 'var(--team1-primary)',
  color: '#070a10',
  fontWeight: 800,
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.85rem'
};

const rosterItemBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  textAlign: 'left'
};

const closeModalBtnStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '14px',
  padding: '10px',
  background: 'transparent',
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
  fontWeight: 600,
  textAlign: 'center'
};
