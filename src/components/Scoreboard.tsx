import React from 'react';
import type { MatchScoreState, Team, MatchRules, AppViewMode } from '../types/padel';
import { 
  RotateCcw, 
  Volume2, 
  Bluetooth, 
  Maximize2, 
  Minimize2, 
  Share2, 
  Settings2, 
  Sparkles,
  ArrowRightLeft,
  CircleDot,
  Radio,
  Flame,
  Volume1,
  Sliders,
  Tv,
  Trophy,
  Users
} from 'lucide-react';

interface Props {
  state: MatchScoreState;
  teams: { team1: Team; team2: Team };
  rules: MatchRules;
  onScorePoint: (team: 'team1' | 'team2') => void;
  onUndo: () => void;
  onRepeatAnnouncement: () => void;
  onOpenBluetoothModal: () => void;
  onOpenAudioModal: () => void;
  onOpenSetupModal: () => void;
  onOpenQrModal: () => void;
  onNavigateToView: (view: AppViewMode) => void;
  isAudioSpeaking: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Scoreboard: React.FC<Props> = ({
  state,
  teams,
  rules,
  onScorePoint,
  onUndo,
  onRepeatAnnouncement,
  onOpenBluetoothModal,
  onOpenAudioModal,
  onOpenSetupModal,
  onOpenQrModal,
  onNavigateToView,
  isAudioSpeaking,
  isFullscreen,
  onToggleFullscreen
}) => {
  const currentSet = state.sets[state.currentSetIndex] || { team1: 0, team2: 0 };
  const isGoldenPointNow = 
    !state.isTieBreak && 
    !state.isSuperTieBreak && 
    rules.gameRule === 'golden_point' && 
    state.currentGame.team1 === '40' && 
    state.currentGame.team2 === '40';

  return (
    <div style={containerStyle}>
      {/* Top Bar: Court info, Status, Quick Tools */}
      <header style={topBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={brandLogoBadge}>
            <div className="pulsing-dot" style={{ color: '#00e676' }} />
            <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.05rem', color: '#fff' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
            </span>
          </div>

          <div style={courtTagStyle}>
            {rules.courtName || 'Pista Central'}
          </div>

          {/* Quick View Switches */}
          <div style={{ display: 'flex', gap: '6px', marginLeft: '6px' }}>
            <button
              onClick={() => onNavigateToView('court_enrollment')}
              style={navSwitchBtnStyle}
              title="Alineación 2D y Autoinscripción en Cancha"
            >
              <Users size={14} color="var(--team1-primary)" />
              <span>Alineación</span>
            </button>
            <button
              onClick={() => onNavigateToView('community')}
              style={navSwitchBtnStyle}
              title="Ranking ELO y Comunidad"
            >
              <Trophy size={14} color="var(--gold-primary)" />
              <span>Ranking</span>
            </button>
            <button
              onClick={() => onNavigateToView('court_tv')}
              style={{ ...navSwitchBtnStyle, borderColor: 'rgba(0, 176, 255, 0.4)' }}
              title="Modo Pantalla Gigante / TV en Cancha"
            >
              <Tv size={14} color="var(--team2-primary)" />
              <span>TV</span>
            </button>
          </div>
        </div>

        {/* Live Audio & Speaking visualizer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAudioSpeaking ? (
            <div style={audioVisualizerBadge}>
              <div style={waveBarStyle} />
              <div style={{ ...waveBarStyle, animationDelay: '0.15s' }} />
              <div style={{ ...waveBarStyle, animationDelay: '0.3s' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                Arbitrando...
              </span>
            </div>
          ) : (
            <button 
              onClick={onRepeatAnnouncement} 
              style={toolIconBtnStyle} 
              title="Cantar marcador en altavoz"
              aria-label="Repetir marcador por voz"
            >
              <Volume2 size={18} color="var(--text-muted)" />
            </button>
          )}

          {/* Bluetooth Hardware Link Button */}
          <button 
            onClick={onOpenBluetoothModal} 
            style={{ ...toolIconBtnStyle, borderColor: 'rgba(0, 230, 118, 0.35)' }}
            title="Configurar pulsadores Bluetooth"
            aria-label="Configurar pulsador Bluetooth"
          >
            <Bluetooth size={18} color="var(--team1-primary)" />
          </button>

          {/* Audio Settings */}
          <button 
            onClick={onOpenAudioModal} 
            style={toolIconBtnStyle} 
            title="Ajustes de audio y voz"
            aria-label="Ajustes de voz"
          >
            <Settings2 size={18} color="var(--text-muted)" />
          </button>

          {/* Match & Rules Setup */}
          <button 
            onClick={onOpenSetupModal} 
            style={{ ...toolIconBtnStyle, borderColor: 'rgba(255, 214, 0, 0.35)' }}
            title="Ajustes de partido y reglas"
            aria-label="Configurar partido"
          >
            <Sliders size={18} color="var(--gold-primary)" />
          </button>

          {/* QR Share */}
          <button 
            onClick={onOpenQrModal} 
            style={{ ...toolIconBtnStyle, borderColor: 'rgba(0, 176, 255, 0.35)' }}
            title="Compartir o registrar por QR"
            aria-label="Compartir partido por QR"
          >
            <Share2 size={18} color="var(--team2-primary)" />
          </button>

          {/* Fullscreen */}
          <button 
            onClick={onToggleFullscreen} 
            style={toolIconBtnStyle} 
            title="Modo Pantalla Completa"
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* Critical Alerts Banner (Punto de Oro / Cambio de Lado / Match Point) */}
      <div style={alertsContainerStyle}>
        {isGoldenPointNow && (
          <div style={goldenPointBannerStyle}>
            <Sparkles size={18} color="#000" />
            <span>¡PUNTO DE ORO! EL SIGUIENTE PUNTO DEFINE EL GAME</span>
            <Sparkles size={18} color="#000" />
          </div>
        )}

        {state.sideChangeNeeded && (
          <div style={sideChangeBannerStyle}>
            <ArrowRightLeft size={16} />
            <span>CAMBIO DE LADO DE PISTA</span>
          </div>
        )}

        {state.isSuperTieBreak && (
          <div style={superTieBannerStyle}>
            <Flame size={16} color="var(--gold-primary)" />
            <span>SÚPER TIE-BREAK DEFINITIVO A {rules.superTieBreakTarget} PUNTOS</span>
          </div>
        )}

        {state.isTieBreak && !state.isSuperTieBreak && (
          <div style={tieBreakBannerStyle}>
            <Radio size={16} color="var(--team2-primary)" />
            <span>TIE-BREAK A 7 PUNTOS (DIFERENCIA DE 2)</span>
          </div>
        )}
      </div>

      {/* Sets Summary Ribbon */}
      <div style={setsRibbonStyle}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginRight: '8px' }}>
          SETS
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {state.sets.map((set, idx) => {
            const isCurrent = idx === state.currentSetIndex;
            return (
              <div 
                key={idx} 
                style={{
                  ...setChipStyle,
                  borderColor: isCurrent ? 'var(--team1-primary)' : 'var(--border-subtle)',
                  background: isCurrent ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <span style={{ fontSize: '0.65rem', color: isCurrent ? 'var(--team1-primary)' : 'var(--text-dim)', fontWeight: 800 }}>
                  SET {idx + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                  <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : '#fff' }}>{set.team1}</span>
                  <span style={{ opacity: 0.35 }}>-</span>
                  <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : '#fff' }}>{set.team2}</span>
                </span>
                {set.tiebreakPoints && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>
                    ({set.tiebreakPoints.team1}-{set.tiebreakPoints.team2})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split-Court Scoreboard Grid */}
      <div style={scoreboardGridStyle}>
        {/* TEAM 1 COURT HALF */}
        <div 
          style={{
            ...teamCourtHalfStyle,
            borderColor: state.servingTeam === 'team1' ? 'rgba(0, 230, 118, 0.4)' : 'var(--border-subtle)',
            background: 'linear-gradient(180deg, rgba(0, 230, 118, 0.06) 0%, rgba(14, 21, 36, 0.95) 100%)'
          }}
          onClick={() => onScorePoint('team1')}
          role="button"
          tabIndex={0}
          aria-label={`Sumar punto para ${teams.team1.name}`}
        >
          {/* Header info */}
          <div style={teamHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...teamColorBar, background: 'var(--team1-primary)' }} />
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {teams.team1.name}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {teams.team1.player1.name} (Drive) • {teams.team1.player2.name} (Revés)
                </div>
              </div>
            </div>

            {/* Serving indicator */}
            {state.servingTeam === 'team1' && (
              <div style={servingBadgeStyle}>
                <CircleDot size={14} color="var(--team1-primary)" className="pulsing-dot" />
                <span>SAQUE</span>
              </div>
            )}
          </div>

          {/* Central Score Digits */}
          <div style={scoreDigitsContainerStyle}>
            {/* Games in Set */}
            <div style={gamesSubScoreStyle}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAMES</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {currentSet.team1}
              </span>
            </div>

            {/* Main Current Point Display */}
            <div style={mainPointBoxStyle}>
              <span style={{
                ...mainPointDigitStyle,
                color: 'var(--team1-primary)',
                textShadow: '0 0 40px var(--team1-glow)'
              }}>
                {state.currentGame.team1}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.08em' }}>
                PUNTO ACTUAL
              </span>
            </div>
          </div>

          {/* Direct Tap Action Prompt */}
          <div style={{ ...tapActionPrompt, background: 'rgba(0, 230, 118, 0.12)', color: 'var(--team1-primary)' }}>
            + PUNTO {teams.team1.name.toUpperCase()}
          </div>
        </div>

        {/* TEAM 2 COURT HALF */}
        <div 
          style={{
            ...teamCourtHalfStyle,
            borderColor: state.servingTeam === 'team2' ? 'rgba(0, 176, 255, 0.4)' : 'var(--border-subtle)',
            background: 'linear-gradient(180deg, rgba(0, 176, 255, 0.06) 0%, rgba(14, 21, 36, 0.95) 100%)'
          }}
          onClick={() => onScorePoint('team2')}
          role="button"
          tabIndex={0}
          aria-label={`Sumar punto para ${teams.team2.name}`}
        >
          {/* Header info */}
          <div style={teamHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...teamColorBar, background: 'var(--team2-primary)' }} />
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {teams.team2.name}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {teams.team2.player1.name} (Drive) • {teams.team2.player2.name} (Revés)
                </div>
              </div>
            </div>

            {/* Serving indicator */}
            {state.servingTeam === 'team2' && (
              <div style={{ ...servingBadgeStyle, borderColor: 'rgba(0, 176, 255, 0.4)', color: 'var(--team2-primary)' }}>
                <CircleDot size={14} color="var(--team2-primary)" className="pulsing-dot" />
                <span>SAQUE</span>
              </div>
            )}
          </div>

          {/* Central Score Digits */}
          <div style={scoreDigitsContainerStyle}>
            {/* Games in Set */}
            <div style={gamesSubScoreStyle}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAMES</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {currentSet.team2}
              </span>
            </div>

            {/* Main Current Point Display */}
            <div style={mainPointBoxStyle}>
              <span style={{
                ...mainPointDigitStyle,
                color: 'var(--team2-primary)',
                textShadow: '0 0 40px var(--team2-glow)'
              }}>
                {state.currentGame.team2}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.08em' }}>
                PUNTO ACTUAL
              </span>
            </div>
          </div>

          {/* Direct Tap Action Prompt */}
          <div style={{ ...tapActionPrompt, background: 'rgba(0, 176, 255, 0.12)', color: 'var(--team2-primary)' }}>
            + PUNTO {teams.team2.name.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar: Last event text & Fast Undo */}
      <footer style={bottomBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Volume1 size={18} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {state.lastEventAnnouncement || 'Esperando inicio del punto...'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={onUndo} style={undoBtnStyle} aria-label="Deshacer último punto">
            <RotateCcw size={16} />
            <span>Deshacer</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxHeight: '100vh',
  padding: '12px',
  gap: '10px',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)',
  flexShrink: 0
};

const brandLogoBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const courtTagStyle: React.CSSProperties = {
  padding: '3px 10px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  fontWeight: 600
};

const toolIconBtnStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-subtle)',
  color: '#fff',
  transition: 'all 0.2s'
};

const audioVisualizerBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.35)'
};

const waveBarStyle: React.CSSProperties = {
  width: '3px',
  height: '14px',
  background: 'var(--gold-primary)',
  borderRadius: '2px',
  animation: 'audioWave 0.6s infinite ease-in-out'
};

const alertsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  flexShrink: 0
};

const goldenPointBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '10px',
  background: 'linear-gradient(90deg, #ffd600 0%, #ffab00 100%)',
  color: '#070a12',
  fontWeight: 900,
  fontSize: '0.85rem',
  letterSpacing: '0.04em',
  borderRadius: '12px',
  boxShadow: '0 0 25px rgba(255, 214, 0, 0.5)',
  animation: 'pulseGlow 1.2s infinite ease-in-out'
};

const sideChangeBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '8px',
  background: 'rgba(0, 176, 255, 0.18)',
  border: '1px solid rgba(0, 176, 255, 0.4)',
  color: 'var(--team2-primary)',
  fontWeight: 800,
  fontSize: '0.8rem',
  borderRadius: '10px'
};

const superTieBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '8px',
  background: 'rgba(255, 61, 113, 0.15)',
  border: '1px solid rgba(255, 61, 113, 0.4)',
  color: 'var(--danger-primary)',
  fontWeight: 800,
  fontSize: '0.8rem',
  borderRadius: '10px'
};

const tieBreakBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '8px',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  color: 'var(--team1-primary)',
  fontWeight: 800,
  fontSize: '0.8rem',
  borderRadius: '10px'
};

const setsRibbonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 10px',
  flexShrink: 0
};

const setChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 12px',
  borderRadius: '10px',
  border: '1px solid',
  whiteSpace: 'nowrap'
};

const scoreboardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  flex: 1,
  minHeight: 0
};

const teamCourtHalfStyle: React.CSSProperties = {
  borderRadius: '24px',
  border: '2px solid',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'transform 0.15s, border-color 0.2s',
  position: 'relative',
  overflow: 'hidden'
};

const teamHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const teamColorBar: React.CSSProperties = {
  width: '5px',
  height: '36px',
  borderRadius: '3px'
};

const servingBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  fontSize: '0.72rem',
  fontWeight: 900,
  color: 'var(--team1-primary)',
  letterSpacing: '0.05em'
};

const scoreDigitsContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  margin: 'auto 0'
};

const gamesSubScoreStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px 18px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)'
};

const mainPointBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const mainPointDigitStyle: React.CSSProperties = {
  fontSize: 'clamp(4.5rem, 14vw, 8.5rem)',
  fontWeight: 900,
  fontFamily: 'var(--font-mono)',
  lineHeight: '1',
  letterSpacing: '-0.06em'
};

const tapActionPrompt: React.CSSProperties = {
  textAlign: 'center',
  padding: '12px',
  borderRadius: '14px',
  fontWeight: 900,
  fontSize: '0.88rem',
  letterSpacing: '0.04em'
};

const bottomBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)',
  flexShrink: 0
};

const undoBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '10px',
  background: 'rgba(255, 61, 113, 0.12)',
  color: 'var(--danger-primary)',
  border: '1px solid rgba(255, 61, 113, 0.35)',
  fontWeight: 700,
  fontSize: '0.85rem'
};

const navSwitchBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: '#e2e8f0',
  fontSize: '0.75rem',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.15s'
};

