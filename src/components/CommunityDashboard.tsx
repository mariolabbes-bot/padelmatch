import React, { useState, useEffect } from 'react';
import type { PlayerCategory, DominantHand } from '../types/padel';
import { communityService } from '../services/communityService';
import { themeService, type AppTheme } from '../services/themeService';
import { authService, type UserSession } from '../services/authService';
import { groupService } from '../services/groupService';
import { getEloTier, DEFAULT_INITIAL_ELO } from '../engine/eloEngine';
import { 
  Trophy, 
  Users, 
  Search, 
  Crown, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  UserPlus,
  Trash2,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface Props {
  onBackToScoreboard: () => void;
  currentUser?: UserSession | null;
}

export type RankingScope = 'chile' | 'laserena' | 'coquimbo' | 'groups';

export const CommunityDashboard: React.FC<Props> = ({ onBackToScoreboard, currentUser: propUser }) => {
  const [currentUser] = useState<UserSession | null>(() => propUser || authService.getCurrentUser());
  const [selectedScope, setSelectedScope] = useState<RankingScope>('chile');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ranking' | 'matches' | 'saas'>('ranking');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());

  useEffect(() => {
    return themeService.subscribe(setTheme);
  }, []);

  // New Player Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [dominantHand, setDominantHand] = useState<DominantHand>('diestro');
  const [category, setCategory] = useState<PlayerCategory>('4ta');
  const [initialElo, setInitialElo] = useState<number>(DEFAULT_INITIAL_ELO);
  const [position, setPosition] = useState<'drive' | 'reves' | 'ambas'>('ambas');

  const allPlayers = communityService.getPlayers();
  const allMatches = communityService.getMatches();

  // User Groups members set for "Mis Grupos" scope
  const userGroups = currentUser ? groupService.getUserGroups(currentUser.id) : groupService.getGroups();
  const groupMemberIdentifiers = new Set<string>();
  userGroups.forEach(g => {
    g.members.forEach(m => {
      groupMemberIdentifiers.add(m.playerId);
      groupMemberIdentifiers.add(m.name.toLowerCase());
    });
  });

  const filteredPlayers = allPlayers.filter(p => {
    // 1. Territory / Scope filter
    let matchesScope = true;
    if (selectedScope === 'laserena') {
      const cityMatch = p.city?.toLowerCase().includes('serena') || false;
      const clubMatch = p.club?.toLowerCase().includes('serena') || false;
      matchesScope = cityMatch || clubMatch;
    } else if (selectedScope === 'coquimbo') {
      const cityMatch = p.city?.toLowerCase().includes('coquimbo') || false;
      const clubMatch = p.club?.toLowerCase().includes('coquimbo') || false;
      matchesScope = cityMatch || clubMatch;
    } else if (selectedScope === 'groups') {
      matchesScope = groupMemberIdentifiers.has(p.id) || groupMemberIdentifiers.has(p.name.toLowerCase());
    }

    // 2. ELO Tier filter
    const tier = getEloTier(p.elo);
    const matchesTier = selectedTier === 'all' || tier.tier === selectedTier;

    // 3. Search query
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.club && p.club.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesScope && matchesTier && matchesQuery;
  });

  const scopes: { id: RankingScope; label: string; icon: string }[] = [
    { id: 'chile', label: 'Todo Chile', icon: '🇨🇱' },
    { id: 'laserena', label: 'La Serena', icon: '📍' },
    { id: 'coquimbo', label: 'Coquimbo', icon: '📍' },
    { id: 'groups', label: 'Mis Grupos', icon: '👥' }
  ];

  const tiers: { id: string; label: string }[] = [
    { id: 'all', label: 'Todos los Tiers' },
    { id: 'master', label: '👑 Master (1850+)' },
    { id: 'competicion', label: '💎 Competición (1600+)' },
    { id: 'avanzado', label: '🥇 Avanzado (1350+)' },
    { id: 'intermedio', label: '🥈 Intermedio (1150+)' },
    { id: 'amateur', label: '🥉 Amateur (<1150)' }
  ];

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    communityService.addPlayer({
      name,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      dominantHand,
      category,
      elo: initialElo,
      favoritePosition: position
    });

    setName('');
    setEmail('');
    setPhone('');
    setCity('');
    setDominantHand('diestro');
    setIsAddModalOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleClearDatabase = () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar y reiniciar la base de jugadores y partidos? Esta acción borrará los registros almacenados en el navegador.')) {
      communityService.clearAllData();
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div style={containerStyle} key={refreshKey}>
      {/* Header bar */}
      <div style={headerStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.2)', flexShrink: 0 }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-gold">Módulo D • Ranking & Comunidad</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Circuito Real de Pádel</span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '4px', color: 'var(--text-main)' }}>
              Ranking ELO Oficial & Comunidad de Jugadores
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Base de datos limpia y oficial. Registra jugadores reales de tu club y visualiza el ranking actualizado tras cada partido.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Day / Night Theme Button */}
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem'
            }}
            title={theme === 'day' ? 'Cambiar a Modo Noche' : 'Cambiar a Modo Día'}
          >
            {theme === 'day' ? <Sun size={15} color="var(--gold-primary)" /> : <Moon size={15} color="var(--team2-primary)" />}
            <span>{theme === 'day' ? 'Día' : 'Noche'}</span>
          </button>

          <button onClick={() => setIsAddModalOpen(true)} style={addPlayerBtnStyle}>
            <UserPlus size={16} />
            <span>+ Registrar Jugador Real</span>
          </button>

          <button onClick={handleClearDatabase} style={clearDbBtnStyle} title="Vaciar base de datos">
            <Trash2 size={16} />
          </button>

          <button onClick={onBackToScoreboard} style={backBtnStyle}>
            <span>Volver a Cancha</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={tabsRowStyle}>
        {[
          { id: 'ranking', label: `Tabla de Ranking ELO (${allPlayers.length})`, icon: Trophy },
          { id: 'matches', label: `Historial de Partidos (${allMatches.length})`, icon: Calendar },
          { id: 'saas', label: 'Club SaaS & Planes', icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...tabBtnStyle,
                borderColor: isActive ? 'var(--team1-primary)' : 'var(--border-subtle)',
                background: isActive ? 'rgba(0, 230, 118, 0.1)' : 'var(--bg-elevated)',
                color: isActive ? 'var(--team1-primary)' : 'var(--text-muted)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RANKING LEADERBOARD */}
      {activeTab === 'ranking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top 3 Podium Highlight (If at least 1 player exists) */}
          {filteredPlayers.length > 0 ? (
            <div style={podiumGridStyle}>
              {filteredPlayers.slice(0, 3).map((player, index) => {
                const placeColors = ['#ffd600', '#cbd5e1', '#cd7f32'];
                const medals = ['1°', '2°', '3°'];
                const pTier = getEloTier(player.elo);
                return (
                  <div 
                    key={player.id} 
                    style={{
                      ...podiumCardStyle,
                      borderColor: placeColors[index] || 'var(--border-subtle)'
                    }} 
                    className="glass-panel"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: placeColors[index] }}>
                        {medals[index]} LUGAR
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: pTier.color, background: `${pTier.color}22`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${pTier.color}` }}>
                          {pTier.badge}
                        </span>
                        <Crown size={20} color={placeColors[index]} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
                      <div style={{ ...podiumAvatar, borderColor: placeColors[index] }}>
                        <Users size={22} color="#fff" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{player.name}</h3>
                          {player.dominantHand === 'zurdo' && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 214, 0, 0.2)', color: 'var(--gold-primary)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                              ⭐ ZURDO
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span style={{ color: 'var(--text-dim)' }}>(Ref: {player.category} Cat)</span> • {player.favoritePosition.toUpperCase()} {player.city ? `• 📍 ${player.city}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={podiumMetricsRow}>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)' }}>
                          {player.elo}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>RATING ELO</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--team1-primary)' }}>
                          {Math.round((player.matchesWon / (player.matchesPlayed || 1)) * 100)}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>VICTORIAS</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00b0ff' }}>
                          {player.winStreak}🔥
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>RACHA</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={emptyDatabaseCard} className="glass-panel">
              <Users size={40} color="var(--team1-primary)" style={{ marginBottom: '12px' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Base de Datos Lista para Jugadores Reales
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '500px', margin: '8px auto 16px' }}>
                Se ha limpiado el padrón de prueba. Registra los jugadores de tu grupo o club con sus nombres, categorías y ELO inicial para comenzar a rankearlos.
              </p>
              <button onClick={() => setIsAddModalOpen(true)} style={addPlayerBtnStyle}>
                <UserPlus size={16} />
                <span>+ Registrar Primer Jugador</span>
              </button>
            </div>
          )}

          {/* Filters Bar: Scope / Territory & Tiers */}
          <div style={filtersBarStyle} className="glass-panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '280px' }}>
              {/* Territory / Scope Buttons */}
              <div style={categoryChipsWrapper}>
                {scopes.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScope(sc.id)}
                    style={{
                      ...catChipStyle,
                      background: selectedScope === sc.id ? 'var(--team1-primary)' : 'rgba(255,255,255,0.04)',
                      color: selectedScope === sc.id ? '#050c18' : '#cbd5e1',
                      fontWeight: selectedScope === sc.id ? 900 : 700
                    }}
                  >
                    <span>{sc.icon}</span>
                    <span>{sc.label}</span>
                  </button>
                ))}
              </div>

              {/* Tier Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {tiers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: selectedTier === t.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                      background: selectedTier === t.id ? 'rgba(255, 214, 0, 0.15)' : 'transparent',
                      color: selectedTier === t.id ? 'var(--gold-primary)' : 'var(--text-dim)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={searchBoxStyle}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar por jugador, club o ciudad..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>

          {/* Leaderboard Table */}
          {filteredPlayers.length > 0 && (
            <div style={tableContainerStyle} className="glass-panel">
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}># RANK</th>
                    <th style={thStyle}>JUGADOR REAL</th>
                    <th style={thStyle}>TIER ELO</th>
                    <th style={thStyle}>RATING ELO</th>
                    <th style={thStyle}>CAT. REF.</th>
                    <th style={thStyle}>PJ</th>
                    <th style={thStyle}>PG</th>
                    <th style={thStyle}>% VICTORIAS</th>
                    <th style={thStyle}>RACHA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, idx) => {
                    const pTier = getEloTier(player.elo);
                    return (
                      <tr key={player.id} style={tableRowStyle}>
                        <td style={{ ...tdStyle, fontWeight: 900, fontFamily: 'var(--font-mono)', color: idx < 3 ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
                          #{idx + 1}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ ...miniTableAvatar, borderColor: pTier.color }}>
                              <Users size={14} color="#00e676" />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{player.name}</span>
                                {player.dominantHand === 'zurdo' && (
                                  <span style={{ fontSize: '0.62rem', background: 'rgba(255, 214, 0, 0.2)', color: 'var(--gold-primary)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                    ⭐ ZURDO
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <span>{player.favoritePosition === 'drive' ? 'Drive' : player.favoritePosition === 'reves' ? 'Revés' : 'Ambos'}</span>
                                {player.city && <span>• 📍 {player.city}</span>}
                                {player.club && <span>• 🏟️ {player.club}</span>}
                                {player.phone && <span>• 📲 {player.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: pTier.color,
                            background: `${pTier.color}20`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${pTier.color}40`,
                            whiteSpace: 'nowrap'
                          }}>
                            {pTier.badge}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--gold-primary)', fontSize: '1.05rem' }}>
                          ⚡ {player.elo} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>pts</span>
                        </td>
                        <td style={tdStyle}>
                          <span className="badge badge-team2" style={{ fontSize: '0.68rem' }} title="Categoría deportiva de referencia (autodeclarada)">
                            {player.category} (Ref)
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {player.matchesPlayed}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: 700 }}>
                          {player.matchesWon}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00e676' }}>
                            {Math.round((player.matchesWon / (player.matchesPlayed || 1)) * 100)}%
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)', fontWeight: 800 }}>
                          {player.winStreak > 0 ? `${player.winStreak} 🔥` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATCHES HISTORY */}
      {activeTab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allMatches.length > 0 ? (
            allMatches.map(match => (
              <div key={match.id} style={matchCardStyle} className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-team1">{match.courtName}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {new Date(match.date).toLocaleDateString()}
                  </span>
                </div>

                <div style={matchTeamsLayout}>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: match.winner === 'team1' ? 'var(--team1-primary)' : '#cbd5e1' }}>
                      {match.team1.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {match.team1.playerNames.join(' & ')}
                    </div>
                  </div>

                  <div style={matchScorePill}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: match.winner === 'team1' ? 'var(--team1-primary)' : '#94a3b8' }}>
                      {match.team1.scoreSets}
                    </span>
                    <span style={{ opacity: 0.35, fontSize: '1.2rem' }}> : </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: match.winner === 'team2' ? 'var(--team2-primary)' : '#94a3b8' }}>
                      {match.team2.scoreSets}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: match.winner === 'team2' ? 'var(--team2-primary)' : '#cbd5e1' }}>
                      {match.team2.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {match.team2.playerNames.join(' & ')}
                    </div>
                  </div>
                </div>

                <div style={setsBreakdownRow}>
                  {match.sets.map((s, i) => (
                    <span key={i} style={setMiniBadge}>
                      Set {i + 1}: {s.team1}-{s.team2}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={emptyDatabaseCard} className="glass-panel">
              <Calendar size={40} color="var(--team2-primary)" style={{ marginBottom: '12px' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Historial de Partidos Limpio
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '8px auto' }}>
                Los partidos jugados y finalizados en el marcador en vivo se guardarán automáticamente aquí con su resultado oficial.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAAS & MONETIZATION STRATEGY */}
      {activeTab === 'saas' && (
        <div style={saasGridStyle}>
          {/* B2C Freemium Player Card */}
          <div style={saasCardStyle} className="glass-panel">
            <span className="badge badge-team1" style={{ marginBottom: '12px' }}>
              MODELO B2C • JUGADORES
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>PadelMatch Player Pass</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              La experiencia premium individual para amantes del pádel competitivo.
            </p>

            <div style={{ margin: '20px 0', fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--team1-primary)' }}>
              $3.990 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>CLP / mes</span>
            </div>

            <ul style={featuresListStyle}>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="#00e676" /> Historial ilimitado de partidos y rivalidades cruzadas</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="#00e676" /> Cálculo de ELO y estadísticas avanzadas por posición</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="#00e676" /> Tarjetas gráficas para compartir en Instagram/WhatsApp</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="#00e676" /> Descuentos en clubes asociados de la red</li>
            </ul>

            <button style={b2cUpgradeBtn}>Activar Player Pro</button>
          </div>

          {/* B2B Club SaaS Card */}
          <div style={{ ...saasCardStyle, borderColor: 'rgba(255, 214, 0, 0.4)' }} className="glass-panel">
            <span className="badge badge-gold" style={{ marginBottom: '12px' }}>
              MODELO B2B • CLUBES & COMPLEJOS (SaaS)
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>PadelMatch Court Engine SaaS</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Convierte las canchas de tu club en pistas inteligentes con marcadores en TV, voz y hardware.
            </p>

            <div style={{ margin: '20px 0', fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)' }}>
              $29.900 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>CLP / cancha / mes</span>
            </div>

            <ul style={featuresListStyle}>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="var(--gold-primary)" /> Licencia de Marcador Digital Oficial en TV por Cancha</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="var(--gold-primary)" /> Arbitraje por Voz en Parlantes Bluetooth integrados</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="var(--gold-primary)" /> Banners publicitarios y patrocinadores del club en pantalla</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="var(--gold-primary)" /> Ranking interno de socios y torneos automáticos</li>
              <li style={featureItemStyle}><CheckCircle2 size={16} color="var(--gold-primary)" /> Pack de pulsadores físicos Bluetooth incluidos por pista</li>
            </ul>

            <button style={b2bUpgradeBtn}>Contactar Ventas Club SaaS</button>
          </div>
        </div>
      )}

      {/* Modal: Registrar Jugador Real */}
      {isAddModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={addModalCard} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--team1-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Registrar Jugador Real</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlayer}>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mario Labbé"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={fieldInputStyle}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={fieldLabelStyle}>Categoría</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as PlayerCategory)}
                    style={fieldSelectStyle}
                  >
                    <option value="1ra">1ra Categoría</option>
                    <option value="2da">2da Categoría</option>
                    <option value="3ra">3ra Categoría</option>
                    <option value="4ta">4ta Categoría</option>
                    <option value="5ta">5ta Categoría</option>
                    <option value="6ta">6ta Categoría</option>
                    <option value="Iniciación">Iniciación</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Rating ELO Inicial</label>
                  <input
                    type="number"
                    min="600"
                    max="2200"
                    step="25"
                    value={initialElo}
                    onChange={e => setInitialElo(parseInt(e.target.value) || 1200)}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={fieldLabelStyle}>Correo (Opcional)</label>
                  <input
                    type="email"
                    placeholder="jugador@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Teléfono (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={fieldLabelStyle}>Mano Hábil</label>
                  <select
                    value={dominantHand}
                    onChange={e => setDominantHand(e.target.value as DominantHand)}
                    style={fieldSelectStyle}
                  >
                    <option value="diestro">Diestro 🎾</option>
                    <option value="zurdo">Zurdo ⭐ (Pareja Oro)</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Ciudad / Club (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Santiago / Club Padel"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={fieldLabelStyle}>Posición Favorita en Cancha</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['drive', 'reves', 'ambas'] as const).map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: position === pos ? 'var(--team1-primary)' : 'var(--border-subtle)',
                        background: position === pos ? 'rgba(0, 230, 118, 0.15)' : 'var(--bg-elevated)',
                        color: position === pos ? 'var(--team1-primary)' : '#cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={cancelBtnStyle}>
                  Cancelar
                </button>
                <button type="submit" style={saveBtnStyle}>
                  Guardar Jugador
                </button>
              </div>
            </form>
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
  border: '1px solid var(--border-subtle)',
  flexWrap: 'wrap',
  gap: '12px'
};

const addPlayerBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  borderRadius: '12px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.9rem',
  boxShadow: '0 4px 14px var(--team1-glow)'
};

const clearDbBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 61, 113, 0.12)',
  color: 'var(--danger-primary)',
  border: '1px solid rgba(255, 61, 113, 0.3)'
};

const backBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  borderRadius: '12px',
  background: 'var(--bg-elevated)',
  color: 'var(--text-main)',
  fontWeight: 700,
  fontSize: '0.9rem',
  border: '1px solid var(--border-subtle)',
  cursor: 'pointer'
};

const tabsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  overflowX: 'auto'
};

const tabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  borderRadius: '12px',
  border: '1px solid',
  fontWeight: 800,
  fontSize: '0.88rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s'
};

const podiumGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '14px'
};

const podiumCardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '20px',
  border: '2px solid'
};

const podiumAvatar: React.CSSProperties = {
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  border: '2px solid',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-elevated)'
};

const podiumMetricsRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  textAlign: 'center',
  padding: '12px',
  background: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '14px'
};

const emptyDatabaseCard: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 24px',
  borderRadius: '24px',
  border: '1px dashed rgba(255, 255, 255, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const filtersBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)',
  gap: '12px',
  flexWrap: 'wrap'
};

const categoryChipsWrapper: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  overflowX: 'auto'
};

const catChipStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.78rem',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const searchBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)'
};

const searchInputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-main)',
  fontSize: '0.85rem'
};

const tableContainerStyle: React.CSSProperties = {
  borderRadius: '20px',
  overflowX: 'auto',
  border: '1px solid var(--border-subtle)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.88rem'
};

const tableHeaderRowStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderBottom: '1px solid var(--border-subtle)'
};

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: 'var(--text-dim)',
  letterSpacing: '0.06em'
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  transition: 'background 0.15s'
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle'
};

const miniTableAvatar: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-elevated)'
};

const matchCardStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)'
};

const matchTeamsLayout: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  margin: '10px 0'
};

const matchScorePill: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 18px',
  background: 'rgba(0, 0, 0, 0.4)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-subtle)'
};

const setsBreakdownRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '8px'
};

const setMiniBadge: React.CSSProperties = {
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  padding: '2px 8px',
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '6px'
};

const saasGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px'
};

const saasCardStyle: React.CSSProperties = {
  padding: '28px',
  borderRadius: '24px',
  border: '1px solid var(--border-subtle)',
  display: 'flex',
  flexDirection: 'column'
};

const featuresListStyle: React.CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '24px'
};

const featureItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '0.88rem',
  color: '#e2e8f0'
};

const b2cUpgradeBtn: React.CSSProperties = {
  marginTop: 'auto',
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.95rem'
};

const b2bUpgradeBtn: React.CSSProperties = {
  marginTop: 'auto',
  padding: '14px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #ffd600 0%, #ff9100 100%)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.95rem'
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

const addModalCard: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '20px',
  padding: '24px',
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

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-main)',
  marginBottom: '4px'
};

const fieldInputStyle: React.CSSProperties = {
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

const fieldSelectStyle: React.CSSProperties = {
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
  padding: '10px 18px',
  borderRadius: '10px',
  background: 'var(--bg-elevated)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-subtle)',
  fontWeight: 600,
  fontSize: '0.88rem',
  cursor: 'pointer'
};

const saveBtnStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: '10px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.88rem',
  boxShadow: '0 4px 14px var(--team1-glow)'
};
