import React, { useState } from 'react';
import type { 
  MatchRules, 
  Team, 
  MatchFormat, 
  GameRule, 
  TieBreakRule, 
  ThirdSetRule, 
  SuperTieBreakTarget 
} from '../types/padel';
import type { UserSession } from '../services/authService';
import { partnerService } from '../services/partnerService';
import { Settings2, X } from 'lucide-react';
import { ClubSelectCombobox } from './ClubSelectCombobox';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserSession | null;
  rules: MatchRules;
  teams: { team1: Team; team2: Team };
  onStartMatch: (newRules: MatchRules, newTeams: { team1: Team; team2: Team }) => void;
}

export const MatchSetupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  rules,
  teams,
  onStartMatch
}) => {
  interface AssignedPlayer {
    id: string;
    name: string;
    elo: number;
    isPartner: boolean;
    isHost: boolean;
    category?: string;
  }

  const partners = currentUser ? partnerService.getPartners(currentUser) : [];

  const [localRules, setLocalRules] = useState<MatchRules>(rules);
  const [team1Name, setTeam1Name] = useState(teams.team1.name);
  const [team2Name, setTeam2Name] = useState(teams.team2.name);

  // Slot 1: Team 1 Drive
  const [p1, setP1] = useState<AssignedPlayer>(() => ({
    id: currentUser?.id || teams.team1.player1.id || 'p1',
    name: currentUser?.name || teams.team1.player1.name || 'Jugador 1',
    elo: currentUser?.elo || teams.team1.player1.elo || 1200,
    isPartner: false,
    isHost: !!currentUser,
    category: currentUser?.category
  }));

  // Slot 2: Team 1 Revés
  const [p2, setP2] = useState<AssignedPlayer>(() => {
    // If user has a first partner, default to them or fallback to team1.player2
    const firstPartner = partners[0];
    if (firstPartner && (!teams.team1.player2.name || teams.team1.player2.name === 'Jugador 2')) {
      return {
        id: firstPartner.id,
        name: firstPartner.name,
        elo: firstPartner.elo,
        isPartner: true,
        isHost: false,
        category: firstPartner.category
      };
    }
    return {
      id: teams.team1.player2.id || 'p2',
      name: teams.team1.player2.name || 'Jugador 2',
      elo: teams.team1.player2.elo || 1200,
      isPartner: false,
      isHost: false,
      category: teams.team1.player2.category
    };
  });

  // Slot 3: Team 2 Drive
  const [p3, setP3] = useState<AssignedPlayer>(() => ({
    id: teams.team2.player1.id || 'p3',
    name: teams.team2.player1.name || 'Jugador 3',
    elo: teams.team2.player1.elo || 1200,
    isPartner: false,
    isHost: false,
    category: teams.team2.player1.category
  }));

  // Slot 4: Team 2 Revés
  const [p4, setP4] = useState<AssignedPlayer>(() => ({
    id: teams.team2.player2.id || 'p4',
    name: teams.team2.player2.name || 'Jugador 4',
    elo: teams.team2.player2.elo || 1200,
    isPartner: false,
    isHost: false,
    category: teams.team2.player2.category
  }));

  const [courtName, setCourtName] = useState(rules.courtName || 'Pista 1');
  const [selectedClub, setSelectedClub] = useState(() => {
    if (rules.courtName && rules.courtName.includes(' - ')) {
      return rules.courtName.split(' - ')[1].trim();
    }
    return '';
  });
  const [specificCourt, setSpecificCourt] = useState(() => {
    if (rules.courtName && rules.courtName.includes(' - ')) {
      return rules.courtName.split(' - ')[0].trim();
    }
    return rules.courtName || 'Pista 1';
  });

  const handleClubChange = (clubName: string) => {
    setSelectedClub(clubName);
    if (clubName) {
      setCourtName(`${specificCourt || 'Pista 1'} - ${clubName}`);
    } else {
      setCourtName(specificCourt || 'Pista 1');
    }
  };

  const handleSpecificCourtChange = (val: string) => {
    setSpecificCourt(val);
    if (selectedClub) {
      setCourtName(`${val || 'Pista 1'} - ${selectedClub}`);
    } else {
      setCourtName(val || 'Pista 1');
    }
  };

  if (!isOpen) return null;

  const handleAssignPlayer = (
    setter: React.Dispatch<React.SetStateAction<AssignedPlayer>>,
    value: string
  ) => {
    if (value === 'host' && currentUser) {
      setter({
        id: currentUser.id,
        name: currentUser.name,
        elo: currentUser.elo,
        isPartner: false,
        isHost: true,
        category: currentUser.category
      });
    } else if (value.startsWith('partner_')) {
      const partnerId = value.replace('partner_', '');
      const part = partners.find(p => p.id === partnerId);
      if (part) {
        setter({
          id: part.id,
          name: part.name,
          elo: part.elo,
          isPartner: true,
          isHost: false,
          category: part.category
        });
      }
    } else {
      // Guest
      setter(prev => ({
        ...prev,
        id: `guest_${Math.random().toString(36).substring(2, 7)}`,
        isPartner: false,
        isHost: false
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalT1Name = team1Name.trim() || `${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}`;
    const finalT2Name = team2Name.trim() || `${p3.name.split(' ')[0]} & ${p4.name.split(' ')[0]}`;

    const updatedTeams = {
      team1: {
        ...teams.team1,
        name: finalT1Name,
        player1: {
          ...teams.team1.player1,
          id: p1.id,
          name: p1.name.trim() || 'Jugador 1',
          elo: p1.elo,
          category: p1.category as any
        },
        player2: {
          ...teams.team1.player2,
          id: p2.id,
          name: p2.name.trim() || 'Jugador 2',
          elo: p2.elo,
          category: p2.category as any
        }
      },
      team2: {
        ...teams.team2,
        name: finalT2Name,
        player1: {
          ...teams.team2.player1,
          id: p3.id,
          name: p3.name.trim() || 'Jugador 3',
          elo: p3.elo,
          category: p3.category as any
        },
        player2: {
          ...teams.team2.player2,
          id: p4.id,
          name: p4.name.trim() || 'Jugador 4',
          elo: p4.elo,
          category: p4.category as any
        }
      }
    };

    onStartMatch({ ...localRules, courtName }, updatedTeams);
    onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBadgeStyle}>
                <Settings2 size={22} color="var(--team1-primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Configuración de Partido</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Reglas oficiales parametrizables y asignación de parejas en pista
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Cerrar modal">
              <X size={20} />
            </button>
          </div>

          {/* Section: Match Format */}
          <div style={{ marginBottom: '18px' }}>
            <label style={sectionTitleStyle}>Formato de Sets</label>
            <div style={optionsGridStyle}>
              {[
                { id: 'best_of_3', label: 'Al mejor de 3', desc: 'Estándar Oficial' },
                { id: 'best_of_5', label: 'Al mejor de 5', desc: 'Torneo Mayor' },
                { id: 'single_set', label: 'Set Único', desc: 'Entrenamiento / Pro-Set' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setLocalRules(prev => ({ ...prev, format: opt.id as MatchFormat }))}
                  style={{
                    ...optionCardStyle,
                    borderColor: localRules.format === opt.id ? 'var(--team1-primary)' : 'var(--border-subtle)',
                    background: localRules.format === opt.id ? 'rgba(0, 230, 118, 0.1)' : 'var(--bg-elevated)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: localRules.format === opt.id ? 'var(--team1-primary)' : '#fff' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Game Rule (Punto de Oro vs Ventaja) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={sectionTitleStyle}>Regla de Game / Cierre a 40-40</label>
            <div style={optionsGridStyle}>
              {[
                {
                  id: 'golden_point',
                  label: '⭐ Punto de Oro (No-Ad)',
                  desc: '40-40 define el game inmediatamente (Premier Padel)'
                },
                {
                  id: 'advantage',
                  label: '⚖️ Con Ventaja (Deuce)',
                  desc: 'Requiere diferencia de 2 puntos tras el 40-40 tradicional'
                }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setLocalRules(prev => ({ ...prev, gameRule: opt.id as GameRule }))}
                  style={{
                    ...optionCardStyle,
                    borderColor: localRules.gameRule === opt.id ? 'var(--gold-primary)' : 'var(--border-subtle)',
                    background: localRules.gameRule === opt.id ? 'rgba(255, 214, 0, 0.1)' : 'var(--bg-elevated)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: localRules.gameRule === opt.id ? 'var(--gold-primary)' : '#fff' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Tie Break & Deciding Set Rule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={sectionTitleStyle}>Tie-Break en 6-6</label>
              <select
                value={localRules.tieBreakRule}
                onChange={e => setLocalRules(prev => ({ ...prev, tieBreakRule: e.target.value as TieBreakRule }))}
                style={selectStyle}
              >
                <option value="standard">Estándar a 7 puntos</option>
                <option value="long_set">Set Largo (diferencia de 2 games)</option>
              </select>
            </div>
            <div>
              <label style={sectionTitleStyle}>Definición 3er Set</label>
              <select
                value={localRules.thirdSetRule}
                onChange={e => setLocalRules(prev => ({ ...prev, thirdSetRule: e.target.value as ThirdSetRule }))}
                style={selectStyle}
              >
                <option value="super_tiebreak">Súper Tie-Break</option>
                <option value="full_set">Set Completo</option>
              </select>
            </div>
          </div>

          {localRules.thirdSetRule === 'super_tiebreak' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={sectionTitleStyle}>Puntos Objetivo del Súper Tie-Break</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[10, 12, 13].map(target => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setLocalRules(prev => ({ ...prev, superTieBreakTarget: target as SuperTieBreakTarget }))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: localRules.superTieBreakTarget === target ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                      color: localRules.superTieBreakTarget === target ? '#000' : '#fff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    A {target} puntos
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Side Change & Rest */}
          <div style={{ marginBottom: '18px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label style={{ ...sectionTitleStyle, marginBottom: '2px' }}>Cambio de Lado (Juegos Impares)</label>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Cambio de cancha en games 1, 3, 5 y descanso reglamentario FIP
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setLocalRules(prev => ({ ...prev, sideChangeEnabled: true }))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: localRules.sideChangeEnabled !== false ? 'var(--team1-primary)' : 'rgba(255,255,255,0.05)',
                    color: localRules.sideChangeEnabled !== false ? '#000' : 'var(--text-muted)',
                    border: '1px solid ' + (localRules.sideChangeEnabled !== false ? 'var(--team1-primary)' : 'var(--border-subtle)')
                  }}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setLocalRules(prev => ({ ...prev, sideChangeEnabled: false }))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: localRules.sideChangeEnabled === false ? 'var(--danger-primary)' : 'rgba(255,255,255,0.05)',
                    color: localRules.sideChangeEnabled === false ? '#fff' : 'var(--text-muted)',
                    border: '1px solid ' + (localRules.sideChangeEnabled === false ? 'var(--danger-primary)' : 'var(--border-subtle)')
                  }}
                >
                  No
                </button>
              </div>
            </div>

            {localRules.sideChangeEnabled !== false && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700 }}>
                  DURACIÓN DEL DESCANSO
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { secs: 60, label: '60s' },
                    { secs: 90, label: '90s (FIP)' },
                    { secs: 120, label: '120s' },
                    { secs: 0, label: 'Sin descanso' }
                  ].map(item => (
                    <button
                      key={item.secs}
                      type="button"
                      onClick={() => setLocalRules(prev => ({ ...prev, sideChangeRestSeconds: item.secs }))}
                      style={{
                        padding: '6px 2px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: (localRules.sideChangeRestSeconds ?? 90) === item.secs ? 'rgba(0, 230, 118, 0.15)' : 'var(--bg-card)',
                        borderColor: (localRules.sideChangeRestSeconds ?? 90) === item.secs ? 'var(--team1-primary)' : 'var(--border-subtle)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: (localRules.sideChangeRestSeconds ?? 90) === item.secs ? 'var(--team1-primary)' : 'var(--text-muted)'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Teams & Roster */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={sectionTitleStyle}>Parejas y Jugadores en Pista</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {partners.length} Partners disponibles para asociar
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Team 1 */}
              <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.25)', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--team1-primary)', display: 'block', marginBottom: '8px' }}>
                  PAREJA 1
                </span>
                <input
                  type="text"
                  placeholder="Nombre Pareja (ej: Galán & Chingotto)"
                  value={team1Name}
                  onChange={e => setTeam1Name(e.target.value)}
                  style={inputStyle}
                />

                {/* Team 1 - Player 1 (Drive) */}
                <div style={playerSlotBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={slotLabel}>DRIVE (DERECHA)</span>
                    {p1.isHost ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>⭐ Anfitrión Host</span>
                    ) : p1.isPartner ? (
                      <span className="badge badge-team1" style={{ fontSize: '0.62rem' }}>🤝 Partner (ELO {p1.elo})</span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>👤 Invitado</span>
                    )}
                  </div>
                  <select
                    value={p1.isHost ? 'host' : p1.isPartner ? `partner_${p1.id}` : 'guest'}
                    onChange={e => handleAssignPlayer(setP1, e.target.value)}
                    style={{ ...selectStyle, padding: '6px 8px', fontSize: '0.78rem', marginBottom: '6px' }}
                  >
                    <option value="guest">👤 Jugador Invitado / Genérico</option>
                    {currentUser && <option value="host">⭐ Yo ({currentUser.name})</option>}
                    {partners.length > 0 && (
                      <optgroup label="Mis Partners Conectados">
                        {partners.map(part => (
                          <option key={part.id} value={`partner_${part.id}`}>
                            🤝 {part.name} ({part.category} Cat • ELO {part.elo})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre en pista"
                    value={p1.name}
                    onChange={e => setP1(prev => ({ ...prev, name: e.target.value }))}
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Team 1 - Player 2 (Revés) */}
                <div style={playerSlotBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={slotLabel}>REVÉS (IZQUIERDA)</span>
                    {p2.isHost ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>⭐ Anfitrión Host</span>
                    ) : p2.isPartner ? (
                      <span className="badge badge-team1" style={{ fontSize: '0.62rem' }}>🤝 Partner (ELO {p2.elo})</span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>👤 Invitado</span>
                    )}
                  </div>
                  <select
                    value={p2.isHost ? 'host' : p2.isPartner ? `partner_${p2.id}` : 'guest'}
                    onChange={e => handleAssignPlayer(setP2, e.target.value)}
                    style={{ ...selectStyle, padding: '6px 8px', fontSize: '0.78rem', marginBottom: '6px' }}
                  >
                    <option value="guest">👤 Jugador Invitado / Genérico</option>
                    {currentUser && <option value="host">⭐ Yo ({currentUser.name})</option>}
                    {partners.length > 0 && (
                      <optgroup label="Mis Partners Conectados">
                        {partners.map(part => (
                          <option key={part.id} value={`partner_${part.id}`}>
                            🤝 {part.name} ({part.category} Cat • ELO {part.elo})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre en pista"
                    value={p2.name}
                    onChange={e => setP2(prev => ({ ...prev, name: e.target.value }))}
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Team 2 */}
              <div style={{ background: 'rgba(0, 176, 255, 0.05)', border: '1px solid rgba(0, 176, 255, 0.25)', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--team2-primary)', display: 'block', marginBottom: '8px' }}>
                  PAREJA 2
                </span>
                <input
                  type="text"
                  placeholder="Nombre Pareja (ej: Coello & Tapia)"
                  value={team2Name}
                  onChange={e => setTeam2Name(e.target.value)}
                  style={inputStyle}
                />

                {/* Team 2 - Player 1 (Drive) */}
                <div style={playerSlotBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={slotLabel}>DRIVE (DERECHA)</span>
                    {p3.isHost ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>⭐ Anfitrión Host</span>
                    ) : p3.isPartner ? (
                      <span className="badge badge-team1" style={{ fontSize: '0.62rem' }}>🤝 Partner (ELO {p3.elo})</span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>👤 Invitado</span>
                    )}
                  </div>
                  <select
                    value={p3.isHost ? 'host' : p3.isPartner ? `partner_${p3.id}` : 'guest'}
                    onChange={e => handleAssignPlayer(setP3, e.target.value)}
                    style={{ ...selectStyle, padding: '6px 8px', fontSize: '0.78rem', marginBottom: '6px' }}
                  >
                    <option value="guest">👤 Jugador Invitado / Genérico</option>
                    {currentUser && <option value="host">⭐ Yo ({currentUser.name})</option>}
                    {partners.length > 0 && (
                      <optgroup label="Mis Partners Conectados">
                        {partners.map(part => (
                          <option key={part.id} value={`partner_${part.id}`}>
                            🤝 {part.name} ({part.category} Cat • ELO {part.elo})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre en pista"
                    value={p3.name}
                    onChange={e => setP3(prev => ({ ...prev, name: e.target.value }))}
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Team 2 - Player 2 (Revés) */}
                <div style={playerSlotBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={slotLabel}>REVÉS (IZQUIERDA)</span>
                    {p4.isHost ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>⭐ Anfitrión Host</span>
                    ) : p4.isPartner ? (
                      <span className="badge badge-team1" style={{ fontSize: '0.62rem' }}>🤝 Partner (ELO {p4.elo})</span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>👤 Invitado</span>
                    )}
                  </div>
                  <select
                    value={p4.isHost ? 'host' : p4.isPartner ? `partner_${p4.id}` : 'guest'}
                    onChange={e => handleAssignPlayer(setP4, e.target.value)}
                    style={{ ...selectStyle, padding: '6px 8px', fontSize: '0.78rem', marginBottom: '6px' }}
                  >
                    <option value="guest">👤 Jugador Invitado / Genérico</option>
                    {currentUser && <option value="host">⭐ Yo ({currentUser.name})</option>}
                    {partners.length > 0 && (
                      <optgroup label="Mis Partners Conectados">
                        {partners.map(part => (
                          <option key={part.id} value={`partner_${part.id}`}>
                            🤝 {part.name} ({part.category} Cat • ELO {part.elo})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre en pista"
                    value={p4.name}
                    onChange={e => setP4(prev => ({ ...prev, name: e.target.value }))}
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Court / Venue */}
          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>Club y Cancha del Partido</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '10px', alignItems: 'flex-start' }}>
              <ClubSelectCombobox
                value={selectedClub}
                onChange={handleClubChange}
                placeholder="Seleccionar club de La Serena o Coquimbo..."
              />
              <input
                type="text"
                placeholder="Ej: Cancha 1"
                value={specificCourt}
                onChange={e => handleSpecificCourtChange(e.target.value)}
                style={{ ...inputStyle, height: '44px', boxSizing: 'border-box' }}
                title="Número o nombre de cancha específica"
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              📍 Sede asignada: <strong style={{ color: 'var(--team1-primary)' }}>{courtName || 'Pista 1'}</strong>
            </div>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>
              Cancelar
            </button>
            <button type="submit" style={primaryBtnStyle}>
              Iniciar Partido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
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

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#0d1424',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
  animation: 'slideDown 0.25s ease-out'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid var(--border-subtle)'
};

const iconBadgeStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  background: 'rgba(0, 230, 118, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(0, 230, 118, 0.3)'
};

const closeBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'var(--text-muted)'
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: '8px'
};

const optionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '8px'
};

const optionCardStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  outline: 'none'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  outline: 'none'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: '0.9rem'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: '10px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 800,
  fontSize: '0.9rem',
  boxShadow: '0 4px 14px var(--team1-glow)'
};

const playerSlotBox: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px 10px',
  background: 'rgba(0, 0, 0, 0.25)',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)'
};

const slotLabel: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 800,
  color: 'var(--text-dim)',
  letterSpacing: '0.04em'
};
