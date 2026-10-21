import React, { useState } from 'react';
import type { MatchScoreState, Team } from '../types/padel';
import { Play, Flag, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  state: MatchScoreState;
  teams: { team1: Team; team2: Team };
  onResumeMatch: () => void;
  onFinishEarly: () => void;
}

export const FloatingActiveMatchWidget: React.FC<Props> = ({
  state,
  teams,
  onResumeMatch,
  onFinishEarly
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // If match is over, don't show floating widget
  if (state.isMatchOver) return null;

  const setsScore = state.sets.map(s => `${s.team1}-${s.team2}`).join(' ');

  return (
    <aside 
      style={{
        ...containerStyle,
        bottom: '76px'
      }}
      className="glass-panel apple-card glow-team1"
      aria-label="Partido de pádel en curso"
      role="region"
    >
      <div style={innerStyle}>
        {/* Left: Status & Score */}
        <div 
          onClick={onResumeMatch}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
          title="Toca para volver a la pantalla completa del marcador"
        >
          <div style={liveBadgeStyle}>
            <span style={pulsingDotStyle} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>
              EN JUEGO
            </span>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--team1-primary)' }}>{teams.team1.name}</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>vs</span>
              <span style={{ color: 'var(--team2-primary)' }}>{teams.team2.name}</span>
            </div>
            
            {!isMinimized && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>
                  Sets: {setsScore}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                  ({state.currentGame.team1} - {state.currentGame.team2})
                </span>
                {state.isResting && (
                  <span className="badge badge-team1" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                    Descanso ({state.restSecondsRemaining}s)
                  </span>
                )}
                {state.isPaused && (
                  <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                    Pausado
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Volver & Terminar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={onResumeMatch}
            style={returnBtnStyle}
            title="Volver al marcador en pista"
          >
            <Play size={14} fill="#070a10" color="#070a10" />
            <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>VOLVER</span>
          </button>

          <button
            type="button"
            onClick={onFinishEarly}
            style={finishBtnStyle}
            title="Terminar partido anticipadamente"
          >
            <Flag size={13} color="var(--gold-primary)" />
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            style={toggleMinimizeBtnStyle}
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 24px)',
  maxWidth: '560px',
  zIndex: 900,
  padding: '8px 12px',
  borderRadius: '16px',
  background: 'rgba(10, 16, 28, 0.94)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(0, 230, 118, 0.45)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 230, 118, 0.2)'
};

const innerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px'
};

const liveBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  background: 'rgba(239, 68, 68, 0.2)',
  border: '1px solid rgba(239, 68, 68, 0.5)',
  padding: '2px 7px',
  borderRadius: '6px',
  flexShrink: 0
};

const pulsingDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#ef4444',
  boxShadow: '0 0 8px #ef4444',
  display: 'inline-block'
};

const returnBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  background: 'var(--team1-primary)',
  color: '#070a10',
  border: 'none',
  borderRadius: '10px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontWeight: 900,
  boxShadow: '0 2px 10px rgba(0, 230, 118, 0.4)'
};

const finishBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.35)',
  borderRadius: '10px',
  width: '32px',
  height: '32px',
  cursor: 'pointer'
};

const toggleMinimizeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  borderRadius: '8px',
  width: '26px',
  height: '26px',
  cursor: 'pointer'
};
