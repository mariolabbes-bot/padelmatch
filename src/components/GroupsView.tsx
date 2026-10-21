import React, { useState, useEffect } from 'react';
import type { PadelGroup, CommunityPlayer } from '../types/padel';
import type { UserSession } from '../services/authService';
import { groupService } from '../services/groupService';
import { partnerService } from '../services/partnerService';
import { communityService } from '../services/communityService';
import { themeService, type AppTheme } from '../services/themeService';
import { QRCodeSVG } from 'qrcode.react';
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
  Search,
  MessageCircle,
  Copy,
  Check,
  Share2
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState<'whatsapp' | 'in_app'>('whatsapp');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inAppInvitedIds, setInAppInvitedIds] = useState<Set<string>>(new Set());

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupClub, setNewGroupClub] = useState('Club Padel Oriente');
  const [newGroupCity, setNewGroupCity] = useState('Santiago');
  const [newGroupCategory, setNewGroupCategory] = useState<'1ra' | '2da' | '3ra' | '4ta' | '5ta' | '6ta' | '7ma' | 'abierta'>('4ta');
  const [selectedInitialMembers, setSelectedInitialMembers] = useState<CommunityPlayer[]>([]);
  const [initialMemberSearch, setInitialMemberSearch] = useState('');

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

  // Partners & Community Lists
  const partners = partnerService.getPartners(currentUser);
  const allCommunity = communityService.getPlayers().filter(
    p => p.id !== currentUser.id && p.name.toLowerCase() !== currentUser.name.toLowerCase()
  );

  const availableInitialPlayers = [
    ...partners,
    ...allCommunity.filter(cp => !partners.some(p => p.id === cp.id))
  ].filter(p => {
    if (!initialMemberSearch.trim()) return true;
    const q = initialMemberSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
      (p.club && p.club.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q);
  });

  const filteredInAppPlayers = [
    ...partners,
    ...allCommunity.filter(cp => !partners.some(p => p.id === cp.id))
  ].filter(p => {
    if (!inviteSearchQuery.trim()) return true;
    const q = inviteSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
      (p.club && p.club.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q);
  });

  const toggleInitialMember = (player: CommunityPlayer) => {
    setSelectedInitialMembers(prev => {
      const exists = prev.some(p => p.id === player.id);
      if (exists) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#join-group=${selectedGroup?.id || ''}`
    : `https://padelmatch.web.app/#join-group=${selectedGroup?.id || ''}`;

  const whatsappText = selectedGroup 
    ? groupService.getWhatsAppInviteText(selectedGroup, currentUser.name, inviteUrl)
    : '';

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
      },
      initialMembers: selectedInitialMembers
    });

    setIsCreateGroupModalOpen(false);
    setSelectedGroupId(created.id);
    setSelectedInitialMembers([]);
    setInitialMemberSearch('');
    setNewGroupName('');
    setNewGroupDesc('');

    // Open invite modal to share via WhatsApp or invite more
    setIsInviteModalOpen(true);
    setInviteTab('whatsapp');
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

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(true);
                      setInviteTab('whatsapp');
                    }}
                    style={inviteHeaderBtnStyle}
                  >
                    <UserPlus size={16} />
                    <span>Invitar Jugadores</span>
                  </button>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Users size={18} color="var(--gold-primary)" />
                  <span>Miembros del Grupo ({selectedGroup.members.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(true);
                    setInviteTab('in_app');
                  }}
                  style={inviteMembersSmallBtnStyle}
                >
                  <UserPlus size={14} />
                  <span>+ Invitar Miembros</span>
                </button>
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

              {/* Miembros Iniciales (Partners & Comunidad) */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...formLabel, margin: 0 }}>
                    Invitar Miembros Iniciales ({selectedInitialMembers.length} seleccionados)
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                    {selectedInitialMembers.length > 0 ? `${selectedInitialMembers.length} añadido${selectedInitialMembers.length > 1 ? 's' : ''}` : 'Opcional'}
                  </span>
                </div>

                <div style={searchWrapperStyle}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar partners o jugadores por nombre, club..."
                    value={initialMemberSearch}
                    onChange={e => setInitialMemberSearch(e.target.value)}
                    style={searchInputStyle}
                  />
                </div>

                {/* Available players list */}
                <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingRight: '4px' }}>
                  {availableInitialPlayers.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                      No se encontraron jugadores disponibles.
                    </div>
                  ) : (
                    availableInitialPlayers.map(player => {
                      const isSelected = selectedInitialMembers.some(p => p.id === player.id);
                      const isPartner = partners.some(p => p.id === player.id);
                      return (
                        <div
                          key={player.id}
                          onClick={() => toggleInitialMember(player)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(0, 230, 118, 0.12)' : 'var(--bg-elevated)',
                            border: isSelected ? '1px solid var(--team1-primary)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isSelected ? 'var(--team1-primary)' : 'var(--bg-card)',
                              color: isSelected ? '#070a10' : 'var(--text-main)',
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              flexShrink: 0
                            }}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {player.name}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span>Cat: {player.category}</span>
                                <span>•</span>
                                <span style={{ color: 'var(--gold-primary)' }}>ELO {player.elo}</span>
                                {isPartner && (
                                  <>
                                    <span>•</span>
                                    <span style={{ color: 'var(--team2-primary)', fontWeight: 700 }}>Partner</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'var(--team1-primary)' : 'transparent',
                            color: isSelected ? '#070a10' : 'var(--text-muted)',
                            border: isSelected ? 'none' : '1px solid var(--border-subtle)'
                          }}>
                            {isSelected ? '✓ Añadido' : '+ Sumar'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(37, 211, 102, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(37, 211, 102, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={15} color="#25D366" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: '#25D366' }}>Invitación WhatsApp externa:</strong> Al crear el grupo se abrirá de inmediato el mensaje listo con el pitch de PadelMatch para enviar por WhatsApp a jugadores externos.
                  </span>
                </div>
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

      {/* MODAL: INVITAR JUGADORES (WHATSAPP + IN-APP DIRECTO) */}
      {isInviteModalOpen && selectedGroup && (
        <div style={modalBackdrop}>
          <div style={{ ...modalBox, maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }} className="glass-panel">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  {selectedGroup.avatar || '🎾'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Invitar Jugadores al Grupo
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--team1-primary)' }}>{selectedGroup.name}</span>
                    <span>•</span>
                    <span>{selectedGroup.members.length} miembros actuales</span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsInviteModalOpen(false)} 
                style={iconCloseBtn}
                title="Cerrar modal"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Tab Switcher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setInviteTab('whatsapp')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: inviteTab === 'whatsapp' ? '#25D366' : 'transparent',
                  color: inviteTab === 'whatsapp' ? '#070a10' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageCircle size={15} />
                <span>Por WhatsApp (Externos)</span>
              </button>

              <button
                type="button"
                onClick={() => setInviteTab('in_app')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: inviteTab === 'in_app' ? 'var(--team1-primary)' : 'transparent',
                  color: inviteTab === 'in_app' ? '#070a10' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Users size={15} />
                <span>In-App (PadelMatch)</span>
              </button>
            </div>

            {/* TAB CONTENT: WHATSAPP (EXTERNAL PLAYERS) */}
            {inviteTab === 'whatsapp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Envía una invitación directa a amigos o grupos de WhatsApp para que conozcan las ventajas de operar en el ecosistema PadelMatch, se registren gratis y se unan al grupo automáticamente:
                </div>

                {/* WhatsApp Message Preview Box */}
                <div style={{
                  background: 'rgba(37, 211, 102, 0.06)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#25D366', fontWeight: 800, fontSize: '0.78rem' }}>
                    <MessageCircle size={14} />
                    <span>Vista Previa del Mensaje Oficial de WhatsApp:</span>
                  </div>
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                    maxHeight: '190px',
                    overflowY: 'auto'
                  }}>
                    {whatsappText}
                  </pre>
                </div>

                {/* Big WhatsApp Send Button */}
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
                    window.open(url, '_blank');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#25D366',
                    color: '#070a10',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 18px',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Enviar Invitación por WhatsApp</span>
                </button>

                {/* Quick Copy Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(whatsappText);
                        setInviteCopied(true);
                        setTimeout(() => setInviteCopied(false), 2500);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 12px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: inviteCopied ? 'var(--team1-primary)' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {inviteCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{inviteCopied ? '¡Mensaje Copiado!' : 'Copiar Texto Completo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(inviteUrl);
                        setInviteLinkCopied(true);
                        setTimeout(() => setInviteLinkCopied(false), 2500);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 12px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: inviteLinkCopied ? 'var(--team1-primary)' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {inviteLinkCopied ? <Check size={14} /> : <Share2 size={14} />}
                    <span>{inviteLinkCopied ? '¡Enlace Copiado!' : 'Copiar Solo Enlace'}</span>
                  </button>
                </div>

                {/* QR Code Section for Court / Presential Joining */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{
                    padding: '8px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <QRCodeSVG value={inviteUrl} size={90} level="M" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      Código QR para Escaneo en Cancha o Club
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      Quien esté junto a ti puede escanear este código QR directamente desde su móvil para activar su cuenta y entrar al grupo al instante.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IN-APP DIRECT INVITATIONS */}
            {inviteTab === 'in_app' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Invita a tus Partners de PadelMatch o busca jugadores registrados en la comunidad. Recibirán una notificación inmediata en su feed:
                </div>

                <div style={searchWrapperStyle}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, club o categoría..."
                    value={inviteSearchQuery}
                    onChange={e => setInviteSearchQuery(e.target.value)}
                    style={searchInputStyle}
                  />
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {filteredInAppPlayers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No se encontraron jugadores que coincidan con la búsqueda.
                    </div>
                  ) : (
                    filteredInAppPlayers.map(player => {
                      const isAlreadyMember = selectedGroup.members.some(m => m.playerId === player.id);
                      const isJustInvited = inAppInvitedIds.has(player.id);
                      const isPartner = partners.some(p => p.id === player.id);

                      return (
                        <div
                          key={player.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: isJustInvited ? 'rgba(0, 230, 118, 0.12)' : 'var(--bg-elevated)',
                            border: isJustInvited ? '1px solid var(--team1-primary)' : '1px solid var(--border-subtle)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--team1-primary)',
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
                                {isPartner && (
                                  <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(0, 176, 255, 0.15)', color: 'var(--team2-primary)', padding: '1px 5px', borderRadius: '3px' }}>
                                    PARTNER
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span>Cat: {player.category}</span>
                                <span>•</span>
                                <span style={{ color: 'var(--gold-primary)' }}>ELO {player.elo}</span>
                                {player.club && (
                                  <>
                                    <span>•</span>
                                    <span>{player.club}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isAlreadyMember || isJustInvited ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--team1-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={13} />
                                <span>{isJustInvited ? '¡Invitado!' : 'Ya es Miembro'}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = groupService.inviteMember(selectedGroup.id, player, currentUser.name);
                                  if (res.success) {
                                    setInAppInvitedIds(prev => new Set(prev).add(player.id));
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'var(--team1-gradient)',
                                  color: '#070a10',
                                  border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '6px 12px',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <UserPlus size={13} />
                                <span>Invitar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const inviteHeaderBtnStyle: React.CSSProperties = {
  background: 'rgba(0, 176, 255, 0.15)',
  border: '1px solid var(--team2-primary)',
  color: 'var(--team2-primary)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 16px',
  fontWeight: 800,
  fontSize: '0.85rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const inviteMembersSmallBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  color: 'var(--team1-primary)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 12px',
  fontWeight: 800,
  fontSize: '0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer'
};
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
