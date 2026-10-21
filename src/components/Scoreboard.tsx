import React, { useState, useEffect } from 'react';
import type { MatchScoreState, Team, MatchRules, AppViewMode } from '../types/padel';
import type { UserSession } from '../services/authService';
import { themeService, type AppTheme } from '../services/themeService';
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
  Timer,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Smartphone
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
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });
  const [lastScoredTeam, setLastScoredTeam] = useState<'team1' | 'team2' | null>(null);

  useEffect(() => {
    return themeService.subscribe(setTheme);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleScoreWithHaptic = (team: 'team1' | 'team2') => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
    } catch {
      // Haptics optional
    }
    setLastScoredTeam(team);
    setTimeout(() => setLastScoredTeam(null), 400);
    onScorePoint(team);
  };

  const handleToggleOrientationFullscreen = async () => {
    onToggleFullscreen();
    try {
      // If entering fullscreen on mobile, attempt landscape lock
      if (!isFullscreen && typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        // @ts-ignore
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Ignore orientation lock restrictions
    }
  };

  const currentSet = state.sets[state.currentSetIndex] || { team1: 0, team2: 0 };
  const isGoldenPointNow = 
    !state.isTieBreak && 
    !state.isSuperTieBreak && 
    rules.gameRule === 'golden_point' && 
    state.currentGame.team1 === '40' && 
    state.currentGame.team2 === '40';

  // Format point font size: when 'AD' or long text, slightly scale down so it never wraps
  const getPointFontSize = (val: string | number, landscape: boolean) => {
    const str = String(val);
    if (str.length > 2) {
      return landscape ? 'clamp(3.8rem, 11vw, 6.5rem)' : 'clamp(2.8rem, 9vw, 4.4rem)';
    }
    return landscape ? 'clamp(6.5rem, 22vw, 13rem)' : 'clamp(4.6rem, 16vw, 7.8rem)';
  };

  return (
    <div style={{
      ...containerStyle,
      padding: isLandscape ? '6px 12px' : 'var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)'
    }}>
      {/* 1. TOP BAR (Sleek Apple/Adidas Athletic Header) */}
      <header style={isLandscape ? landscapeTopBarStyle : topBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ width: isLandscape ? '24px' : '28px', height: isLandscape ? '24px' : '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.2)' }} 
          />
          <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: isLandscape ? '0.9rem' : '1.05rem', color: 'var(--text-main)' }}>
            PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
          </span>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            padding: '2px 6px', 
            borderRadius: '4px', 
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-dim)',
            letterSpacing: '0.04em'
          }}>
            PRO
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
            <span style={goldenPointMiniBadge} className="pulsing-dot">
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
              {hostName ? `${hostName} • ${rules.courtName || 'Pista'}` : (rules.courtName || 'Pista Central')}
            </span>
          )}
        </div>

        {/* Right Tools: Fullscreen, Watch, Audio, Theme, Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Fullscreen & Landscape Switcher Button */}
          <button
            onClick={handleToggleOrientationFullscreen}
            style={{
              ...iconBtnStyle,
              background: isFullscreen ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: isFullscreen ? 'var(--team1-primary)' : 'var(--border-subtle)',
              color: isFullscreen ? 'var(--team1-primary)' : 'var(--text-main)'
            }}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa horizontal (Ideal para vidrio o trípode)'}
            aria-label="Alternar pantalla completa y modo horizontal"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Smartwatch Indicator Button */}
          <button
            onClick={onToggleSmartwatch}
            style={{
              ...smartwatchBtnStyle,
              background: isSmartwatchActive ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--border-subtle)',
              color: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--text-muted)'
            }}
            title={isSmartwatchActive ? 'Apple Watch activo ("En Reproducción")' : 'Activar Apple Watch / Reloj'}
            aria-label="Modo Apple Watch"
          >
            <Watch size={15} />
            {!isLandscape && (
              <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                {isSmartwatchActive ? 'WATCH ON' : 'WATCH'}
              </span>
            )}
          </button>

          {/* Voice Repeat Button */}
          <button 
            onClick={onRepeatAnnouncement} 
            style={iconBtnStyle} 
            title="Cantar marcador por voz"
            aria-label="Repetir marcador"
          >
            <Volume2 size={16} color={isAudioSpeaking ? 'var(--gold-primary)' : 'var(--text-muted)'} />
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
            {state.isPaused ? <Play size={16} color="var(--gold-primary)" /> : <Pause size={16} color="var(--text-muted)" />}
          </button>

          {/* Day / Night Theme Button */}
          <button
            onClick={() => themeService.toggleTheme()}
            style={{
              ...iconBtnStyle,
              background: theme === 'day' ? 'rgba(255, 214, 0, 0.18)' : 'rgba(0, 176, 255, 0.18)',
              borderColor: theme === 'day' ? 'var(--gold-primary)' : 'var(--team2-primary)'
            }}
            title={theme === 'day' ? 'Modo Noche (Estadio Neón)' : 'Modo Día (Luz Solar Alto Contraste)'}
            aria-label="Alternar modo día y noche"
          >
            {theme === 'day' ? <Sun size={16} color="var(--gold-primary)" /> : <Moon size={16} color="var(--team2-primary)" />}
          </button>

          {/* Drawer Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            style={menuTriggerBtnStyle}
            aria-label="Abrir menú de configuración"
          >
            <Menu size={18} color="var(--text-main)" />
          </button>
        </div>
      </header>

      {/* 2. PAUSE OVERLAY / BANNER */}
      {state.isPaused && (
        <div style={pauseBannerStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={pauseIconBadgeStyle}>
              <Pause size={16} color="var(--gold-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--gold-primary)' }}>
                PARTIDO EN PAUSA
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Puntos en espera • Pulsa reanudar en pantalla o Apple Watch
              </div>
            </div>
          </div>
          <button onClick={onTogglePause} style={resumeBtnStyle}>
            <Play size={13} />
            <span>Reanudar</span>
          </button>
        </div>
      )}

      {/* 2.1. REST COUNTDOWN BANNER (Cambio de Lado y Descanso) */}
      {!state.isPaused && state.isResting && (
        <div style={restBannerStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={restTimerBadgeStyle}>
              <Timer size={16} color="var(--team1-primary)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                {Math.floor((state.restSecondsRemaining || 0) / 60)}:
                {((state.restSecondsRemaining || 0) % 60) < 10 ? '0' : ''}
                {(state.restSecondsRemaining || 0) % 60}
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRightLeft size={13} color="var(--gold-primary)" />
                <span>Cambio de Lado y Descanso</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Al saque: <strong style={{ color: 'var(--team1-primary)' }}>{teams[state.servingTeam].name}</strong>
              </div>
            </div>
          </div>

          <button onClick={onSkipRest} style={skipRestBtnStyle} title="Comenzar el siguiente game inmediatamente">
            <Play size={13} />
            <span>Comenzar Ya</span>
          </button>
        </div>
      )}

      {/* 2.2. SIMPLE SIDE CHANGE BANNER */}
      {!state.isPaused && !state.isResting && state.sideChangeNeeded && (
        <div style={sideChangeBannerStyle}>
          <ArrowRightLeft size={15} />
          <span>CAMBIO DE LADO DE PISTA</span>
        </div>
      )}

      {/* 3. SETS TRACKER RIBBON (Tertiary Size: Compact, refined stadium pill strip) */}
      <div style={setsRibbonStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            SETS:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center' }}>
          {state.sets.map((set, idx) => {
            const isCurrent = idx === state.currentSetIndex;
            return (
              <div 
                key={idx} 
                style={{
                  ...setChipStyle,
                  borderColor: isCurrent ? 'var(--team1-primary)' : 'var(--border-subtle)',
                  background: isCurrent ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  boxShadow: isCurrent ? '0 0 12px var(--team1-glow)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.62rem', color: isCurrent ? 'var(--team1-primary)' : 'var(--text-dim)', fontWeight: 900 }}>
                  SET {idx + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '-0.02em' }}>
                  <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : 'var(--text-main)' }}>{set.team1}</span>
                  <span style={{ opacity: 0.35, margin: '0 3px' }}>:</span>
                  <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : 'var(--text-main)' }}>{set.team2}</span>
                </span>
                {set.tiebreakPoints && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    ({set.tiebreakPoints.team1}-{set.tiebreakPoints.team2})
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Small Landscape indicator/hint if portrait */}
        {!isLandscape && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
            <Smartphone size={12} color="var(--text-dim)" />
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Gira para horizontal</span>
          </div>
        )}
      </div>

      {/* 4. MAIN SCORE CARDS (Massive Hero Points, Secondary Games, Touch-Optimized) */}
      <div style={{
        ...scoreCardsWrapperStyle,
        flexDirection: isLandscape ? 'row' : 'column'
      }}>
        {/* TEAM 1 CARD */}
        <div 
          onClick={() => handleScoreWithHaptic('team1')}
          style={{
            ...teamCardStyle,
            borderColor: state.servingTeam === 'team1' ? 'var(--team1-primary)' : 'var(--border-subtle)',
            background: 'linear-gradient(145deg, rgba(0, 230, 118, 0.12) 0%, rgba(10, 16, 28, 0.98) 100%)',
            boxShadow: state.servingTeam === 'team1' ? '0 0 35px -8px var(--team1-glow), inset 0 0 25px -10px var(--team1-glow)' : 'var(--shadow-sm)',
            transform: lastScoredTeam === 'team1' ? 'scale(1.015)' : 'scale(1)',
            transition: 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease'
          }}
          role="button"
          tabIndex={0}
          aria-label={`Anotar punto para ${teams.team1.name}`}
        >
          {/* Top row: Team info & Secondary Games Badge */}
          <div style={teamCardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '4px', height: isLandscape ? '36px' : '30px', borderRadius: '2px', background: 'var(--team1-primary)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: isLandscape ? '1.25rem' : '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {teams.team1.name}
                  </h2>
                  {state.servingTeam === 'team1' && (
                    <span style={servingTagStyle}>
                      <CircleDot size={9} className="pulsing-dot" />
                      SAQUE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {teams.team1.player1.name} • {teams.team1.player2.name}
                </div>
              </div>
            </div>

            {/* GAMES COUNTER (Secondary Size: Refined, clear, distinctly smaller than point) */}
            <div style={gamesBadgeStyle}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 900, letterSpacing: '0.06em' }}>JUEGOS</span>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '2px',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1.5px solid rgba(0, 230, 118, 0.35)',
                padding: '2px 12px',
                borderRadius: '10px'
              }}>
                <span style={{ 
                  fontSize: isLandscape ? '2.1rem' : '1.75rem', 
                  fontWeight: 900, 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--text-main)',
                  lineHeight: 1
                }}>
                  {currentSet.team1}
                </span>
              </div>
            </div>
          </div>

          {/* CENTRAL HERO: GIANT POINT SCORE DISPLAY (DOMINATES SCREEN) */}
          <div style={pointHeroCenterStyle}>
            <div 
              className={lastScoredTeam === 'team1' ? 'score-updated' : ''}
              style={{
                ...mainScoreDigitWrapperStyle,
                color: 'var(--team1-primary)',
                textShadow: '0 0 35px var(--team1-glow), 0 0 70px rgba(0, 230, 118, 0.25)',
                fontSize: getPointFontSize(state.currentGame.team1, isLandscape)
              }}
            >
              {state.currentGame.team1}
            </div>
          </div>

          {/* Bottom Card Footer: Tap prompt and tactile button */}
          <div style={teamCardFooterStyle}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOCA LA PANTALLA PARA SUMAR
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleScoreWithHaptic('team1');
              }}
              style={scorePointBtnT1}
              aria-label={`Sumar punto ${teams.team1.name}`}
            >
              <Plus size={isLandscape ? 22 : 18} />
              <span>PUNTO</span>
            </button>
          </div>
        </div>

        {/* TEAM 2 CARD */}
        <div 
          onClick={() => handleScoreWithHaptic('team2')}
          style={{
            ...teamCardStyle,
            borderColor: state.servingTeam === 'team2' ? 'var(--team2-primary)' : 'var(--border-subtle)',
            background: 'linear-gradient(145deg, rgba(0, 176, 255, 0.12) 0%, rgba(10, 16, 28, 0.98) 100%)',
            boxShadow: state.servingTeam === 'team2' ? '0 0 35px -8px var(--team2-glow), inset 0 0 25px -10px var(--team2-glow)' : 'var(--shadow-sm)',
            transform: lastScoredTeam === 'team2' ? 'scale(1.015)' : 'scale(1)',
            transition: 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease'
          }}
          role="button"
          tabIndex={0}
          aria-label={`Anotar punto para ${teams.team2.name}`}
        >
          {/* Top row: Team info & Secondary Games Badge */}
          <div style={teamCardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '4px', height: isLandscape ? '36px' : '30px', borderRadius: '2px', background: 'var(--team2-primary)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: isLandscape ? '1.25rem' : '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {teams.team2.name}
                  </h2>
                  {state.servingTeam === 'team2' && (
                    <span style={{ ...servingTagStyle, color: 'var(--team2-primary)', borderColor: 'rgba(0, 176, 255, 0.5)', background: 'rgba(0, 176, 255, 0.12)' }}>
                      <CircleDot size={9} className="pulsing-dot" />
                      SAQUE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {teams.team2.player1.name} • {teams.team2.player2.name}
                </div>
              </div>
            </div>

            {/* GAMES COUNTER (Secondary Size: Refined, clear, distinctly smaller than point) */}
            <div style={gamesBadgeStyle}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 900, letterSpacing: '0.06em' }}>JUEGOS</span>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '2px',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1.5px solid rgba(0, 176, 255, 0.35)',
                padding: '2px 12px',
                borderRadius: '10px'
              }}>
                <span style={{ 
                  fontSize: isLandscape ? '2.1rem' : '1.75rem', 
                  fontWeight: 900, 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--text-main)',
                  lineHeight: 1
                }}>
                  {currentSet.team2}
                </span>
              </div>
            </div>
          </div>

          {/* CENTRAL HERO: GIANT POINT SCORE DISPLAY (DOMINATES SCREEN) */}
          <div style={pointHeroCenterStyle}>
            <div 
              className={lastScoredTeam === 'team2' ? 'score-updated' : ''}
              style={{
                ...mainScoreDigitWrapperStyle,
                color: 'var(--team2-primary)',
                textShadow: '0 0 35px var(--team2-glow), 0 0 70px rgba(0, 176, 255, 0.25)',
                fontSize: getPointFontSize(state.currentGame.team2, isLandscape)
              }}
            >
              {state.currentGame.team2}
            </div>
          </div>

          {/* Bottom Card Footer: Tap prompt and tactile button */}
          <div style={teamCardFooterStyle}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOCA LA PANTALLA PARA SUMAR
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleScoreWithHaptic('team2');
              }}
              style={scorePointBtnT2}
              aria-label={`Sumar punto ${teams.team2.name}`}
            >
              <Plus size={isLandscape ? 22 : 18} />
              <span>PUNTO</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM CONTROL BAR WITH LARGE UNDO & LAST ANNOUNCEMENT */}
      <footer style={isLandscape ? landscapeBottomBarStyle : bottomBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <Volume1 size={15} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
          <span style={lastEventTextStyle}>
            {state.lastEventAnnouncement || 'Listo para el saque'}
          </span>
        </div>

        <button 
          onClick={onUndo} 
          style={undoBtnStyle}
          aria-label="Deshacer último punto"
          title="Deshacer último punto jugado"
        >
          <RotateCcw size={16} />
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
  gap: '6px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  background: 'radial-gradient(ellipse at 50% 20%, #0d1527 0%, var(--bg-deep) 75%)'
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 'var(--radius-md)',
  flexShrink: 0,
  minHeight: '44px'
};

const landscapeTopBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '8px',
  flexShrink: 0,
  minHeight: '36px'
};

const centerStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
};

const courtMiniBadge: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  padding: '3px 8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-full)',
  fontWeight: 700
};

const goldenPointMiniBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.68rem',
  fontWeight: 900,
  padding: '3px 10px',
  background: 'linear-gradient(90deg, #ffd600 0%, #ffab00 100%)',
  color: '#070a10',
  borderRadius: 'var(--radius-full)',
  letterSpacing: '0.04em',
  boxShadow: '0 0 15px var(--gold-glow)'
};

const tieBreakMiniBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.68rem',
  fontWeight: 900,
  padding: '3px 10px',
  background: 'rgba(0, 176, 255, 0.2)',
  border: '1px solid var(--team2-primary)',
  color: 'var(--team2-primary)',
  borderRadius: 'var(--radius-full)'
};

const smartwatchBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '5px 8px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid',
  cursor: 'pointer'
};

const iconBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const menuTriggerBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '8px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const pauseBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid var(--gold-primary)',
  borderRadius: 'var(--radius-md)',
  animation: 'fadeIn 0.2s ease-out'
};

const pauseIconBadgeStyle: React.CSSProperties = {
  padding: '5px',
  borderRadius: '6px',
  background: 'rgba(255, 214, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const resumeBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 12px',
  background: 'var(--gold-primary)',
  color: '#070a10',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 900,
  fontSize: '0.78rem',
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(255, 214, 0, 0.3)'
};

const restBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.12) 0%, rgba(14, 21, 36, 0.95) 100%)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  borderRadius: 'var(--radius-md)',
  animation: 'fadeIn 0.2s ease-out'
};

const restTimerBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 8px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid var(--team1-primary)',
  borderRadius: '6px'
};

const skipRestBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 900,
  fontSize: '0.78rem',
  cursor: 'pointer',
  boxShadow: '0 2px 10px var(--team1-glow)'
};

const sideChangeBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '5px',
  background: 'rgba(0, 176, 255, 0.15)',
  border: '1px solid rgba(0, 176, 255, 0.35)',
  color: 'var(--team2-primary)',
  fontWeight: 900,
  fontSize: '0.72rem',
  borderRadius: '6px',
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
  gap: '6px',
  padding: '2px 10px',
  borderRadius: '8px',
  border: '1px solid',
  whiteSpace: 'nowrap'
};

const scoreCardsWrapperStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flex: 1,
  minHeight: 0
};

const teamCardStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: '18px',
  border: '1.5px solid',
  padding: 'clamp(8px, 1.8vw, 14px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 0,
  cursor: 'pointer',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  position: 'relative',
  overflow: 'hidden'
};

const teamCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexShrink: 0
};

const servingTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.62rem',
  fontWeight: 900,
  padding: '2px 7px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid rgba(0, 230, 118, 0.5)',
  color: 'var(--team1-primary)',
  background: 'rgba(0, 230, 118, 0.12)',
  letterSpacing: '0.04em'
};

const gamesBadgeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  lineHeight: 1,
  flexShrink: 0
};

const pointHeroCenterStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0,
  padding: '4px 0'
};

const mainScoreDigitWrapperStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontWeight: 900,
  letterSpacing: '-0.06em',
  lineHeight: 0.85,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  textAlign: 'center'
};

const teamCardFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  paddingTop: '2px'
};

const scorePointBtnT1: React.CSSProperties = {
  padding: 'clamp(8px, 2vw, 12px) clamp(14px, 3.5vw, 24px)',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer',
  boxShadow: '0 3px 15px var(--team1-glow)'
};

const scorePointBtnT2: React.CSSProperties = {
  padding: 'clamp(8px, 2vw, 12px) clamp(14px, 3.5vw, 24px)',
  background: 'var(--team2-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer',
  boxShadow: '0 3px 15px var(--team2-glow)'
};

const bottomBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  flexShrink: 0,
  minHeight: '40px'
};

const landscapeBottomBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '8px',
  flexShrink: 0,
  minHeight: '34px'
};

const lastEventTextStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#cbd5e1',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden'
};

const undoBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 14px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-main)',
  fontSize: '0.75rem',
  fontWeight: 900,
  letterSpacing: '0.04em',
  flexShrink: 0,
  cursor: 'pointer'
};
