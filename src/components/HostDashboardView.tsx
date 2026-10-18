import React, { useState, useEffect } from 'react';
import type { MatchRules, CommunityPlayer } from '../types/padel';
import type { UserSession } from '../services/authService';
import { communityService } from '../services/communityService';
import { notificationService } from '../services/notificationService';
import { themeService, type AppTheme } from '../services/themeService';
import { 
  Trophy, 
  Watch, 
  LogOut, 
  ChevronRight, 
  Flame,
  Sun,
  Moon,
  Zap,
  Bell,
  BellRing
} from 'lucide-react';

interface Props {
  user: UserSession;
  rules: MatchRules;
  onUpdateRules: (newRules: MatchRules) => void;
  onProceedToLobby: () => void;
  onOpenCommunity: () => void;
  onOpenBluetoothModal: () => void;
  onOpenNotifications?: () => void;
  onLogout: () => void;
}

export const HostDashboardView: React.FC<Props> = ({
  user,
  rules,
  onUpdateRules,
  onProceedToLobby,
  onOpenCommunity,
  onOpenBluetoothModal,
  onOpenNotifications,
  onLogout
}) => {
  const [courtName, setCourtName] = useState(rules.courtName || 'Pista Central - Club Padel');
  const [format, setFormat] = useState(rules.format);
  const [gameRule, setGameRule] = useState(rules.gameRule);
  const [thirdSetRule, setThirdSetRule] = useState(rules.thirdSetRule);
  const [sideChangeEnabled, setSideChangeEnabled] = useState(rules.sideChangeEnabled !== false);
  const [sideChangeRestSeconds, setSideChangeRestSeconds] = useState(rules.sideChangeRestSeconds !== undefined ? rules.sideChangeRestSeconds : 90);
  const [unreadNotifs, setUnreadNotifs] = useState(() => notificationService.getUnreadCount());
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());

  useEffect(() => {
    return themeService.subscribe(setTheme);
  }, []);

  useEffect(() => {
    const unsub = notificationService.subscribe(() => {
      setUnreadNotifs(notificationService.getUnreadCount());
    });
    return () => unsub();
  }, []);

  // Retrieve player stats
  const player = communityService.searchPlayer(user.name).find(p => p.id === user.id) || communityService.getPlayers().find((p: CommunityPlayer) => p.name.toLowerCase() === user.name.toLowerCase());

  const totalMatches = player?.matchesPlayed || 0;
  const winRate = totalMatches > 0 ? Math.round(((player?.matchesWon || 0) / totalMatches) * 100) : 0;
  const dayPlayed = player?.dayMatchesPlayed || 0;
  const dayWon = player?.dayMatchesWon || 0;
  const dayRate = dayPlayed > 0 ? Math.round((dayWon / dayPlayed) * 100) : null;
  const nightPlayed = player?.nightMatchesPlayed || 0;
  const nightWon = player?.nightMatchesWon || 0;
  const nightRate = nightPlayed > 0 ? Math.round((nightWon / nightPlayed) * 100) : null;
  const gpPlayed = player?.goldenPointsPlayed || 0;
  const gpWon = player?.goldenPointsWon || 0;
  const tbPlayed = player?.tieBreaksPlayed || 0;
  const tbWon = player?.tieBreaksWon || 0;
  const dominant = player?.dominantHand || user.dominantHand || 'diestro';
  const pos = player?.favoritePosition || user.favoritePosition || 'drive';
  const city = player?.city || user.city;

  const handleStartMatchSetup = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRules({
      ...rules,
      courtName,
      format,
      gameRule,
      thirdSetRule,
      superTieBreakTarget: 10,
      sideChangeEnabled,
      sideChangeRestSeconds: sideChangeEnabled ? sideChangeRestSeconds : 0
    });
    onProceedToLobby();
  };

  return (
    <div style={containerStyle}>
      {/* Top Bar */}
      <header style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.2)' }} 
          />
          <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
            PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Day / Night Theme Switcher */}
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            style={themeToggleTopBtnStyle}
            title={theme === 'day' ? 'Cambiar a Modo Noche (Estadio Neón)' : 'Cambiar a Modo Día (Luz Natural / Alto Contraste)'}
            aria-label="Cambiar tema día/noche"
          >
            {theme === 'day' ? (
              <>
                <Sun size={15} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Día</span>
              </>
            ) : (
              <>
                <Moon size={15} color="var(--team2-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Noche</span>
              </>
            )}
          </button>

          {onOpenNotifications && (
            <button 
              onClick={onOpenNotifications} 
              style={notifBellBtnStyle} 
              title="Centro de Notificaciones & Partidos Abiertos"
              type="button"
            >
              <Bell size={18} color="var(--gold-primary)" />
              {unreadNotifs > 0 && (
                <span style={unreadBadgeCountStyle}>{unreadNotifs}</span>
              )}
            </button>
          )}

          <button onClick={onLogout} style={logoutBtnStyle} title="Cerrar sesión">
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <div style={mainGridStyle}>
        {/* Left Column: User Profile & Stats */}
        <div style={profileCardStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={avatarStyle}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ficha Oficial del Jugador
                </span>
                {user.plan === 'pro_founder' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold-primary)', background: 'rgba(255, 214, 0, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                    PRO FUNDADOR
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 4px' }}>{user.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span className="badge badge-team1" style={{ fontSize: '0.7rem' }}>
                  {user.category} Cat
                </span>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                  ELO {player?.elo || user.elo}
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: '#e2e8f0' }}>
                  {dominant === 'zurdo' ? '⭐ Zurdo' : '🎾 Diestro'} • {pos === 'drive' ? 'Drive' : pos === 'reves' ? 'Revés' : 'Ambos'}
                </span>
                {city && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    📍 {city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={metricsGridStyle}>
            <div style={metricItemStyle}>
              <div style={metricNumStyle}>{totalMatches}</div>
              <div style={metricLabelStyle}>Partidos</div>
            </div>
            <div style={metricItemStyle}>
              <div style={{ ...metricNumStyle, color: 'var(--team1-primary)' }}>
                {player?.matchesWon || 0}
              </div>
              <div style={metricLabelStyle}>Victorias</div>
            </div>
            <div style={metricItemStyle}>
              <div style={{ ...metricNumStyle, color: '#38bdf8' }}>
                {winRate}%
              </div>
              <div style={metricLabelStyle}>Efectividad</div>
            </div>
            <div style={metricItemStyle}>
              <div style={{ ...metricNumStyle, color: 'var(--gold-primary)' }}>
                {player?.winStreak || 0}
              </div>
              <div style={metricLabelStyle}>Racha</div>
            </div>
          </div>

          {/* Analítica Situacional: Luz Día vs Noche Artificial */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={13} color="#facc15" />
              <span>Rendimiento por Horario e Iluminación</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(250, 204, 21, 0.06)', border: '1px solid rgba(250, 204, 21, 0.2)', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#facc15', fontWeight: 700 }}>
                  <Sun size={12} /> Luz Natural (Día)
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                  {dayRate !== null ? `${dayRate}%` : '---'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {dayWon}W de {dayPlayed} PJ
                </div>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                  <Moon size={12} /> Foco Noche (Artificial)
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                  {nightRate !== null ? `${nightRate}%` : '---'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {nightWon}W de {nightPlayed} PJ
                </div>
              </div>
            </div>
          </div>

          {/* Factor Clutch & Sinergia */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} color="var(--gold-primary)" />
              <span>Factor Clutch & Algoritmo de Parejas</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ⚡ Puntos de Oro: <strong style={{ color: 'var(--text-main)' }}>{gpWon}/{gpPlayed}</strong> ({gpPlayed > 0 ? Math.round((gpWon / gpPlayed) * 100) : 0}%)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                🎯 Tie-Breaks: <strong style={{ color: 'var(--text-main)' }}>{tbWon}/{tbPlayed}</strong> ({tbPlayed > 0 ? Math.round((tbWon / tbPlayed) * 100) : 0}%)
              </div>
            </div>

            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>🤝 Pareja Ideal:</span>
                <span style={{ fontWeight: 700, color: 'var(--team1-primary)' }}>
                  {player?.bestPartner ? `${player.bestPartner.name} (${player.bestPartner.winRate}%)` : 'Por computar'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>⚔️ Némesis en Cancha:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger-primary)' }}>
                  {player?.nemesis ? `${player.nemesis.name} (${player.nemesis.lossRate}% derrotas)` : 'Sin némesis'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            {onOpenNotifications && (
              <button onClick={onOpenNotifications} style={secondaryLinkBtnStyle} type="button">
                <BellRing size={16} color="var(--gold-primary)" />
                <span>Partidos Abiertos ("Falta 1") & Alertas</span>
                {unreadNotifs > 0 && (
                  <span className="badge badge-gold" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                    {unreadNotifs} nuevas
                  </span>
                )}
                <ChevronRight size={16} style={{ marginLeft: unreadNotifs > 0 ? '6px' : 'auto' }} />
              </button>
            )}

            <button onClick={onOpenCommunity} style={secondaryLinkBtnStyle}>
              <Trophy size={16} color="var(--gold-primary)" />
              <span>Ver Ranking ELO de la Comunidad</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </button>
            <button onClick={onOpenBluetoothModal} style={secondaryLinkBtnStyle}>
              <Watch size={16} color="var(--team1-primary)" />
              <span>Configurar Apple Watch & Samsung Watch</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </div>

        {/* Right Column: Create New Match & Parameters */}
        <div style={matchSetupCardStyle} className="glass-panel">
          <div style={{ marginBottom: '20px' }}>
            <span className="badge badge-team1" style={{ marginBottom: '8px' }}>
              <Flame size={12} />
              PASO 1 DE 3
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Configuración de Partido</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Define las reglas y genera el código QR para sumar a los otros 3 jugadores
            </p>
          </div>

          <form onSubmit={handleStartMatchSetup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Court Name */}
            <div>
              <label style={labelStyle}>Nombre de Cancha o Club</label>
              <input
                type="text"
                required
                value={courtName}
                onChange={e => setCourtName(e.target.value)}
                placeholder="Ej: Cancha Central, Club Deportivo..."
                style={inputStyle}
              />
            </div>

            {/* Match Format */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Formato de Partido</label>
                <div style={radioGroupStyle}>
                  <button
                    type="button"
                    onClick={() => setFormat('best_of_3')}
                    style={{
                      ...radioBtnStyle,
                      background: format === 'best_of_3' ? 'var(--team1-dark)' : 'var(--bg-elevated)',
                      borderColor: format === 'best_of_3' ? 'var(--team1-primary)' : 'var(--border-subtle)',
                      color: format === 'best_of_3' ? 'var(--team1-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Mejor de 3 Sets
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('single_set')}
                    style={{
                      ...radioBtnStyle,
                      background: format === 'single_set' ? 'var(--team1-dark)' : 'var(--bg-elevated)',
                      borderColor: format === 'single_set' ? 'var(--team1-primary)' : 'var(--border-subtle)',
                      color: format === 'single_set' ? 'var(--team1-primary)' : 'var(--text-muted)'
                    }}
                  >
                    1 Set Pro (a 9)
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Regla en 40-40</label>
                <div style={radioGroupStyle}>
                  <button
                    type="button"
                    onClick={() => setGameRule('golden_point')}
                    style={{
                      ...radioBtnStyle,
                      background: gameRule === 'golden_point' ? 'rgba(255, 214, 0, 0.15)' : 'var(--bg-elevated)',
                      borderColor: gameRule === 'golden_point' ? 'var(--gold-primary)' : 'var(--border-subtle)',
                      color: gameRule === 'golden_point' ? 'var(--gold-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Punto de Oro (No-Ad)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameRule('advantage')}
                    style={{
                      ...radioBtnStyle,
                      background: gameRule === 'advantage' ? 'var(--team2-dark)' : 'var(--bg-elevated)',
                      borderColor: gameRule === 'advantage' ? 'var(--team2-primary)' : 'var(--border-subtle)',
                      color: gameRule === 'advantage' ? 'var(--team2-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Ventajas (Deuce)
                  </button>
                </div>
              </div>
            </div>

            {/* Tie-break rule */}
            {format === 'best_of_3' && (
              <div>
                <label style={labelStyle}>Desempate en 3er Set</label>
                <div style={radioGroupStyle}>
                  <button
                    type="button"
                    onClick={() => setThirdSetRule('super_tiebreak')}
                    style={{
                      ...radioBtnStyle,
                      background: thirdSetRule === 'super_tiebreak' ? 'var(--team1-dark)' : 'var(--bg-elevated)',
                      borderColor: thirdSetRule === 'super_tiebreak' ? 'var(--team1-primary)' : 'var(--border-subtle)',
                      color: thirdSetRule === 'super_tiebreak' ? 'var(--team1-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Súper Tie-break (a 10 puntos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setThirdSetRule('full_set')}
                    style={{
                      ...radioBtnStyle,
                      background: thirdSetRule === 'full_set' ? 'var(--bg-card)' : 'var(--bg-elevated)',
                      borderColor: thirdSetRule === 'full_set' ? 'var(--border-medium)' : 'var(--border-subtle)',
                      color: thirdSetRule === 'full_set' ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    Set Completo a 6 juegos
                  </button>
                </div>
              </div>
            )}

            {/* Side Change & Rest Settings */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                    Cambio de Lado en Juegos Impares
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Regla FIP: cambio de campo al terminar games 1, 3, 5, etc.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSideChangeEnabled(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: sideChangeEnabled ? 'var(--team1-primary)' : 'rgba(255,255,255,0.05)',
                      color: sideChangeEnabled ? '#000' : 'var(--text-muted)',
                      border: '1px solid ' + (sideChangeEnabled ? 'var(--team1-primary)' : 'var(--border-subtle)')
                    }}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setSideChangeEnabled(false)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: !sideChangeEnabled ? 'var(--danger-primary)' : 'rgba(255,255,255,0.05)',
                      color: !sideChangeEnabled ? '#fff' : 'var(--text-muted)',
                      border: '1px solid ' + (!sideChangeEnabled ? 'var(--danger-primary)' : 'var(--border-subtle)')
                    }}
                  >
                    No
                  </button>
                </div>
              </div>

              {sideChangeEnabled && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <label style={{ ...labelStyle, marginBottom: '6px' }}>
                    Tiempo de Descanso en Cambio de Lado (segundos)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { secs: 60, label: '60s' },
                      { secs: 90, label: '90s (FIP)' },
                      { secs: 120, label: '120s' },
                      { secs: 0, label: 'Sin descanso' }
                    ].map(item => (
                      <button
                        key={item.secs}
                        type="button"
                        onClick={() => setSideChangeRestSeconds(item.secs)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          background: sideChangeRestSeconds === item.secs ? 'rgba(0, 230, 118, 0.15)' : 'var(--bg-deep)',
                          borderColor: sideChangeRestSeconds === item.secs ? 'var(--team1-primary)' : 'var(--border-subtle)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          color: sideChangeRestSeconds === item.secs ? 'var(--team1-primary)' : 'var(--text-muted)'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button type="submit" style={primaryActionBtnStyle}>
              <span>Generar Código QR y Sala de Espera</span>
              <ChevronRight size={20} />
            </button>
          </form>
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

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-subtle)'
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
  fontSize: '0.8rem',
  fontWeight: 700
};

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px',
  maxWidth: '1000px',
  margin: '0 auto'
};

const profileCardStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: 'var(--radius-lg)'
};

const avatarStyle: React.CSSProperties = {
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '1.4rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 20px var(--team1-glow)'
};

const metricsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  padding: '14px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-md)',
  textAlign: 'center'
};

const metricItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const metricNumStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 900,
  fontFamily: 'var(--font-mono)'
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  marginTop: '2px'
};

const secondaryLinkBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  fontWeight: 600,
  textAlign: 'left'
};

const matchSetupCardStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: 'var(--radius-lg)'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-main)',
  fontSize: '0.95rem',
  outline: 'none'
};

const radioGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '6px'
};

const radioBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid',
  fontSize: '0.85rem',
  fontWeight: 700,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)'
};

const primaryActionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: 'var(--radius-md)',
  fontWeight: 900,
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '10px',
  boxShadow: '0 4px 20px var(--team1-glow)'
};

const notifBellBtnStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: 'rgba(255, 214, 0, 0.1)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  cursor: 'pointer'
};

const unreadBadgeCountStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: 'var(--danger-primary)',
  color: '#ffffff',
  fontSize: '0.65rem',
  fontWeight: 900,
  width: '17px',
  height: '17px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 8px rgba(255, 61, 113, 0.6)'
};

const themeToggleTopBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)'
};
