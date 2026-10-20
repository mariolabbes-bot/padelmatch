import React, { useState, useEffect } from 'react';
import type { PadelGroup, CommunityPlayer } from '../types/padel';
import type { UserSession } from '../services/authService';
import { groupService } from '../services/groupService';
import { themeService, type AppTheme } from '../services/themeService';
import { 
  Users, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Play, 
  ArrowLeft,
  X,
  Sparkles,
  Sun,
  Moon,
  Search
} from 'lucide-react';

interface Props {
  currentUser: UserSession;
  onStartMatchWithPlayers: (players: { name: string; category?: string }[]) => void;
  onBackToDashboard: () => void;
}

export const GroupsView: React.FC<Props> = ({
  currentUser,
  onStartMatchWithPlayers,
  onBackToDashboard
}) => {
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());
  const [groups, setGroups] = useState<PadelGroup[]>(() => groupService.getGroups());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>('grp-cruzados-4ta');
  const [activeTab, setActiveTab] = useState<'my_groups' | 'explore'>('my_groups');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCreateCalloutModalOpen, setIsCreateCalloutModalOpen] = useState(false);

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupClub, setNewGroupClub] = useState('Club Padel Oriente');
  const [newGroupCity, setNewGroupCity] = useState('Santiago');
  const [newGroupCategory, setNewGroupCategory] = useState<'1ra' | '2da' | '3ra' | '4ta' | '5ta' | '6ta' | '7ma' | 'abierta'>('4ta');

  // New Callout Form
  const [calloutClub, setCalloutClub] = useState('Club Padel Oriente');
  const [calloutCourt, setCalloutCourt] = useState('Pista 1 & Pista 2');
  const [calloutDate, setCalloutDate] = useState(new Date().toISOString().split('T')[0]);
  const [calloutTime, setCalloutTime] = useState('19:30');
  const [calloutDeadline, setCalloutDeadline] = useState('Jueves 14:00 hrs');
  const [calloutNotes, setCalloutNotes] = useState('Convocatoria para 2 canchas (8 jugadores en total)');

  useEffect(() => {
    const unsubTheme = themeService.subscribe(setTheme);
    const unsubGroups = groupService.subscribe(() => {
      setGroups([...groupService.getGroups()]);
    });
    return () => {
      unsubTheme();
      unsubGroups();
    };
  }, []);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const created = groupService.createGroup({
      name: newGroupName,
      description: newGroupDesc,
      city: newGroupCity,
      clubPreferred: newGroupClub,
      categoryLevel: newGroupCategory,
      creator: {
        id: currentUser.id,
        name: currentUser.name,
        category: currentUser.category,
        elo: currentUser.elo
      }
    });

    setIsCreateGroupModalOpen(false);
    setSelectedGroupId(created.id);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleCreateCallout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    groupService.createCallout(selectedGroup.id, {
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      clubName: calloutClub,
      courtName: calloutCourt,
      matchDate: calloutDate,
      matchTime: calloutTime,
      deadlineTime: calloutDeadline,
      categoryTarget: selectedGroup.categoryLevel,
      notes: calloutNotes
    });

    setIsCreateCalloutModalOpen(false);
  };

  const handleRespond = (calloutId: string, response: 'accept' | 'reject') => {
    if (!selectedGroup) return;
    groupService.respondCallout(selectedGroup.id, calloutId, currentUser.id, response);
  };

  const handleQuickAddRecommended = (calloutId: string, player: CommunityPlayer) => {
    if (!selectedGroup) return;
    groupService.joinGroup(selectedGroup.id, {
      id: player.id,
      name: player.name,
      category: player.category,
      elo: player.elo
    });
    groupService.respondCallout(selectedGroup.id, calloutId, player.id, 'accept');
  };

  return (
    <div style={containerStyle}>
      {/* Top Header */}
      <header style={topNavStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            onClick={onBackToDashboard}
            style={backBtnStyle}
            title="Volver al Inicio"
            aria-label="Volver al Inicio"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-team1" style={{ fontSize: '0.68rem' }}>Módulo Grupos</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Convocatorias en Cancha</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '2px 0 0', color: 'var(--text-main)' }}>
              Grupos & Convocatorias de Pádel
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Day / Night Theme Switcher */}
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            style={themeBtnStyle}
            title={theme === 'day' ? 'Modo Noche' : 'Modo Día'}
            aria-label="Alternar modo día/noche"
          >
            {theme === 'day' ? <Sun size={15} color="var(--gold-primary)" /> : <Moon size={15} color="var(--team2-primary)" />}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateGroupModalOpen(true)}
            style={primaryMiniBtn}
          >
            <Plus size={16} />
            <span>Crear Grupo</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={contentGridStyle}>
        {/* Left Column: Groups List */}
        <aside style={groupsSidebarStyle} className="glass-panel">
          <div style={tabsRowStyle}>
            <button
              type="button"
              onClick={() => setActiveTab('my_groups')}
              style={{
                ...tabBtnStyle,
                color: activeTab === 'my_groups' ? 'var(--team1-primary)' : 'var(--text-muted)',
                borderBottomColor: activeTab === 'my_groups' ? 'var(--team1-primary)' : 'transparent'
              }}
            >
              Mis Grupos ({groups.filter(g => g.members.some(m => m.playerId === currentUser.id)).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              style={{
                ...tabBtnStyle,
                color: activeTab === 'explore' ? 'var(--team1-primary)' : 'var(--text-muted)',
                borderBottomColor: activeTab === 'explore' ? 'var(--team1-primary)' : 'transparent'
              }}
            >
              Explorar ({groups.length})
            </button>
          </div>

          {/* Search Input */}
          <div style={searchWrapperStyle}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar grupo o club..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          <div style={groupsListScrollStyle}>
            {groups
              .filter(g => {
                const matchesTab = activeTab === 'explore' || g.members.some(m => m.playerId === currentUser.id);
                const matchesSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.clubPreferred.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
              })
              .map(group => {
                const isSelected = selectedGroupId === group.id;
                const activeCalloutsCount = group.callouts.filter(c => c.status === 'open').length;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    style={{
                      ...groupCardItemStyle,
                      borderColor: isSelected ? 'var(--team1-primary)' : 'var(--border-subtle)',
                      background: isSelected ? 'rgba(0, 230, 118, 0.08)' : 'var(--bg-elevated)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={groupAvatarCircle}>{group.avatar || '🎾'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {group.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span>📍 {group.clubPreferred}</span>
                          <span>•</span>
                          <span>{group.members.length} miembros</span>
                        </div>
                      </div>
                    </div>

                    {activeCalloutsCount > 0 && (
                      <span style={activeBadgeStyle}>
                        {activeCalloutsCount} partido{activeCalloutsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </aside>

        {/* Right Column: Active Group Detail & Callouts */}
        {selectedGroup && (
          <main style={groupDetailMainStyle}>
            {/* Group Banner Header */}
            <div style={groupHeaderCardStyle} className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={bigGroupAvatar}>{selectedGroup.avatar || '🎾'}</div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                      {selectedGroup.name}
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 8px', maxWidth: '560px' }}>
                      {selectedGroup.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                        Cat: {selectedGroup.categoryLevel}
                      </span>
                      <span style={infoPillStyle}>
                        <MapPin size={12} /> {selectedGroup.clubPreferred}
                      </span>
                      <span style={infoPillStyle}>
                        <Users size={12} /> {selectedGroup.members.length} Jugadores
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateCalloutModalOpen(true)}
                    style={primaryActionBtnStyle}
                  >
                    <Plus size={16} />
                    <span>Abrir Convocatoria</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CALLOUTS SECTION (Lógica Múltiplos de 4 de Mario Labbé) */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--team1-primary)" />
                  <span>Convocatorias de Partidos Activas</span>
                </h3>
              </div>

              {selectedGroup.callouts.length === 0 ? (
                <div style={emptyCalloutsCard} className="glass-panel">
                  <Clock size={36} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    No hay convocatorias abiertas en este momento
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Abre una invitación con fecha y club para que los integrantes confirmen asistencia.
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateCalloutModalOpen(true)}
                    style={{ ...primaryMiniBtn, marginTop: '14px' }}
                  >
                    <Plus size={14} />
                    <span>Lanzar Convocatoria</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedGroup.callouts.map(callout => {
                    const status = groupService.getCalloutSlotStatus(selectedGroup.id, callout.id);
                    const isAcceptedByMe = callout.acceptedPlayerIds.includes(currentUser.id);
                    const isRejectedByMe = callout.rejectedPlayerIds.includes(currentUser.id);

                    return (
                      <div key={callout.id} style={calloutCardStyle} className="glass-panel">
                        {/* Callout Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--team1-primary)', background: 'rgba(0, 230, 118, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                                CONVOCATORIA OFICIAL
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                Creada por {callout.creatorName}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 2px' }}>
                              {callout.clubName} • {callout.courtName || 'Pista de Pádel'}
                            </h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>📅 {callout.matchDate}</span>
                              <span>⏰ {callout.matchTime} hrs</span>
                              <span>⏳ Límite: {callout.deadlineTime}</span>
                            </div>
                          </div>

                          {/* MULTIPLES OF 4 BADGE BANNER */}
                          <div style={{ textAlign: 'right' }}>
                            {status.isMultipleOfFour ? (
                              <div style={multipleSuccessBadge}>
                                <CheckCircle2 size={16} color="var(--team1-primary)" />
                                <div>
                                  <div style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--team1-primary)' }}>
                                    ¡CANCHAS COMPLETAS!
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {status.completedCourts} partido{status.completedCourts > 1 ? 's' : ''} cerrado{status.completedCourts > 1 ? 's' : ''} ({status.totalAccepted} jugadores)
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={multipleWarningBadge}>
                                <AlertCircle size={16} color="var(--gold-primary)" />
                                <div>
                                  <div style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--gold-primary)' }}>
                                    ¡FALTA {status.slotsNeededToComplete} JUGADOR{status.slotsNeededToComplete > 1 ? 'ES' : ''}!
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {status.totalAccepted} confirmados (para {status.completedCourts + 1} canchas de 4)
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        {callout.notes && (
                          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            💬 {callout.notes}
                          </div>
                        )}

                        {/* Confirmed Players Chips */}
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Jugadores Confirmados ({status.totalAccepted}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {callout.acceptedPlayerIds.map((pId, idx) => {
                              const member = selectedGroup.members.find(m => m.playerId === pId);
                              const isMe = pId === currentUser.id;
                              return (
                                <div key={pId} style={confirmedPlayerChip}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--team1-primary)' }}>
                                    #{idx + 1}
                                  </span>
                                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isMe ? 'var(--team1-primary)' : 'var(--text-main)' }}>
                                    {member?.name || (isMe ? currentUser.name : 'Jugador')}
                                  </span>
                                  {member && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                                      ({member.category})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RECOMMENDED PLAYERS TRIGGER (Lógica inteligente para cerrar la cancha de 4) */}
                        {!status.isMultipleOfFour && status.recommendedPlayers.length > 0 && (
                          <div style={recommendedBoxStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Sparkles size={14} />
                                <span>Jugadores recomendados compatibles para completar la cancha:</span>
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                              {status.recommendedPlayers.map(rec => (
                                <div key={rec.id} style={recPlayerCard}>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                                      {rec.name}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                      Cat {rec.category} • ELO {rec.elo} {rec.dominantHand === 'zurdo' ? '⭐' : ''}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAddRecommended(callout.id, rec)}
                                    style={inviteMiniBtn}
                                    title="Sumar a la convocatoria"
                                  >
                                    <UserPlus size={13} />
                                    <span>Invitar</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Callout Actions Toolbar */}
                        <div style={calloutActionsRow}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleRespond(callout.id, 'accept')}
                              style={{
                                ...rsvpBtnStyle,
                                background: isAcceptedByMe ? 'var(--team1-primary)' : 'rgba(0, 230, 118, 0.15)',
                                color: isAcceptedByMe ? '#070a10' : 'var(--team1-primary)',
                                fontWeight: 800
                              }}
                            >
                              <CheckCircle2 size={16} />
                              <span>{isAcceptedByMe ? '¡Asistiré (Confirmado)!' : 'Aceptar Invitación'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRespond(callout.id, 'reject')}
                              style={{
                                ...rsvpBtnStyle,
                                background: isRejectedByMe ? 'rgba(255, 61, 113, 0.25)' : 'transparent',
                                color: isRejectedByMe ? 'var(--danger-primary)' : 'var(--text-muted)'
                              }}
                            >
                              <X size={16} />
                              <span>No puedo</span>
                            </button>
                          </div>

                          {/* Direct Launch to Court Scoreboard */}
                          {status.totalAccepted >= 4 && (
                            <button
                              type="button"
                              onClick={() => {
                                const confirmedMembers = callout.acceptedPlayerIds.map(id => {
                                  const m = selectedGroup.members.find(x => x.playerId === id);
                                  return { name: m ? m.name : 'Jugador', category: m ? m.category : '4ta' };
                                });
                                onStartMatchWithPlayers(confirmedMembers.slice(0, 4));
                              }}
                              style={launchCourtBtnStyle}
                            >
                              <Play size={15} fill="#070a10" color="#070a10" />
                              <span>Lanzar Marcador en Cancha</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Group Members List */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--gold-primary)" />
                  <span>Miembros del Grupo ({selectedGroup.members.length})</span>
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {selectedGroup.members.map(member => (
                  <div key={member.playerId} style={memberItemCard} className="glass-panel">
                    <div style={memberAvatarCircle}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{member.name}</span>
                        {member.role === 'admin' && (
                          <span style={adminBadge}>ADMIN</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
                        <span>Cat: {member.category}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--gold-primary)' }}>ELO {member.elo}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                      {member.matchesPlayedInGroup} PJ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* MODAL: CREAR NUEVO GRUPO */}
      {isCreateGroupModalOpen && (
        <div style={modalBackdrop}>
          <div style={modalBox} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                Crear Grupo de Pádel
              </h3>
              <button onClick={() => setIsCreateGroupModalOpen(false)} style={iconCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={formLabel}>Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Los Halcones del Pádel (4ta Cat)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  style={formInput}
                />
              </div>

              <div>
                <label style={formLabel}>Descripción y Dinámica</label>
                <textarea
                  placeholder="Ej: Jugamos todos los martes y jueves a las 19:30. Nivel medio/alto, tercer tiempo obligado."
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  style={{ ...formInput, minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={formLabel}>Club Preferido</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Club Padel Oriente"
                    value={newGroupClub}
                    onChange={e => setNewGroupClub(e.target.value)}
                    style={formInput}
                  />
                </div>
                <div>
                  <label style={formLabel}>Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Santiago"
                    value={newGroupCity}
                    onChange={e => setNewGroupCity(e.target.value)}
                    style={formInput}
                  />
                </div>
              </div>

              <div>
                <label style={formLabel}>Nivel de Categoría</label>
                <select
                  value={newGroupCategory}
                  onChange={e => setNewGroupCategory(e.target.value as any)}
                  style={formInput}
                >
                  <option value="1ra">1ª Categoría (Pro)</option>
                  <option value="2da">2ª Categoría</option>
                  <option value="3ra">3ª Categoría</option>
                  <option value="4ta">4ª Categoría (Media)</option>
                  <option value="5ta">5ª Categoría</option>
                  <option value="6ta">6ª Categoría</option>
                  <option value="7ma">7ª Categoría</option>
                  <option value="abierta">Abierta a cualquier nivel</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  style={secondaryBtn}
                >
                  Cancelar
                </button>
                <button type="submit" style={primaryActionBtnStyle}>
                  Crear Grupo e Invitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVA CONVOCATORIA */}
      {isCreateCalloutModalOpen && selectedGroup && (
        <div style={modalBackdrop}>
          <div style={modalBox} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  Abrir Convocatoria en {selectedGroup.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Invita a todos los miembros y cuadra partidos en múltiplos de 4
                </span>
              </div>
              <button onClick={() => setIsCreateCalloutModalOpen(false)} style={iconCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCallout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={formLabel}>Club Sede</label>
                  <input
                    type="text"
                    required
                    value={calloutClub}
                    onChange={e => setCalloutClub(e.target.value)}
                    style={formInput}
                  />
                </div>
                <div>
                  <label style={formLabel}>Pista / Cancha</label>
                  <input
                    type="text"
                    placeholder="Ej: Pista 1 & 2"
                    value={calloutCourt}
                    onChange={e => setCalloutCourt(e.target.value)}
                    style={formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={formLabel}>Fecha del Partido</label>
                  <input
                    type="date"
                    required
                    value={calloutDate}
                    onChange={e => setCalloutDate(e.target.value)}
                    style={formInput}
                  />
                </div>
                <div>
                  <label style={formLabel}>Horario de Inicio</label>
                  <input
                    type="time"
                    required
                    value={calloutTime}
                    onChange={e => setCalloutTime(e.target.value)}
                    style={formInput}
                  />
                </div>
              </div>

              <div>
                <label style={formLabel}>Fecha y Hora Límite de Confirmación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Jueves 14:00 hrs"
                  value={calloutDeadline}
                  onChange={e => setCalloutDeadline(e.target.value)}
                  style={formInput}
                />
              </div>

              <div>
                <label style={formLabel}>Notas o Instrucciones para el Grupo</label>
                <textarea
                  placeholder="Ej: Reservamos 2 canchas, se juega a 3 sets. ¡Confirmen pronto!"
                  value={calloutNotes}
                  onChange={e => setCalloutNotes(e.target.value)}
                  style={{ ...formInput, minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateCalloutModalOpen(false)}
                  style={secondaryBtn}
                >
                  Cancelar
                </button>
                <button type="submit" style={primaryActionBtnStyle}>
                  Publicar Convocatoria
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
  minHeight: '100dvh',
  background: 'var(--bg-deep)',
  color: 'var(--text-main)',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'calc(var(--safe-bottom) + 80px)', // space for bottom nav
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  boxSizing: 'border-box'
};

const topNavStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 18px',
  background: 'var(--bg-glass)',
  borderBottom: '1px solid var(--border-medium)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backdropFilter: 'blur(12px)'
};

const backBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-main)',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const themeBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-full)',
  padding: '7px 10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const primaryMiniBtn: React.CSSProperties = {
  background: 'var(--team1-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 14px',
  fontWeight: 800,
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer'
};

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'clamp(280px, 30vw, 360px) 1fr',
  gap: '16px',
  maxWidth: '1360px',
  margin: '16px auto',
  padding: '0 16px'
};

const groupsSidebarStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  height: 'calc(100vh - 160px)',
  boxSizing: 'border-box'
};

const tabsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  borderBottom: '1px solid var(--border-subtle)'
};

const tabBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '10px 4px',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer',
  textAlign: 'center'
};

const searchWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)'
};

const searchInputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-main)',
  fontSize: '0.82rem',
  width: '100%'
};

const groupsListScrollStyle: React.CSSProperties = {
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1
};

const groupCardItemStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all var(--transition-fast)'
};

const groupAvatarCircle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  flexShrink: 0
};

const activeBadgeStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 900,
  color: 'var(--team1-primary)',
  background: 'rgba(0, 230, 118, 0.15)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  whiteSpace: 'nowrap'
};

const groupDetailMainStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const groupHeaderCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: 'var(--radius-lg)'
};

const bigGroupAvatar: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.8rem',
  flexShrink: 0
};

const infoPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.72rem',
  padding: '3px 8px',
  borderRadius: '12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)'
};

const primaryActionBtnStyle: React.CSSProperties = {
  background: 'var(--team1-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '10px 18px',
  fontWeight: 900,
  fontSize: '0.85rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  boxShadow: '0 4px 15px var(--team1-glow)'
};

const emptyCalloutsCard: React.CSSProperties = {
  padding: '32px 20px',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};

const calloutCardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: 'var(--radius-lg)'
};

const multipleSuccessBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid var(--team1-primary)'
};

const multipleWarningBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid var(--gold-primary)'
};

const confirmedPlayerChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-full)'
};

const recommendedBoxStyle: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px',
  background: 'rgba(255, 214, 0, 0.06)',
  border: '1px dashed rgba(255, 214, 0, 0.35)',
  borderRadius: 'var(--radius-md)'
};

const recPlayerCard: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 10px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)'
};

const inviteMiniBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(255, 214, 0, 0.2)',
  border: '1px solid var(--gold-primary)',
  color: 'var(--gold-primary)',
  fontWeight: 800,
  fontSize: '0.7rem',
  cursor: 'pointer'
};

const calloutActionsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '10px',
  marginTop: '16px',
  paddingTop: '14px',
  borderTop: '1px solid var(--border-subtle)'
};

const rsvpBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)',
  fontSize: '0.82rem',
  cursor: 'pointer'
};

const launchCourtBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.85rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 15px var(--team1-glow)'
};

const memberItemCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)'
};

const memberAvatarCircle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  color: 'var(--team1-primary)',
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.85rem'
};

const adminBadge: React.CSSProperties = {
  fontSize: '0.6rem',
  fontWeight: 900,
  background: 'rgba(255, 214, 0, 0.2)',
  color: 'var(--gold-primary)',
  padding: '1px 5px',
  borderRadius: '4px'
};

const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
  padding: '16px'
};

const modalBox: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border-medium)'
};

const iconCloseBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px'
};

const formLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: '4px'
};

const formInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 16px',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer'
};
