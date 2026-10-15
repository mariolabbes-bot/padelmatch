import React, { useState } from 'react';
import type { MatchScoreState, Team, MatchRules, AppViewMode } from '../types/padel';
import type { UserSession } from '../services/authService';
import { MobileDrawerMenu } from './MobileDrawerMenu';
import { 
  RotateCcw, 
  Volume2, 
  Sparkles,
  ArrowRightLeft,
  CircleDot,
  Radio,
  Volume1,
  Menu,
  Watch,
  Plus,
  Pause,
  Play,
  Timer
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
  currentUser: UserSession | null;
  onResetMatch: () => void;
  onNewMatch: () => void;
  onLogout: () => void;
  isSmartwatchActive: boolean;
  onToggleSmartwatch: () => void;
  onSkipRest: () => void;
  onTogglePause: () => void;
  onOpenFinishEarlyModal: () => void;
  isGuestViewer?: boolean;
  hostName?: string;
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
  onToggleFullscreen,
  currentUser,
  onResetMatch,
  onNewMatch,
  onLogout,
  isSmartwatchActive,
  onToggleSmartwatch,
  onSkipRest,
  onTogglePause,
  onOpenFinishEarlyModal,
  isGuestViewer,
  hostName
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const currentSet = state.sets[state.currentSetIndex] || { team1: 0, team2: 0 };
  const isGoldenPointNow = 
    !state.isTieBreak && 
    !state.isSuperTieBreak && 
    rules.gameRule === 'golden_point' && 
    state.currentGame.team1 === '40' && 
    state.currentGame.team2 === '40';

  return (
    <div style={containerStyle}>
      {/* 1. ULTRA-CLEAN MOBILE-FIRST TOP BAR */}
      <header style={topBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulsing-dot" style={{ color: 'var(--team1-primary)' }} />
          <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1rem', color: '#fff' }}>
            PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
          </span>
        </div>

        {/* Center: Court / Game Status */}
        <div style={centerStatusStyle}>
          {isGuestViewer && (
            <span style={{ ...courtMiniBadge, background: 'rgba(0, 176, 255, 0.15)', borderColor: 'var(--team2-primary)', color: 'var(--team2-primary)' }}>
              👁️ EN VIVO
            </span>
          )}
          {isGoldenPointNow ? (
            <span style={goldenPointMiniBadge}>
              <Sparkles size={12} />
              PUNTO DE ORO
            </span>
          ) : state.isTieBreak ? (
            <span style={tieBreakMiniBadge}>
              <Radio size={12} />
              TIE-BREAK
            </span>
          ) : (
            <span style={courtMiniBadge}>
              {hostName ? `${hostName} • ${rules.courtName || 'Cancha'}` : (rules.courtName || 'Cancha')}
            </span>
          )}
        </div>

        {/* Right Tools: Smartwatch Status & Menu Drawer Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Smartwatch Indicator Button */}
          <button
            onClick={onToggleSmartwatch}
            style={{
              ...smartwatchBtnStyle,
              background: isSmartwatchActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--border-subtle)',
              color: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--text-muted)'
            }}
            title={isSmartwatchActive ? 'Apple Watch activo ("En Reproducción")' : 'Activar Apple Watch / Reloj'}
            aria-label="Modo Apple Watch"
          >
            <Watch size={16} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
              {isSmartwatchActive ? 'WATCH ON' : 'WATCH'}
            </span>
          </button>

          {/* Voice Repeat Button */}
          <button 
            onClick={onRepeatAnnouncement} 
            style={iconBtnStyle} 
            title="Cantar marcador por voz"
            aria-label="Repetir marcador"
          >
            <Volume2 size={18} color={isAudioSpeaking ? 'var(--gold-primary)' : 'var(--text-muted)'} />
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={onTogglePause}
            style={{
              ...iconBtnStyle,
              background: state.isPaused ? 'rgba(255, 214, 0, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: state.isPaused ? 'var(--gold-primary)' : 'var(--border-subtle)'
            }}
            title={state.isPaused ? 'Reanudar partido' : 'Pausar partido'}
            aria-label={state.isPaused ? 'Reanudar partido' : 'Pausar partido'}
          >
            {state.isPaused ? <Play size={17} color="var(--gold-primary)" /> : <Pause size={17} color="var(--text-muted)" />}
          </button>

          {/* Drawer Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            style={menuTriggerBtnStyle}
            aria-label="Abrir menú de configuración"
          >
            <Menu size={20} color="#fff" />
          </button>
        </div>
      </header>

      {/* 2. PAUSE OVERLAY / BANNER */}
      {state.isPaused && (
        <div style={pauseBannerStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={pauseIconBadgeStyle}>
              <Pause size={18} color="var(--gold-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--gold-primary)' }}>
                PARTIDO EN PAUSA
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Puntos pausados • Pulsa reanudar en pantalla o Apple Watch
              </div>
            </div>
          </div>
          <button onClick={onTogglePause} style={resumeBtnStyle}>
            <Play size={14} />
            <span>Reanudar</span>
          </button>
        </div>
      )}

      {/* 2.1. REST COUNTDOWN BANNER (Cambio de Lado y Descanso) */}
      {!state.isPaused && state.isResting && (
        <div style={restBannerStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={restTimerBadgeStyle}>
              <Timer size={18} color="var(--team1-primary)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.25rem', color: '#fff' }}>
                {Math.floor((state.restSecondsRemaining || 0) / 60)}:
                {((state.restSecondsRemaining || 0) % 60) < 10 ? '0' : ''}
                {(state.restSecondsRemaining || 0) % 60}
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRightLeft size={14} color="var(--gold-primary)" />
                <span>Cambio de Lado y Descanso</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Al saque: <strong style={{ color: 'var(--team1-primary)' }}>{teams[state.servingTeam].name}</strong>
              </div>
            </div>
          </div>

          <button onClick={onSkipRest} style={skipRestBtnStyle} title="Comenzar el siguiente game inmediatamente">
            <Play size={14} />
            <span>Comenzar Ya</span>
          </button>
        </div>
      )}

      {/* 2.2. SIMPLE SIDE CHANGE BANNER (Cuando no hay descanso activo) */}
      {!state.isPaused && !state.isResting && state.sideChangeNeeded && (
        <div style={sideChangeBannerStyle}>
          <ArrowRightLeft size={16} />
          <span>CAMBIO DE LADO DE PISTA</span>
        </div>
      )}

      {/* 3. SETS TRACKER RIBBON */}
      <div style={setsRibbonStyle}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginRight: '6px' }}>
          SETS:
        </span>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {state.sets.map((set, idx) => {
            const isCurrent = idx === state.currentSetIndex;
            return (
              <div 
                key={idx} 
                style={{
                  ...setChipStyle,
                  borderColor: isCurrent ? 'var(--team1-primary)' : 'var(--border-subtle)',
                  background: isCurrent ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <span style={{ fontSize: '0.65rem', color: isCurrent ? 'var(--team1-primary)' : 'var(--text-dim)', fontWeight: 800 }}>
                  S{idx + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : '#fff' }}>{set.team1}</span>
                  <span style={{ opacity: 0.35, margin: '0 2px' }}>-</span>
                  <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : '#fff' }}>{set.team2}</span>
                </span>
                {set.tiebreakPoints && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--gold-primary)' }}>
                    ({set.tiebreakPoints.team1}-{set.tiebreakPoints.team2})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN SCORE CARDS (MOBILE-OPTIMIZED VERTICAL SPLIT) */}
      <div style={scoreCardsWrapperStyle}>
        {/* TEAM 1 CARD */}
        <div 
          style={{
            ...teamCardStyle,
            borderColor: state.servingTeam === 'team1' ? 'rgba(0, 230, 118, 0.5)' : 'var(--border-subtle)',
            background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08) 0%, rgba(14, 21, 36, 0.95) 100%)'
          }}
        >
          {/* Top row: Team info & Games */}
          <div style={teamCardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: 'var(--team1-primary)' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                    {teams.team1.name}
                  </h2>
                  {state.servingTeam === 'team1' && (
                    <span style={servingTagStyle}>
                      <CircleDot size={10} className="pulsing-dot" />
                      SAQUE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {teams.team1.player1.name} • {teams.team1.player2.name}
                </div>
              </div>
            </div>

            {/* Games Counter */}
            <div style={gamesBadgeStyle}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800 }}>GAMES</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {currentSet.team1}
              </span>
            </div>
          </div>

          {/* Central Point Display + Action Button */}
          <div style={pointActionRowStyle}>
            {/* Giant Score Digit */}
            <div style={pointDisplayBoxStyle}>
              <span style={{
                ...mainScoreDigitStyle,
                color: 'var(--team1-primary)',
                textShadow: '0 0 30px var(--team1-glow)'
              }}>
                {state.currentGame.team1}
              </span>
            </div>

            {/* Tap Button */}
            <button
              onClick={() => onScorePoint('team1')}
              style={scorePointBtnT1}
              aria-label={`Sumar punto ${teams.team1.name}`}
            >
              <Plus size={24} />
              <span>PUNTO</span>
            </button>
          </div>
        </div>

        {/* TEAM 2 CARD */}
        <div 
          style={{
            ...teamCardStyle,
            borderColor: state.servingTeam === 'team2' ? 'rgba(0, 176, 255, 0.5)' : 'var(--border-subtle)',
            background: 'linear-gradient(135deg, rgba(0, 176, 255, 0.08) 0%, rgba(14, 21, 36, 0.95) 100%)'
          }}
        >
          {/* Top row: Team info & Games */}
          <div style={teamCardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: 'var(--team2-primary)' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                    {teams.team2.name}
                  </h2>
                  {state.servingTeam === 'team2' && (
                    <span style={{ ...servingTagStyle, color: 'var(--team2-primary)', borderColor: 'rgba(0, 176, 255, 0.4)' }}>
                      <CircleDot size={10} className="pulsing-dot" />
                      SAQUE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {teams.team2.player1.name} • {teams.team2.player2.name}
                </div>
              </div>
            </div>

            {/* Games Counter */}
            <div style={gamesBadgeStyle}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800 }}>GAMES</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {currentSet.team2}
              </span>
            </div>
          </div>

          {/* Central Point Display + Action Button */}
          <div style={pointActionRowStyle}>
            {/* Giant Score Digit */}
            <div style={pointDisplayBoxStyle}>
              <span style={{
                ...mainScoreDigitStyle,
                color: 'var(--team2-primary)',
                textShadow: '0 0 30px var(--team2-glow)'
              }}>
                {state.currentGame.team2}
              </span>
            </div>

            {/* Tap Button */}
            <button
              onClick={() => onScorePoint('team2')}
              style={scorePointBtnT2}
              aria-label={`Sumar punto ${teams.team2.name}`}
            >
              <Plus size={24} />
              <span>PUNTO</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM CONTROL BAR WITH LARGE UNDO & LAST ANNOUNCEMENT */}
      <footer style={bottomBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <Volume1 size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
          <span style={lastEventTextStyle}>
            {state.lastEventAnnouncement || 'Listo para jugar'}
          </span>
        </div>

        <button 
          onClick={onUndo} 
          style={undoBtnStyle}
          aria-label="Deshacer último punto"
        >
          <RotateCcw size={18} />
          <span>DESHACER</span>
        </button>
      </footer>

      {/* MOBILE DRAWER / SLIDE-IN CONTROL SHEET */}
      <MobileDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        isSmartwatchActive={isSmartwatchActive}
        onToggleSmartwatch={onToggleSmartwatch}
        onOpenBluetoothModal={onOpenBluetoothModal}
        onOpenAudioModal={onOpenAudioModal}
        onOpenCourtAlignment={() => onNavigateToView('court_enrollment')}
        onOpenTvMode={() => onNavigateToView('court_tv')}
        onOpenCommunity={() => onNavigateToView('community')}
        onResetMatch={onResetMatch}
        onNewMatch={onNewMatch}
        onLogout={onLogout}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onOpenSetupModal={onOpenSetupModal}
        onOpenQrModal={onOpenQrModal}
        isPaused={state.isPaused}
        onTogglePause={onTogglePause}
        onOpenFinishEarlyModal={onOpenFinishEarlyModal}
      />
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  maxHeight: '100dvh',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  gap: '8px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  background: 'var(--bg-deep)'
};

const pauseBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid var(--gold-primary)',
  borderRadius: 'var(--radius-md)',
  animation: 'fadeIn 0.2s ease-out'
};

const pauseIconBadgeStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '8px',
  background: 'rgba(255, 214, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const resumeBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  background: 'var(--gold-primary)',
  color: '#070a10',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 900,
  fontSize: '0.8rem',
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(255, 214, 0, 0.3)'
};

const restBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.12) 0%, rgba(14, 21, 36, 0.95) 100%)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  borderRadius: 'var(--radius-md)',
  animation: 'fadeIn 0.2s ease-out'
};

const restTimerBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid var(--team1-primary)',
  borderRadius: '8px'
};

const skipRestBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 900,
  fontSize: '0.8rem',
  cursor: 'pointer',
  boxShadow: '0 2px 12px var(--team1-glow)'
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  flexShrink: 0
};

const centerStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const courtMiniBadge: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  padding: '3px 8px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 'var(--radius-full)',
  fontWeight: 600
};

const goldenPointMiniBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.7rem',
  fontWeight: 900,
  padding: '3px 8px',
  background: 'linear-gradient(90deg, #ffd600 0%, #ffab00 100%)',
  color: '#070a10',
  borderRadius: 'var(--radius-full)',
  letterSpacing: '0.04em'
};

const tieBreakMiniBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.7rem',
  fontWeight: 800,
  padding: '3px 8px',
  background: 'rgba(0, 176, 255, 0.2)',
  color: 'var(--team2-primary)',
  borderRadius: 'var(--radius-full)'
};

const smartwatchBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid',
  cursor: 'pointer'
};

const iconBtnStyle: React.CSSProperties = {
  padding: '7px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const menuTriggerBtnStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: '8px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const sideChangeBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '6px',
  background: 'rgba(0, 176, 255, 0.15)',
  border: '1px solid rgba(0, 176, 255, 0.35)',
  color: 'var(--team2-primary)',
  fontWeight: 800,
  fontSize: '0.75rem',
  borderRadius: '8px',
  flexShrink: 0
};

const setsRibbonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '2px 4px',
  flexShrink: 0
};

const setChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '8px',
  border: '1px solid',
  whiteSpace: 'nowrap'
};

const scoreCardsWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1,
  minHeight: 0
};

const teamCardStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: '16px',
  border: '1px solid',
  padding: 'clamp(10px, 2.5vw, 16px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 0
};

const teamCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const servingTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.65rem',
  fontWeight: 900,
  padding: '2px 6px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  color: 'var(--team1-primary)',
  background: 'rgba(0, 230, 118, 0.1)'
};

const gamesBadgeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  lineHeight: 1
};

const pointActionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginTop: '4px'
};

const pointDisplayBoxStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center'
};

const mainScoreDigitStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'clamp(3rem, 11vw, 4.8rem)',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  lineHeight: 0.95
};

const scorePointBtnT1: React.CSSProperties = {
  padding: 'clamp(14px, 3.5vw, 20px) clamp(20px, 5vw, 36px)',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: 'clamp(1rem, 3vw, 1.25rem)',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px var(--team1-glow)'
};

const scorePointBtnT2: React.CSSProperties = {
  padding: 'clamp(14px, 3.5vw, 20px) clamp(20px, 5vw, 36px)',
  background: 'var(--team2-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: 'clamp(1rem, 3vw, 1.25rem)',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px var(--team2-glow)'
};

const bottomBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  flexShrink: 0
};

const lastEventTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#cbd5e1',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden'
};

const undoBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: 800,
  flexShrink: 0
};
