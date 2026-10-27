import React, { useState } from 'react';
import type { Team, Player, CommunityPlayer, HeadToHeadStats } from '../types/padel';
import { communityService } from '../services/communityService';
import { isImageAvatar } from '../utils/imageOptimizer';
import { 
  Users, 
  Search, 
  UserPlus, 
  Swords, 
  ArrowRight, 
  Trophy, 
  X,
  History
} from 'lucide-react';

interface Props {
  teams: { team1: Team; team2: Team };
  onUpdateTeams: (updated: { team1: Team; team2: Team }) => void;
  onProceedToScoreboard: () => void;
  courtName: string;
}

export const CourtEnrollmentView: React.FC<Props> = ({
  teams,
  onUpdateTeams,
  onProceedToScoreboard,
  courtName
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ teamId: 'team1' | 'team2'; slot: 'player1' | 'player2' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Calculate Head-to-Head between current selected teams
  const t1Players = [teams.team1.player1.name, teams.team1.player2.name];
  const t2Players = [teams.team2.player1.name, teams.team2.player2.name];
  const h2h: HeadToHeadStats = communityService.getHeadToHead(t1Players, t2Players);

  // Search results
  const searchResults = communityService.searchPlayer(searchQuery);

  const handleAssignPlayer = (cp: CommunityPlayer) => {
    if (!selectedSlot) return;

    const { teamId, slot } = selectedSlot;
    const isDrive = slot === 'player1';

    const updatedPlayer: Player = {
      id: cp.id,
      name: cp.name,
      position: isDrive ? 'drive' : 'reves',
      avatar: cp.avatar,
      elo: cp.elo,
      category: cp.category,
      email: cp.email,
      phone: cp.phone
    };

    const nextTeams = {
      ...teams,
      [teamId]: {
        ...teams[teamId],
        [slot]: updatedPlayer
      }
    };

    onUpdateTeams(nextTeams);
    setSelectedSlot(null);
    setSearchQuery('');
  };

  const handleCreateAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedSlot) return;

    const cp = communityService.findOrCreatePlayer(newName, newEmail, newPhone);
    handleAssignPlayer(cp);
    setIsCreatingNew(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
  };

  const renderCourtAvatar = (avatar?: string, fallbackColor = 'var(--team1-primary)') => {
    if (!avatar) return <Users size={20} color={fallbackColor} />;
    if (isImageAvatar(avatar)) {
      return <img src={avatar} alt="" style={avatarImgStyle} />;
    }
    return <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{avatar}</span>;
  };

  return (
    <div style={containerStyle}>
      {/* Top Banner */}
      <div style={headerStyle} className="glass-panel">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-gold">Módulo B • Autoinscripción en Cancha</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{courtName}</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '4px', color: 'var(--text-main)' }}>
            Alineación en Cancha & Reconocimiento de Historial
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Selecciona la posición de cada jugador (Drive o Revés). El sistema carga automáticamente su ELO y enfrentamientos previos.
          </p>
        </div>

        <button onClick={onProceedToScoreboard} style={startMatchBtnStyle}>
          <span>Ir al Marcador en Vivo</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Main Court Grid & Visual Representation */}
      <div style={courtGridWrapper}>
        {/* Visual 2D Padel Court */}
        <div style={court2DContainer}>
          <div style={courtGrassStyle}>
            {/* Net (Red Central) */}
            <div style={netStyle}>
              <div style={netTapeStyle}>RED CENTRAL</div>
            </div>

            {/* Service lines and center line */}
            <div style={courtLinesOverlay}>
              <div style={serviceLineTop} />
              <div style={serviceLineBottom} />
              <div style={centerCourtLine} />
            </div>

            {/* TEAM 1 SIDE (Top / Green Accent) */}
            <div style={courtHalfStyle}>
              <div style={teamSideBadgeT1}>
                PAREJA 1: {teams.team1.name}
              </div>

              <div style={playersPositionsRow}>
                {/* Drive (Right side for Team 1) */}
                <div 
                  onClick={() => setSelectedSlot({ teamId: 'team1', slot: 'player1' })}
                  style={{
                    ...playerSlotCardStyle,
                    borderColor: 'var(--team1-primary)',
                    background: 'rgba(0, 230, 118, 0.12)'
                  }}
                >
                  <div style={positionTag}>DRIVE (Derecha)</div>
                  <div style={slotAvatarStyle}>
                    {renderCourtAvatar(teams.team1.player1.avatar, 'var(--team1-primary)')}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                    {teams.team1.player1.name}
                  </div>
                  <div style={eloBadgeStyle}>
                    ⚡ ELO {teams.team1.player1.elo || 1200}
                  </div>
                  <span style={tapToChangePrompt}>Toca para cambiar</span>
                </div>

                {/* Revés (Left side for Team 1) */}
                <div 
                  onClick={() => setSelectedSlot({ teamId: 'team1', slot: 'player2' })}
                  style={{
                    ...playerSlotCardStyle,
                    borderColor: 'var(--team1-primary)',
                    background: 'rgba(0, 230, 118, 0.12)'
                  }}
                >
                  <div style={positionTag}>REVÉS (Izquierda)</div>
                  <div style={slotAvatarStyle}>
                    {renderCourtAvatar(teams.team1.player2.avatar, 'var(--team1-primary)')}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                    {teams.team1.player2.name}
                  </div>
                  <div style={eloBadgeStyle}>
                    ⚡ ELO {teams.team1.player2.elo || 1200}
                  </div>
                  <span style={tapToChangePrompt}>Toca para cambiar</span>
                </div>
              </div>
            </div>

            {/* TEAM 2 SIDE (Bottom / Cyan Accent) */}
            <div style={courtHalfStyle}>
              <div style={teamSideBadgeT2}>
                PAREJA 2: {teams.team2.name}
              </div>

              <div style={playersPositionsRow}>
                {/* Revés (Left side for Team 2) */}
                <div 
                  onClick={() => setSelectedSlot({ teamId: 'team2', slot: 'player2' })}
                  style={{
                    ...playerSlotCardStyle,
                    borderColor: 'var(--team2-primary)',
                    background: 'rgba(0, 176, 255, 0.12)'
                  }}
                >
                  <div style={{ ...positionTag, color: 'var(--team2-primary)' }}>REVÉS (Izquierda)</div>
                  <div style={{ ...slotAvatarStyle, borderColor: 'rgba(0, 176, 255, 0.4)' }}>
                    {renderCourtAvatar(teams.team2.player2.avatar, 'var(--team2-primary)')}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                    {teams.team2.player2.name}
                  </div>
                  <div style={{ ...eloBadgeStyle, color: 'var(--team2-primary)', borderColor: 'rgba(0, 176, 255, 0.3)' }}>
                    ⚡ ELO {teams.team2.player2.elo || 1200}
                  </div>
                  <span style={tapToChangePrompt}>Toca para cambiar</span>
                </div>

                {/* Drive (Right side for Team 2) */}
                <div 
                  onClick={() => setSelectedSlot({ teamId: 'team2', slot: 'player1' })}
                  style={{
                    ...playerSlotCardStyle,
                    borderColor: 'var(--team2-primary)',
                    background: 'rgba(0, 176, 255, 0.12)'
                  }}
                >
                  <div style={{ ...positionTag, color: 'var(--team2-primary)' }}>DRIVE (Derecha)</div>
                  <div style={{ ...slotAvatarStyle, borderColor: 'rgba(0, 176, 255, 0.4)' }}>
                    {renderCourtAvatar(teams.team2.player1.avatar, 'var(--team2-primary)')}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                    {teams.team2.player1.name}
                  </div>
                  <div style={{ ...eloBadgeStyle, color: 'var(--team2-primary)', borderColor: 'rgba(0, 176, 255, 0.3)' }}>
                    ⚡ ELO {teams.team2.player1.elo || 1200}
                  </div>
                  <span style={tapToChangePrompt}>Toca para cambiar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Head-to-Head & Intelligence Card (Right Side) */}
        <div style={h2hCardStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Swords size={20} color="var(--gold-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Historial Cruzado Directo (H2H)
            </h3>
          </div>

          {/* Comparison summary */}
          <div style={h2hStatsSummary}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--team1-primary)' }}>
                {h2h.team1Wins}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                VICTORIAS {teams.team1.name}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                {h2h.matchesPlayed} Enfrentamientos
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Historial Registrado
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--team2-primary)' }}>
                {h2h.team2Wins}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                VICTORIAS {teams.team2.name}
              </div>
            </div>
          </div>

          {/* Win percentage gauge */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Probabilidad Estimada (ELO)</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {h2h.team1Wins >= h2h.team2Wins ? '52% vs 48%' : '47% vs 53%'}
              </span>
            </div>
            <div style={progressTrackStyle}>
              <div style={{ ...progressFillStyle, width: '52%', background: 'var(--team1-primary)' }} />
              <div style={{ ...progressFillStyle, width: '48%', background: 'var(--team2-primary)' }} />
            </div>
          </div>

          {/* Recent matches list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              <History size={14} color="var(--gold-primary)" />
              <span>Últimos Partidos Registrados</span>
            </div>

            {h2h.recentResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {h2h.recentResults.map((r, i) => (
                  <div key={i} style={pastMatchRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Trophy size={14} color={r.winner === 'team1' ? 'var(--team1-primary)' : 'var(--team2-primary)'} />
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: r.winner === 'team1' ? 'var(--team1-primary)' : 'var(--team2-primary)' }}>
                        {r.winner === 'team1' ? teams.team1.name : teams.team2.name}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700 }}>
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyH2HStyle}>
                <span>Primer enfrentamiento registrado entre estas dos parejas.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Select or Create Player */}
      {selectedSlot && (
        <div style={modalOverlayStyle}>
          <div style={pickerModalStyle} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Asignar Jugador • {selectedSlot.teamId === 'team1' ? teams.team1.name : teams.team2.name} ({selectedSlot.slot === 'player1' ? 'Drive' : 'Revés'})
              </h3>
              <button onClick={() => setSelectedSlot(null)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            {!isCreatingNew ? (
              <>
                {/* Search input */}
                <div style={searchRowStyle}>
                  <Search size={18} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o celular..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={searchInputStyle}
                    autoFocus
                  />
                </div>

                {/* Quick Results */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                  {searchResults.map(cp => (
                    <div 
                      key={cp.id} 
                      onClick={() => handleAssignPlayer(cp)}
                      style={playerResultItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={miniAvatarStyle}>
                          {renderCourtAvatar(cp.avatar, 'var(--team1-primary)')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{cp.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {cp.category} Cat • {cp.matchesPlayed} PJ ({Math.round((cp.matchesWon / (cp.matchesPlayed || 1)) * 100)}% Win)
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                          ⚡ {cp.elo}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ELO</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={() => setIsCreatingNew(true)} 
                  style={addNewPlayerBtn}
                >
                  <UserPlus size={16} />
                  <span>+ Crear nuevo jugador al instante</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleCreateAndAssign}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={inputLabelStyle}>Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Nicolás Jarry"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={modalInputStyle}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={inputLabelStyle}>Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    placeholder="ejemplo@padel.cl"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={inputLabelStyle}>Teléfono WhatsApp (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsCreatingNew(false)} style={cancelBtnStyle}>
                    Volver a Búsqueda
                  </button>
                  <button type="submit" style={saveNewBtnStyle}>
                    Guardar y Asignar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  minHeight: '100dvh',
  boxSizing: 'border-box'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderRadius: '20px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-subtle)'
};

const startMatchBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 22px',
  borderRadius: '12px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.95rem',
  boxShadow: '0 4px 16px var(--team1-glow)'
};

const courtGridWrapper: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
  gap: '16px',
  flex: 1
};

const court2DContainer: React.CSSProperties = {
  background: '#070a12',
  border: '2px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '24px',
  padding: '16px',
  position: 'relative',
  boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
};

const courtGrassStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #09172e 0%, #0d2345 50%, #09172e 100%)',
  border: '3px solid rgba(255, 255, 255, 0.4)',
  borderRadius: '16px',
  minHeight: '520px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  padding: '16px',
  overflow: 'hidden'
};

const courtHalfStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  zIndex: 2
};

const teamSideBadgeT1: React.CSSProperties = {
  alignSelf: 'center',
  padding: '4px 14px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  color: 'var(--team1-primary)',
  fontWeight: 900,
  fontSize: '0.8rem',
  letterSpacing: '0.04em'
};

const teamSideBadgeT2: React.CSSProperties = {
  alignSelf: 'center',
  padding: '4px 14px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(0, 176, 255, 0.15)',
  border: '1px solid rgba(0, 176, 255, 0.4)',
  color: 'var(--team2-primary)',
  fontWeight: 900,
  fontSize: '0.8rem',
  letterSpacing: '0.04em'
};

const playersPositionsRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px'
};

const playerSlotCardStyle: React.CSSProperties = {
  border: '2px dashed',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative'
};

const positionTag: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 900,
  letterSpacing: '0.05em',
  color: 'var(--team1-primary)',
  marginBottom: '6px'
};

const slotAvatarStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  border: '2px solid rgba(0, 230, 118, 0.4)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.4)',
  marginBottom: '8px'
};

const avatarImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const eloBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.72rem',
  fontWeight: 800,
  fontFamily: 'var(--font-mono)',
  color: 'var(--team1-primary)',
  marginTop: '4px'
};

const tapToChangePrompt: React.CSSProperties = {
  fontSize: '0.65rem',
  color: 'var(--text-dim)',
  marginTop: '6px'
};

const netStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  background: 'repeating-linear-gradient(90deg, #ffffff 0, #ffffff 4px, transparent 4px, transparent 8px)',
  borderTop: '2px solid #ffffff',
  borderBottom: '2px solid #ffffff',
  margin: '12px 0',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1
};

const netTapeStyle: React.CSSProperties = {
  background: '#ffffff',
  color: '#070a12',
  padding: '2px 10px',
  fontSize: '0.65rem',
  fontWeight: 900,
  borderRadius: '4px',
  letterSpacing: '0.08em'
};

const courtLinesOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1
};

const serviceLineTop: React.CSSProperties = {
  position: 'absolute',
  top: '25%',
  left: 0,
  right: 0,
  height: '2px',
  background: 'rgba(255, 255, 255, 0.3)'
};

const serviceLineBottom: React.CSSProperties = {
  position: 'absolute',
  bottom: '25%',
  left: 0,
  right: 0,
  height: '2px',
  background: 'rgba(255, 255, 255, 0.3)'
};

const centerCourtLine: React.CSSProperties = {
  position: 'absolute',
  top: '25%',
  bottom: '25%',
  left: '50%',
  width: '2px',
  background: 'rgba(255, 255, 255, 0.3)'
};

const h2hCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '24px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-subtle)',
  display: 'flex',
  flexDirection: 'column'
};

