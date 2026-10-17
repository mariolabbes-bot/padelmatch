import React, { useState, useEffect } from 'react';
import type { MatchScoreState, Team, MatchRules } from '../types/padel';
import { CircleDot, Sparkles, ArrowRightLeft, Minimize2 } from 'lucide-react';

interface Props {
  state: MatchScoreState;
  teams: { team1: Team; team2: Team };
  rules: MatchRules;
  onExitTvMode: () => void;
}

export const CourtTvDisplay: React.FC<Props> = ({
  state,
  teams,
  rules,
  onExitTvMode
}) => {
  const [matchElapsedSeconds, setMatchElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isGoldenPointNow = 
    !state.isTieBreak && 
    !state.isSuperTieBreak && 
    rules.gameRule === 'golden_point' && 
    state.currentGame.team1 === '40' && 
    state.currentGame.team2 === '40';

  return (
    <div style={tvContainerStyle}>
      {/* Top Club Header & Clock */}
      <header style={tvHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={clubLogoPill}>
            <img 
              src="/logo.png" 
              alt="PadelMatch Logo" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#fff' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
            </span>
          </div>

          <div style={courtPillStyle}>
            {rules.courtName || 'CANCHA CENTRAL'}
          </div>
        </div>

        {/* Central Match Duration Clock */}
        <div style={timerBoxStyle}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 800 }}>TIEMPO DE JUEGO</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)' }}>
            {formatTimer(matchElapsedSeconds)}
          </span>
        </div>

        {/* Exit TV Mode Button */}
        <button onClick={onExitTvMode} style={exitTvBtnStyle} title="Salir de Modo TV">
          <Minimize2 size={20} />
          <span>Volver a Cancha</span>
        </button>
      </header>

      {/* Critical Alerts Banner (Punto de Oro / Cambio de Lado) */}
      {isGoldenPointNow && (
        <div style={tvGoldenPointBanner}>
          <Sparkles size={24} color="#000" />
          <span>¡PUNTO DE ORO EN JUEGO!</span>
          <Sparkles size={24} color="#000" />
        </div>
      )}

      {state.sideChangeNeeded && (
        <div style={tvSideChangeBanner}>
          <ArrowRightLeft size={20} />
          <span>CAMBIO DE LADO DE CANCHA</span>
        </div>
      )}

      {/* Full-width Giant Scoreboard Table */}
      <div style={tvBoardGrid}>
        {/* TEAM 1 */}
        <div style={{ ...tvTeamRow, borderColor: state.servingTeam === 'team1' ? 'var(--team1-primary)' : 'var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1.5 }}>
            <div style={{ ...tvColorStrip, background: 'var(--team1-primary)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {teams.team1.name}
                </h2>
                {state.servingTeam === 'team1' && (
                  <div style={tvServingBadge}>
                    <CircleDot size={18} color="var(--team1-primary)" className="pulsing-dot" />
                    <span>SERVICIO</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                {teams.team1.player1.name} • {teams.team1.player2.name}
              </div>
            </div>
          </div>

          {/* Sets Breakdown */}
          <div style={tvSetsColumns}>
            {state.sets.map((s, idx) => (
              <div key={idx} style={{ ...tvSetBox, background: idx === state.currentSetIndex ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 0, 0, 0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 800 }}>SET {idx + 1}</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.team1 > s.team2 ? 'var(--team1-primary)' : '#fff' }}>
                  {s.team1}
                </span>
              </div>
            ))}
          </div>

          {/* Current Game Point (Giant) */}
          <div style={tvGiantPointBox}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>
              PUNTO
            </span>
            <span style={{ fontSize: '6.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--team1-primary)', lineHeight: '1', textShadow: '0 0 50px var(--team1-glow)' }}>
              {state.currentGame.team1}
            </span>
          </div>
        </div>

        {/* TEAM 2 */}
        <div style={{ ...tvTeamRow, borderColor: state.servingTeam === 'team2' ? 'var(--team2-primary)' : 'var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1.5 }}>
            <div style={{ ...tvColorStrip, background: 'var(--team2-primary)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {teams.team2.name}
                </h2>
                {state.servingTeam === 'team2' && (
                  <div style={{ ...tvServingBadge, color: 'var(--team2-primary)', borderColor: 'rgba(0, 176, 255, 0.4)' }}>
                    <CircleDot size={18} color="var(--team2-primary)" className="pulsing-dot" />
                    <span>SERVICIO</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                {teams.team2.player1.name} • {teams.team2.player2.name}
              </div>
            </div>
          </div>

          {/* Sets Breakdown */}
          <div style={tvSetsColumns}>
            {state.sets.map((s, idx) => (
              <div key={idx} style={{ ...tvSetBox, background: idx === state.currentSetIndex ? 'rgba(0, 176, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 800 }}>SET {idx + 1}</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.team2 > s.team1 ? 'var(--team2-primary)' : '#fff' }}>
                  {s.team2}
                </span>
              </div>
            ))}
          </div>

          {/* Current Game Point (Giant) */}
          <div style={tvGiantPointBox}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>
              PUNTO
            </span>
            <span style={{ fontSize: '6.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--team2-primary)', lineHeight: '1', textShadow: '0 0 50px var(--team2-glow)' }}>
              {state.currentGame.team2}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sponsor Banner */}
      <footer style={tvFooterStyle}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {state.lastEventAnnouncement || 'Marcador oficial en pista'}
        </div>

        <div style={sponsorTagStyle}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>SPONSOR OFICIAL:</span>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
          />
          <span style={{ fontWeight: 900, letterSpacing: '0.06em', color: '#fff' }}>PADELMATCH PRO SAAS</span>
        </div>
      </footer>
    </div>
  );
};

// Styles
const tvContainerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#04070e',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  boxSizing: 'border-box'
};

const tvHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  background: 'rgba(14, 21, 36, 0.8)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

const clubLogoPill: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const courtPillStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(255, 255, 255, 0.08)',
  fontWeight: 800,
  fontSize: '0.9rem',
  color: 'var(--gold-primary)',
  letterSpacing: '0.05em'
};

const timerBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const exitTvBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#cbd5e1',
  fontWeight: 700,
  fontSize: '0.9rem',
  border: '1px solid var(--border-subtle)'
};

const tvGoldenPointBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '14px',
  padding: '16px',
  background: 'linear-gradient(90deg, #ffd600 0%, #ff9100 100%)',
  color: '#070a12',
  fontWeight: 900,
  fontSize: '1.4rem',
  letterSpacing: '0.06em',
  borderRadius: '16px',
  margin: '12px 0',
  boxShadow: '0 0 40px rgba(255, 214, 0, 0.6)'
};

const tvSideChangeBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '12px',
  background: 'rgba(0, 176, 255, 0.2)',
  border: '1px solid rgba(0, 176, 255, 0.5)',
  color: 'var(--team2-primary)',
  fontWeight: 900,
  fontSize: '1.1rem',
  borderRadius: '14px',
  margin: '12px 0'
};

const tvBoardGrid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  margin: 'auto 0'
};

const tvTeamRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '24px 32px',
  background: 'rgba(14, 21, 36, 0.9)',
  borderRadius: '24px',
  border: '2px solid',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
};

const tvColorStrip: React.CSSProperties = {
  width: '8px',
  height: '70px',
  borderRadius: '4px'
};

const tvServingBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  fontSize: '0.85rem',
  fontWeight: 900,
  color: 'var(--team1-primary)'
};

const tvSetsColumns: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  margin: '0 32px'
};

const tvSetBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '12px 24px',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)',
  minWidth: '85px'
};

const tvGiantPointBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px 32px',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '20px',
  border: '1px solid var(--border-subtle)',
  minWidth: '170px'
};

const tvFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  background: 'rgba(14, 21, 36, 0.8)',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)'
};

const sponsorTagStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};
