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
import { Settings2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rules: MatchRules;
  teams: { team1: Team; team2: Team };
  onStartMatch: (newRules: MatchRules, newTeams: { team1: Team; team2: Team }) => void;
}

export const MatchSetupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  rules,
  teams,
  onStartMatch
}) => {
  const [localRules, setLocalRules] = useState<MatchRules>(rules);
  const [team1Name, setTeam1Name] = useState(teams.team1.name);
  const [team1Player1, setTeam1Player1] = useState(teams.team1.player1.name);
  const [team1Player2, setTeam1Player2] = useState(teams.team1.player2.name);

  const [team2Name, setTeam2Name] = useState(teams.team2.name);
  const [team2Player1, setTeam2Player1] = useState(teams.team2.player1.name);
  const [team2Player2, setTeam2Player2] = useState(teams.team2.player2.name);

  const [courtName, setCourtName] = useState(rules.courtName || 'Pista Central');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTeams = {
      team1: {
        ...teams.team1,
        name: team1Name || 'Pareja 1',
        player1: { ...teams.team1.player1, name: team1Player1 || 'Jugador 1' },
        player2: { ...teams.team1.player2, name: team1Player2 || 'Jugador 2' }
      },
      team2: {
        ...teams.team2,
        name: team2Name || 'Pareja 2',
        player1: { ...teams.team2.player1, name: team2Player1 || 'Jugador 3' },
        player2: { ...teams.team2.player2, name: team2Player2 || 'Jugador 4' }
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
            <label style={sectionTitleStyle}>Parejas y Jugadores</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Team 1 */}
              <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.25)', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--team1-primary)', display: 'block', marginBottom: '8px' }}>
                  PAREJA 1
                </span>
                <input
                  type="text"
                  placeholder="Nombre Pareja (ej: Galán / Chingotto)"
                  value={team1Name}
                  onChange={e => setTeam1Name(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Drive (Derecha)"
                  value={team1Player1}
                  onChange={e => setTeam1Player1(e.target.value)}
                  style={{ ...inputStyle, marginTop: '6px' }}
                />
                <input
                  type="text"
                  placeholder="Revés (Izquierda)"
                  value={team1Player2}
                  onChange={e => setTeam1Player2(e.target.value)}
                  style={{ ...inputStyle, marginTop: '6px' }}
                />
              </div>

              {/* Team 2 */}
              <div style={{ background: 'rgba(0, 176, 255, 0.05)', border: '1px solid rgba(0, 176, 255, 0.25)', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--team2-primary)', display: 'block', marginBottom: '8px' }}>
                  PAREJA 2
                </span>
                <input
                  type="text"
                  placeholder="Nombre Pareja (ej: Coello / Tapia)"
                  value={team2Name}
                  onChange={e => setTeam2Name(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Drive (Derecha)"
                  value={team2Player1}
                  onChange={e => setTeam2Player1(e.target.value)}
                  style={{ ...inputStyle, marginTop: '6px' }}
                />
                <input
                  type="text"
                  placeholder="Revés (Izquierda)"
                  value={team2Player2}
                  onChange={e => setTeam2Player2(e.target.value)}
                  style={{ ...inputStyle, marginTop: '6px' }}
                />
              </div>
            </div>
          </div>

          {/* Court / Venue */}
          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>Nombre de Cancha / Club</label>
            <input
              type="text"
              placeholder="Ej: Cancha Central - Club Padel Las Condes"
              value={courtName}
              onChange={e => setCourtName(e.target.value)}
              style={inputStyle}
            />
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