const h2hStatsSummary: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  padding: '16px',
  background: 'var(--bg-elevated)',
  borderRadius: '16px',
  marginBottom: '16px',
  border: '1px solid var(--border-subtle)'
};

const progressTrackStyle: React.CSSProperties = {
  height: '6px',
  borderRadius: '3px',
  background: 'rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  display: 'flex'
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.3s ease'
};

const pastMatchRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)'
};

const emptyH2HStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '12px',
  color: 'var(--text-dim)',
  fontSize: '0.82rem',
  fontStyle: 'italic'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 8, 15, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const pickerModalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '20px',
  padding: '20px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
};

const closeBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'var(--text-muted)'
};

const searchRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  background: 'var(--bg-input, #ffffff)',
  borderRadius: '12px',
  border: '1.5px solid var(--border-medium)',
  marginBottom: '12px'
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  fontFamily: 'inherit'
};

const playerResultItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: '10px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-subtle)',
  marginBottom: '6px',
  cursor: 'pointer',
  transition: 'background 0.2s'
};

const miniAvatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  overflow: 'hidden',
  background: 'var(--bg-elevated)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const addNewPlayerBtn: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  borderRadius: '10px',
  background: 'rgba(0, 230, 118, 0.1)',
  color: 'var(--team1-primary)',
  border: '1px dashed rgba(0, 230, 118, 0.4)',
  fontWeight: 700,
  fontSize: '0.85rem'
};

const inputLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: '4px'
};

const modalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '8px',
  color: 'var(--text-main)',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  outline: 'none'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-subtle)',
  color: 'var(--text-main)',
  fontWeight: 600,
  fontSize: '0.85rem'
};

const saveNewBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '8px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 800,
  fontSize: '0.85rem'
};
