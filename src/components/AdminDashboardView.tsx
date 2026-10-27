import React, { useState, useEffect } from 'react';
import type { 
  AppViewMode, 
  PadelClub, 
  PadelGroup, 
  MatchRecord, 
  UserPlan, 
  PlayerCategory,
  ScheduledMatch
} from '../types/padel';
import { authService, type UserSession, type StoredUserCredential } from '../services/authService';
import { clubService } from '../services/clubService';
import { groupService } from '../services/groupService';
import { communityService } from '../services/communityService';
import { scheduleService } from '../services/scheduleService';
import { referralService, type ReferralRecord } from '../services/referralService';
import { isImageAvatar } from '../utils/imageOptimizer';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Users, 
  Building2, 
  Activity, 
  TrendingUp, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Crown, 
  Sparkles,
  RefreshCw,
  Lock,
  Sliders
} from 'lucide-react';

interface Props {
  currentUser: UserSession | null;
  onBack: () => void;
  onNavigateToView?: (view: AppViewMode) => void;
}

type AdminTab = 'overview' | 'users' | 'clubs' | 'groups' | 'referrals';

export const AdminDashboardView: React.FC<Props> = ({
  currentUser,
  onBack,
  onNavigateToView: _onNavigateToView
}) => {
  // 1. Authorization Verification
  const isAuthorized = authService.isAdmin(currentUser);

  // 2. Tab Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // 3. Data Collections State
  const [users, setUsers] = useState<StoredUserCredential[]>(() => authService.getAllRegisteredUsers());
  const [clubs, setClubs] = useState<PadelClub[]>(() => clubService.getClubs());
  const [groups, setGroups] = useState<PadelGroup[]>(() => groupService.getGroups());
  const [matches, setMatches] = useState<MatchRecord[]>(() => communityService.getMatches());
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>(() => scheduleService.getMatches());
  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => referralService.getAllReferrals());

  // 4. Filters & Searches
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState<'all' | UserPlan>('all');
  const [userCategoryFilter, setUserCategoryFilter] = useState<'all' | PlayerCategory>('all');

  const [clubSearch, setClubSearch] = useState('');
  const [clubCityFilter, setClubCityFilter] = useState('all');

  const [groupSearch, setGroupSearch] = useState('');

  // 5. User Edit Modal State
  const [editingUser, setEditingUser] = useState<StoredUserCredential | null>(null);
  const [editPlan, setEditPlan] = useState<UserPlan>('free');
  const [editCategory, setEditCategory] = useState<PlayerCategory>('4ta');
  const [editCourtesyMatches, setEditCourtesyMatches] = useState<number>(0);
  const [userUpdateMsg, setUserUpdateMsg] = useState<string | null>(null);

  // 6. Club Create Modal State
  const [isAddClubOpen, setIsAddClubOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubCity, setNewClubCity] = useState('La Serena');
  const [newClubCommune, setNewClubCommune] = useState('');
  const [newClubAddress, setNewClubAddress] = useState('');
  const [newClubCourts, setNewClubCourts] = useState<number>(4);
  const [newClubType, setNewClubType] = useState<'outdoor' | 'indoor' | 'mixto'>('outdoor');
  const [newClubInstagram, setNewClubInstagram] = useState('');
  const [newClubVerified, setNewClubVerified] = useState(true);

  // 7. Subscribe to real-time service changes
  useEffect(() => {
    const unsubAuth = authService.subscribe(() => {
      setUsers(authService.getAllRegisteredUsers());
    });
    const unsubClubs = clubService.subscribe(() => {
      setClubs(clubService.getClubs());
    });
    const unsubGroups = groupService.subscribe(() => {
      setGroups(groupService.getGroups());
    });
    const unsubCommunity = communityService.subscribe(() => {
      setMatches(communityService.getMatches());
    });
    const unsubSchedule = scheduleService.subscribe(() => {
      setScheduledMatches(scheduleService.getMatches());
    });
    const unsubReferrals = referralService.subscribe(() => {
      setReferrals(referralService.getAllReferrals());
    });

    return () => {
      unsubAuth();
      unsubClubs();
      unsubGroups();
      unsubCommunity();
      unsubSchedule();
      unsubReferrals();
    };
  }, []);

  // --- ACCESS DENIED GUARD ---
  if (!isAuthorized) {
    return (
      <div style={accessDeniedContainerStyle}>
        <div style={accessDeniedCardStyle} className="glass-panel apple-card">
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 82, 82, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1.5px solid #ff5252' }}>
            <Lock size={32} color="#ff5252" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px' }}>
            Acceso Restringido
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
            Este panel de administración es de uso exclusivo para la dirección y fundadores de PadelMatch. Tu cuenta ({currentUser?.email || 'Invitado'}) no cuenta con autorización.
          </p>
          <button 
            type="button" 
            onClick={onBack} 
            style={actionPrimaryBtn}
          >
            <ArrowLeft size={16} />
            <span>Volver a la Cancha</span>
          </button>
        </div>
      </div>
    );
  }

  // --- KPI CALCULATIONS ---
  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'subscribed' || u.plan === 'pro_founder').length;
  const freeUsers = totalUsers - proUsers;
  const totalCompletedMatches = matches.length;
  const totalScheduledMatches = scheduledMatches.length;
  const totalClubs = clubs.length;
  const verifiedClubs = clubs.filter(c => c.verified).length;
  const totalGroups = groups.length;
  const totalGroupMembers = groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
  const totalReferralsCount = referrals.length;
  const proReferralsCount = referrals.filter(r => r.hasSubscribedPro).length;

  // --- USER FILTERING ---
  const filteredUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    const matchesQuery = !q || (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q))
    );
    const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
    const matchesCategory = userCategoryFilter === 'all' || u.category === userCategoryFilter;
    return matchesQuery && matchesPlan && matchesCategory;
  });

  // --- CLUB FILTERING ---
  const filteredClubs = clubs.filter(c => {
    const q = clubSearch.trim().toLowerCase();
    const matchesQuery = !q || (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.commune && c.commune.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
    const matchesCity = clubCityFilter === 'all' || c.city.toLowerCase() === clubCityFilter.toLowerCase();
    return matchesQuery && matchesCity;
  });

  const availableCities = Array.from(new Set(clubs.map(c => c.city).filter(Boolean)));

  // --- GROUP FILTERING ---
  const filteredGroups = groups.filter(g => {
    const q = groupSearch.trim().toLowerCase();
    const adminMember = g.members?.find(m => m.role === 'admin')?.name || '';
    return !q || (
      g.name.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.clubPreferred?.toLowerCase().includes(q) ||
      adminMember.toLowerCase().includes(q)
    );
  });

  // --- HANDLERS ---
  const handleOpenEditUser = (u: StoredUserCredential) => {
    setEditingUser(u);
    setEditPlan(u.plan || 'free');
    setEditCategory(u.category || '4ta');
    setEditCourtesyMatches(u.hostedMatchesCount || 0);
    setUserUpdateMsg(null);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const success = await authService.adminUpdateUser(editingUser.email, {
      plan: editPlan,
      category: editCategory,
      hostedMatchesCount: editCourtesyMatches
    });

    if (success) {
      setUserUpdateMsg('¡Usuario actualizado exitosamente!');
      setTimeout(() => {
        setEditingUser(null);
        setUserUpdateMsg(null);
      }, 700);
    }
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    clubService.adminAddClub({
      name: newClubName,
      city: newClubCity,
      commune: newClubCommune,
      address: newClubAddress,
      courtsCount: newClubCourts,
      indoorOutdoor: newClubType,
      instagram: newClubInstagram,
      verified: newClubVerified
    });

    setIsAddClubOpen(false);
    setNewClubName('');
    setNewClubCommune('');
    setNewClubAddress('');
    setNewClubInstagram('');
  };

  const handleDeleteClub = (club: PadelClub) => {
    if (window.confirm(`¿Estás seguro de eliminar el club "${club.name}"?`)) {
      clubService.adminDeleteClub(club.id);
    }
  };

  const handleDeleteGroup = (group: PadelGroup) => {
    if (window.confirm(`¿Estás seguro de eliminar el grupo "${group.name}" y todas sus convocatorias?`)) {
      groupService.adminDeleteGroup(group.id);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de partido?')) {
      communityService.adminDeleteMatch(matchId);
    }
  };

  return (
    <div style={containerStyle}>
      {/* 1. TOP ADMIN HEADER */}
      <div style={adminHeaderStyle} className="glass-panel apple-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            onClick={onBack} 
            style={backBtnStyle}
            title="Volver al Dashboard"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={shieldBadgeStyle}>
                <ShieldCheck size={16} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.05em' }}>
                  ADMINISTRADOR
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                • Mario Labbé
              </span>
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Panel de Control Central
            </h1>
          </div>
        </div>

        {/* Global Refresh Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setUsers(authService.getAllRegisteredUsers());
              setClubs(clubService.getClubs());
              setGroups(groupService.getGroups());
              setMatches(communityService.getMatches());
              setScheduledMatches(scheduleService.getMatches());
              setReferrals(referralService.getAllReferrals());
            }}
            style={refreshBtnStyle}
            title="Sincronizar datos ahora"
          >
            <RefreshCw size={14} />
            <span className="mobile-show-desktop" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE METRICS BAR (NIVEL DE ACTIVIDAD GLOBAL) */}
      <div style={metricsBarGrid}>
        <div style={metricCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={metricLabelStyle}>Usuarios</span>
            <Users size={16} color="#00e5ff" />
          </div>
          <div style={metricValueStyle}>{totalUsers}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            <strong style={{ color: 'var(--gold-primary)' }}>{proUsers} PRO</strong> • {freeUsers} Free
          </div>
        </div>

        <div style={metricCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={metricLabelStyle}>Partidos</span>
            <Activity size={16} color="var(--team1-primary)" />
          </div>
          <div style={{ ...metricValueStyle, color: 'var(--team1-primary)' }}>
            {totalCompletedMatches}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            +{totalScheduledMatches} programados
          </div>
        </div>

        <div style={metricCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={metricLabelStyle}>Clubes</span>
            <Building2 size={16} color="var(--gold-primary)" />
          </div>
          <div style={{ ...metricValueStyle, color: 'var(--gold-primary)' }}>{totalClubs}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            {verifiedClubs} oficiales
          </div>
        </div>

        <div style={metricCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={metricLabelStyle}>Grupos</span>
            <Sparkles size={16} color="#d946ef" />
          </div>
          <div style={{ ...metricValueStyle, color: '#d946ef' }}>{totalGroups}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            {totalGroupMembers} miembros
          </div>
        </div>

        <div style={metricCardStyle} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={metricLabelStyle}>Referidos</span>
            <TrendingUp size={16} color="#00e5ff" />
          </div>
          <div style={{ ...metricValueStyle, color: '#00e5ff' }}>{totalReferralsCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            ⭐ {proReferralsCount} a PRO
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div style={tabsBarContainer} className="glass-panel">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'overview' ? 'var(--team1-primary)' : 'var(--text-muted)',
            borderBottomColor: activeTab === 'overview' ? 'var(--team1-primary)' : 'transparent'
          }}
        >
          <Activity size={15} />
          <span>Actividad & Partidos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'users' ? 'var(--team1-primary)' : 'var(--text-muted)',
            borderBottomColor: activeTab === 'users' ? 'var(--team1-primary)' : 'transparent'
          }}
        >
          <Users size={15} />
          <span>Usuarios ({filteredUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clubs')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'clubs' ? 'var(--team1-primary)' : 'var(--text-muted)',
            borderBottomColor: activeTab === 'clubs' ? 'var(--team1-primary)' : 'transparent'
          }}
        >
          <Building2 size={15} />
          <span>Clubes ({filteredClubs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'groups' ? 'var(--team1-primary)' : 'var(--text-muted)',
            borderBottomColor: activeTab === 'groups' ? 'var(--team1-primary)' : 'transparent'
          }}
        >
          <Sparkles size={15} />
          <span>Grupos ({filteredGroups.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'referrals' ? 'var(--team1-primary)' : 'var(--text-muted)',
            borderBottomColor: activeTab === 'referrals' ? 'var(--team1-primary)' : 'transparent'
          }}
        >
          <TrendingUp size={15} />
          <span>Red Referidos</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB: OVERVIEW & ACTIVITY */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Recent Match Feed */}
          <div style={panelCardStyle} className="glass-panel apple-card">
            <div style={panelHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Últimos Partidos Jugados ({matches.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Registro de partidos completados en cancha con arbitraje por voz.
                </p>
              </div>
            </div>

            {matches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {matches.slice(0, 10).map((m, idx) => {
                  const dateStr = new Date(m.date).toLocaleDateString('es-CL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const t1Players = m.team1.playerNames ? m.team1.playerNames.join(' & ') : m.team1.name;
                  const t2Players = m.team2.playerNames ? m.team2.playerNames.join(' & ') : m.team2.name;

                  return (
                    <div key={m.id || idx} style={matchAuditItemStyle}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            📅 {dateStr}
                          </span>
                          <span style={clubPillStyle}>
                            🏟️ {m.courtName || 'Cancha Central'}
                          </span>
                          {m.status && (
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                              {m.status === 'completed' ? 'Finalizado' : m.status}
                            </span>
                          )}
                        </div>

                        {/* Teams & Score */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: m.winner === 'team1' ? 900 : 600, color: m.winner === 'team1' ? 'var(--team1-primary)' : 'var(--text-main)', fontSize: '0.85rem' }}>
                            {t1Players}
                            {m.winner === 'team1' && ' 🏆'}
                          </div>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>vs</span>
                          <div style={{ fontWeight: m.winner === 'team2' ? 900 : 600, color: m.winner === 'team2' ? 'var(--team2-primary)' : 'var(--text-main)', fontSize: '0.85rem' }}>
                            {t2Players}
                            {m.winner === 'team2' && ' 🏆'}
                          </div>
                        </div>

                        {/* Set Scores */}
                        {m.sets && m.sets.length > 0 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                            {m.sets.map((s, sIdx) => (
                              <span key={sIdx} style={{ marginRight: '8px' }}>
                                Set {sIdx + 1}: {s.team1}-{s.team2}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Admin Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(m.id)}
                        style={deleteSmallBtnStyle}
                        title="Eliminar registro"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay partidos finalizados registrados en la base de datos aún.
              </div>
            )}
          </div>

          {/* Scheduled Matches Feed */}
          <div style={panelCardStyle} className="glass-panel apple-card">
            <div style={panelHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Convocatorias & Partidos Programados ({scheduledMatches.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Partidos coordinados con invitaciones por WhatsApp.
                </p>
              </div>
            </div>

            {scheduledMatches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scheduledMatches.slice(0, 8).map((sm: ScheduledMatch) => (
                  <div key={sm.id} style={scheduledAuditItemStyle}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {sm.creatorName}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: sm.status === 'confirmed' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 214, 0, 0.15)',
                          color: sm.status === 'confirmed' ? 'var(--team1-primary)' : 'var(--gold-primary)'
                        }}>
                          {sm.status === 'confirmed' ? 'Confirmado' : 'Abierto (Buscando Jugadores)'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📅 {sm.matchDate} a las {sm.matchTime} hrs • 🏟️ {sm.clubName}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--team1-primary)' }}>
                      {sm.slots.filter(s => s.status === 'confirmed').length}/4 cupos
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No hay partidos programados pendientes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={panelCardStyle} className="glass-panel apple-card">
          <div style={panelHeaderStyle}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Directorio de Usuarios ({filteredUsers.length} de {users.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Visualiza, busca y asigna membresías PRO o modifica categorías.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={filterBarContainer}>
            <div style={searchInputWrapper}>
              <Search size={15} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, teléfono o ciudad..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={userPlanFilter}
                onChange={e => setUserPlanFilter(e.target.value as any)}
                style={filterSelectStyle}
              >
                <option value="all">Todos los Planes</option>
                <option value="free">Solo Free</option>
                <option value="subscribed">Solo Subscribed (PRO)</option>
                <option value="pro_founder">Solo Pro Founder</option>
              </select>

              <select
                value={userCategoryFilter}
                onChange={e => setUserCategoryFilter(e.target.value as any)}
                style={filterSelectStyle}
              >
                <option value="all">Todas las Categorías</option>
                <option value="1ra">1ra Cat</option>
                <option value="2da">2da Cat</option>
                <option value="3ra">3ra Cat</option>
                <option value="4ta">4ta Cat</option>
                <option value="5ta">5ta Cat</option>
                <option value="6ta">6ta Cat</option>
                <option value="7ma">7ma Cat</option>
                <option value="Iniciación">Iniciación</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredUsers.map(u => {
              const isPro = u.plan === 'subscribed' || u.plan === 'pro_founder';
              return (
                <div key={u.email} style={userItemCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={userAvatarMini}>
                      {u.avatar ? (
                        isImageAvatar(u.avatar) ? (
                          <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{u.avatar}</span>
                        )
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {u.name}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isPro ? 'rgba(255, 214, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isPro ? 'var(--gold-primary)' : 'var(--text-muted)',
                          border: `1px solid ${isPro ? 'rgba(255, 214, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                        }}>
                          {u.plan ? u.plan.toUpperCase() : 'FREE'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--team1-primary)', fontWeight: 700 }}>
                          {u.category} Cat
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span>✉️ {u.email}</span>
                        {u.phone && <span>📞 {u.phone}</span>}
                        {u.city && <span>📍 {u.city}</span>}
                        {u.invitedBy && (
                          <span style={{ color: '#00e5ff' }}>
                            👥 Invitado por {u.invitedBy.userName || u.invitedBy.userId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(u)}
                      style={editUserBtnStyle}
                      title="Gestionar Membresía y Categoría"
                    >
                      <Sliders size={13} />
                      <span>Gestionar</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No se encontraron usuarios con esos criterios de búsqueda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CLUBS MANAGEMENT */}
      {activeTab === 'clubs' && (
        <div style={panelCardStyle} className="glass-panel apple-card">
          <div style={panelHeaderStyle}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Clubes & Canchas ({filteredClubs.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Catálogo de recintos deportivos habilitados en la plataforma.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddClubOpen(true)}
              style={actionPrimaryBtn}
            >
              <Plus size={15} />
              <span>+ Nuevo Club</span>
            </button>
          </div>

          {/* Filter */}
          <div style={filterBarContainer}>
            <div style={searchInputWrapper}>
              <Search size={15} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Buscar club por nombre o dirección..."
                value={clubSearch}
                onChange={e => setClubSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>
            <select
              value={clubCityFilter}
              onChange={e => setClubCityFilter(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">Todas las Ciudades</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Clubs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {filteredClubs.map(c => (
              <div key={c.id} style={clubCardStyle} className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      📍 {c.city} {c.commune ? `• ${c.commune}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => clubService.adminToggleVerifyClub(c.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title={c.verified ? 'Club Verificado Oficial (Clic para desverificar)' : 'Club Comunitario (Clic para verificar)'}
                  >
                    {c.verified ? (
                      <CheckCircle size={18} color="var(--team1-primary)" />
                    ) : (
                      <XCircle size={18} color="var(--text-muted)" />
                    )}
                  </button>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {c.courtsCount || 4} canchas • {c.indoorOutdoor} • {c.instagram || 'Sin Instagram'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', color: c.verified ? 'var(--team1-primary)' : 'var(--text-dim)', fontWeight: 800 }}>
                    {c.verified ? 'OFICIAL VERIFICADO' : 'COMUNITARIO'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteClub(c)}
                    style={deleteSmallBtnStyle}
                    title="Eliminar club"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: GROUPS MANAGEMENT */}
      {activeTab === 'groups' && (
        <div style={panelCardStyle} className="glass-panel apple-card">
          <div style={panelHeaderStyle}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Grupos de Pádel ({filteredGroups.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Comunidades y chats de convocatoria creados por los jugadores.
              </p>
            </div>
          </div>

          <div style={filterBarContainer}>
            <div style={searchInputWrapper}>
              <Search size={15} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Buscar grupo por nombre o creador..."
                value={groupSearch}
                onChange={e => setGroupSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredGroups.map(g => {
              const adminMember = g.members?.find(m => m.role === 'admin')?.name || 'Administrador';
              return (
                <div key={g.id} style={groupItemCardStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {g.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                        👥 {g.members?.length || 0} miembros
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Admin: <strong style={{ color: 'var(--text-main)' }}>{adminMember}</strong> {g.clubPreferred ? `• 🏟️ ${g.clubPreferred}` : ''}
                    </div>
                    {g.callouts && g.callouts.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', marginTop: '4px' }}>
                        🎾 {g.callouts.length} convocatorias activas
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(g)}
                    style={deleteSmallBtnStyle}
                    title="Eliminar grupo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No se encontraron grupos con ese término.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: REFERRALS AUDIT */}
      {activeTab === 'referrals' && (
        <div style={panelCardStyle} className="glass-panel apple-card">
          <div style={panelHeaderStyle}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Auditoría de Invitaciones & Referidos ({referrals.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Rastreo del crecimiento orgánico por invitaciones de WhatsApp.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {referrals.map(r => (
              <div key={r.id} style={referralItemStyle}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                      {r.referredUserName}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: r.hasSubscribedPro ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: r.hasSubscribedPro ? 'var(--team1-primary)' : 'var(--text-muted)'
                    }}>
                      {r.hasSubscribedPro ? '⭐ CONVERTIDO A PRO' : 'Plan Free'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Invitado por: <strong style={{ color: 'var(--gold-primary)' }}>{r.inviterName}</strong> ({r.source})
                    • Registrado el {new Date(r.registeredAt).toLocaleDateString('es-CL')}
                  </div>
                </div>
              </div>
            ))}

            {referrals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Aún no hay invitaciones de WhatsApp registradas en la base de datos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. USER EDIT MODAL */}
      {editingUser && (
        <div style={modalOverlayStyle} onClick={() => setEditingUser(null)}>
          <div style={modalCardStyle} className="glass-panel apple-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} color="var(--gold-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Gestionar Usuario: {editingUser.name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingUser(null)} 
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={modalLabelStyle}>Email de Cuenta</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{editingUser.email}</div>
              </div>

              <div>
                <label style={modalLabelStyle}>Plan / Membresía de Acceso</label>
                <select
                  value={editPlan}
                  onChange={e => setEditPlan(e.target.value as UserPlan)}
                  style={modalSelectStyle}
                >
                  <option value="free">Free (3 Partidos de Cortesía)</option>
                  <option value="subscribed">Subscribed / Plan PRO (Temporada)</option>
                  <option value="pro_founder">Pro Founder (Vitalicio / Embajador)</option>
                  <option value="captain">Capitán de Equipo</option>
                  <option value="club">Administrador de Club</option>
                </select>
              </div>

              <div>
                <label style={modalLabelStyle}>Categoría Competitiva</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value as PlayerCategory)}
                  style={modalSelectStyle}
                >
                  <option value="1ra">1ra Categoría (Profesional / Alta)</option>
                  <option value="2da">2da Categoría</option>
                  <option value="3ra">3ra Categoría</option>
                  <option value="4ta">4ta Categoría (Intermedia)</option>
                  <option value="5ta">5ta Categoría</option>
                  <option value="6ta">6ta Categoría</option>
                  <option value="7ma">7ma Categoría</option>
                  <option value="Iniciación">Iniciación / Principiante</option>
                </select>
              </div>

              <div>
                <label style={modalLabelStyle}>Partidos Organizados como Anfitrión</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={editCourtesyMatches}
                  onChange={e => setEditCourtesyMatches(parseInt(e.target.value) || 0)}
                  style={modalInputStyle}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  Si el plan es Free, se agota al alcanzar 3 partidos organizados.
                </span>
              </div>

              {userUpdateMsg && (
                <div style={{ padding: '8px 12px', background: 'rgba(0, 230, 118, 0.15)', color: 'var(--team1-primary)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center' }}>
                  {userUpdateMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={modalCancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={modalSaveBtn}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD CLUB MODAL */}
      {isAddClubOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsAddClubOpen(false)}>
          <div style={modalCardStyle} className="glass-panel apple-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--gold-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Agregar Nuevo Club Oficial
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddClubOpen(false)} 
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClub} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={modalLabelStyle}>Nombre del Club *</label>
                <input
                  type="text"
                  placeholder="Ej: Pádel Center La Serena"
                  value={newClubName}
                  onChange={e => setNewClubName(e.target.value)}
                  required
                  style={modalInputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={modalLabelStyle}>Ciudad</label>
                  <input
                    type="text"
                    placeholder="La Serena"
                    value={newClubCity}
                    onChange={e => setNewClubCity(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={modalLabelStyle}>Comuna / Sector</label>
                  <input
                    type="text"
                    placeholder="San Joaquín"
                    value={newClubCommune}
                    onChange={e => setNewClubCommune(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={modalLabelStyle}>Dirección</label>
                <input
                  type="text"
                  placeholder="Av. Guillermo Ulriksen 1234"
                  value={newClubAddress}
                  onChange={e => setNewClubAddress(e.target.value)}
                  style={modalInputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={modalLabelStyle}>Nº de Canchas</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newClubCourts}
                    onChange={e => setNewClubCourts(parseInt(e.target.value) || 4)}
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={modalLabelStyle}>Tipo de Cancha</label>
                  <select
                    value={newClubType}
                    onChange={e => setNewClubType(e.target.value as any)}
                    style={modalSelectStyle}
                  >
                    <option value="outdoor">Outdoor (Al aire libre)</option>
                    <option value="indoor">Indoor (Techadas)</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={modalLabelStyle}>Instagram Oficial</label>
                <input
                  type="text"
                  placeholder="@clubpadel"
                  value={newClubInstagram}
                  onChange={e => setNewClubInstagram(e.target.value)}
                  style={modalInputStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="clubVerifiedCheck"
                  checked={newClubVerified}
                  onChange={e => setNewClubVerified(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="clubVerifiedCheck" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 700 }}>
                  Marcar como Club Oficial Verificado
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddClubOpen(false)}
                  style={modalCancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={modalSaveBtn}
                >
                  Registrar Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---

const containerStyle: React.CSSProperties = {
  maxWidth: '980px',
  margin: '0 auto',
  padding: '16px 12px 90px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
};

const adminHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '16px'
};

const backBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const shieldBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '2px 8px',
  borderRadius: '6px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)'
};

const refreshBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  cursor: 'pointer'
};

const metricsBarGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '10px'
};

const metricCardStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-subtle)'
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
  letterSpacing: '0.04em'
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '1.45rem',
  fontWeight: 900,
  color: 'var(--text-main)',
  fontFamily: 'var(--font-mono)'
};

const tabsBarContainer: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  padding: '4px',
  borderRadius: '12px',
  overflowX: 'auto'
};

const tabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'none',
  border: 'none',
  borderBottom: '2.5px solid transparent',
  fontSize: '0.82rem',
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const panelCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-subtle)'
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '14px',
  flexWrap: 'wrap',
  gap: '10px'
};

const filterBarContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '14px',
  flexWrap: 'wrap'
};

const searchInputWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  borderRadius: '10px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  flex: 1,
  minWidth: '220px'
};

const searchInputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  outline: 'none',
  color: 'var(--text-main)',
  fontSize: '0.82rem',
  width: '100%'
};

const filterSelectStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '8px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
  outline: 'none'
};

const userItemCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '12px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-subtle)',
  gap: '12px',
  flexWrap: 'wrap'
};

const userAvatarMini: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  fontWeight: 800,
  overflow: 'hidden',
  flexShrink: 0
};

const editUserBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  color: 'var(--gold-primary)',
  fontSize: '0.75rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const clubCardStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-subtle)'
};

const groupItemCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-subtle)',
  gap: '12px'
};

const referralItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-subtle)'
};

const matchAuditItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-subtle)',
  gap: '12px'
};

const scheduledAuditItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-subtle)'
};

const clubPillStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: '4px',
  background: 'rgba(0, 229, 255, 0.1)',
  color: '#00e5ff'
};

const deleteSmallBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  background: 'rgba(255, 82, 82, 0.1)',
  border: '1px solid rgba(255, 82, 82, 0.25)',
  color: '#ff5252',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const actionPrimaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, var(--gold-primary), #ffb300)',
  border: 'none',
  color: '#000',
  fontSize: '0.8rem',
  fontWeight: 900,
  cursor: 'pointer'
};

const accessDeniedContainerStyle: React.CSSProperties = {
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const accessDeniedCardStyle: React.CSSProperties = {
  maxWidth: '440px',
  padding: '32px 24px',
  textAlign: 'center',
  borderRadius: '20px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-subtle)'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '16px'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  padding: '20px',
  borderRadius: '16px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-medium)',
  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '1.2rem',
  cursor: 'pointer'
};

const modalLabelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--text-muted)',
  marginBottom: '4px',
  display: 'block'
};

const modalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const modalSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const modalCancelBtn: React.CSSProperties = {
  flex: 1,
  padding: '9px',
  borderRadius: '8px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-subtle)',
  color: 'var(--text-main)',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer'
};

const modalSaveBtn: React.CSSProperties = {
  flex: 1,
  padding: '9px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, var(--gold-primary), #ffb300)',
  border: 'none',
  color: '#000',
  fontWeight: 900,
  fontSize: '0.82rem',
  cursor: 'pointer'
};
