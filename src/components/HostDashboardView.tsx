import React, { useState, useEffect } from 'react';
import type { MatchRules, CommunityPlayer, PadelGroup, PartnerPost, ClubCampaign, PadelNewsItem, PartnerConnection } from '../types/padel';
import { authService, type UserSession } from '../services/authService';
import { communityService } from '../services/communityService';
import { notificationService } from '../services/notificationService';
import { themeService, type AppTheme } from '../services/themeService';
import { partnerService } from '../services/partnerService';
import { groupService } from '../services/groupService';
import { getEloTier } from '../engine/eloEngine';
import { isImageAvatar } from '../utils/imageOptimizer';
import { scheduleService } from '../services/scheduleService';
import { ScheduleMatchModal } from './ScheduleMatchModal';
import { ScheduledMatchDetailModal } from './ScheduledMatchDetailModal';
import { InviteExternalPartnerModal } from './InviteExternalPartnerModal';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { PartnerChatModal } from './PartnerChatModal';
import { MobilePlayerMenuDrawer } from './MobilePlayerMenuDrawer';
import { directChatService } from '../services/directChatService';
import type { ScheduledMatch } from '../types/padel';
import { 
  Trophy, 
  ChevronRight, 
  Flame,
  Bell,
  Users,
  UserPlus,
  MessageSquare,
  Send,
  Check,
  X,
  Play,
  Sparkles,
  Search,
  ExternalLink,
  TrendingUp,
  User,
  Calendar,
  Plus,
  Share2,
  Trash2
} from 'lucide-react';

interface Props {
  user: UserSession;
  rules: MatchRules;
  onUpdateRules: (newRules: MatchRules) => void;
  onProceedToLobby: () => void;
  onOpenCommunity: () => void;
  onOpenBluetoothModal: () => void;
  onOpenNotifications?: () => void;
  onOpenSubscriptionModal?: () => void;
  onNavigateToGroups?: () => void;
  onStartMatch?: () => void;
  onLaunchScheduledMatch?: (match: ScheduledMatch) => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export const HostDashboardView: React.FC<Props> = ({
  user,
  onOpenCommunity,
  onOpenBluetoothModal,
  onOpenNotifications,
  onOpenSubscriptionModal,
  onNavigateToGroups,
  onStartMatch,
  onLaunchScheduledMatch,
  onOpenProfile,
  onOpenAdmin,
  onLogout
}) => {
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());
  const [unreadNotifs, setUnreadNotifs] = useState(() => notificationService.getUnreadCount());

  // Social & Dynamic Content States
  const [partners, setPartners] = useState<CommunityPlayer[]>(() => partnerService.getPartners(user));
  const [pendingRequests, setPendingRequests] = useState<PartnerConnection[]>(() => partnerService.getPendingRequests(user));
  const [feedPosts, setFeedPosts] = useState<PartnerPost[]>(() => partnerService.getFeedPosts());
  const [clubCampaigns] = useState<ClubCampaign[]>(() => partnerService.getClubCampaigns());
  const [padelNews] = useState<PadelNewsItem[]>(() => partnerService.getPadelNews());
  const [groups, setGroups] = useState<PadelGroup[]>(() => groupService.getGroups());
  const [scheduledData, setScheduledData] = useState(() => scheduleService.getMatchesForUser(user));
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<ScheduledMatch | null>(null);

  // Post Composer State
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);

  // Partner Search Modal State
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityPlayer[]>([]);
  const [partnerFeedbackMsg, setPartnerFeedbackMsg] = useState<string | null>(null);

  // External Partner WhatsApp Invite State
  const [isInviteExternalOpen, setIsInviteExternalOpen] = useState(false);
  const [inviteFriendName, setInviteFriendName] = useState('');

  // 1-to-1 Direct Chat & Privacy States
  const [selectedChatPartner, setSelectedChatPartner] = useState<CommunityPlayer | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [totalUnreadChat, setTotalUnreadChat] = useState(() => directChatService.getTotalUnreadCount(user.id));
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  useEffect(() => {
    return themeService.subscribe(setTheme);
  }, []);

  useEffect(() => {
    const unsubNotifs = notificationService.subscribe(() => {
      setUnreadNotifs(notificationService.getUnreadCount());
    });
    const unsubPartners = partnerService.subscribe(() => {
      setPartners(partnerService.getPartners(user));
      setPendingRequests(partnerService.getPendingRequests(user));
      setFeedPosts(partnerService.getFeedPosts());
    });
    const unsubGroups = groupService.subscribe(() => {
      setGroups(groupService.getGroups());
    });
    const unsubSchedule = scheduleService.subscribe(() => {
      setScheduledData(scheduleService.getMatchesForUser(user));
    });
    const unsubChat = directChatService.subscribe(() => {
      setTotalUnreadChat(directChatService.getTotalUnreadCount(user.id));
    });

    return () => {
      unsubNotifs();
      unsubPartners();
      unsubGroups();
      unsubSchedule();
      unsubChat();
    };
  }, [user]);

  // Search players when modal is open
  useEffect(() => {
    if (isAddPartnerOpen) {
      const results = communityService.searchPlayer(searchQuery)
        .filter(p => p.id !== user.id && p.name.toLowerCase() !== user.name.toLowerCase());
      setSearchResults(results);
    }
  }, [searchQuery, isAddPartnerOpen, user]);

  const player = communityService.searchPlayer(user.name).find(p => p.id === user.id) || 
    communityService.getPlayers().find((p: CommunityPlayer) => p.name.toLowerCase() === user.name.toLowerCase());

  const remainingFree = authService.getHostedMatchesRemaining(user);
  const isSubscribed = user.plan === 'subscribed' || user.plan === 'pro_founder' || user.plan === 'captain' || user.plan === 'club';
  const isAdmin = authService.isAdmin(user);

  // Find active group callouts needing players ("Falta 1")
  const activeCallouts = groups.flatMap(g => 
    g.callouts
      .filter(c => c.status === 'open')
      .map(c => ({ ...c, groupName: g.name }))
  );

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    partnerService.createPost(user, newPostContent.trim());
    setNewPostContent('');
  };

  const handleToggleReaction = (postId: string, reactionType: 'clap' | 'fire' | 'trophy' | 'muscle') => {
    partnerService.toggleReaction(postId, user, reactionType);
  };

  const handleDeletePost = (postId: string) => {
    const isAdmin = user.email?.toLowerCase() === 'mariolabbes@gmail.com' || user.email?.toLowerCase().includes('admin');
    partnerService.deletePost(postId, user.id, isAdmin);
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    partnerService.addComment(postId, user, text.trim());
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSendPartnerRequest = (targetPlayer: CommunityPlayer) => {
    const res = partnerService.sendPartnerRequest(user, targetPlayer);
    setPartnerFeedbackMsg(res.message);
    setTimeout(() => setPartnerFeedbackMsg(null), 3000);
  };

  const handleRespondRequest = (requestId: string, accept: boolean) => {
    partnerService.respondToRequest(requestId, accept);
  };

  return (
    <div style={containerStyle}>
      {/* 1. TOP BRAND & SYSTEM UTILITIES BAR (DISEÑO MÓVIL SOCIAL LIMPIO) */}
      <header style={brandTopBarStyle} className="glass-panel apple-card">
        {/* Brand with Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 0 }}>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              border: '2px solid var(--team1-primary)',
              boxShadow: '0 2px 8px var(--team1-glow)',
              flexShrink: 0 
            }} 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: '1.08rem', color: 'var(--text-main)' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
            </span>
            <span style={{
              fontSize: '0.58rem',
              fontWeight: 900,
              letterSpacing: '0.04em',
              padding: '2px 5px',
              borderRadius: '5px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--team1-primary)',
              border: '1px solid rgba(5, 150, 105, 0.25)'
            }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Right Touch Triggers (Exactamente los 3 esenciales del estándar social móvil) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* 1. Mensajería Directa / Chat */}
          <button
            type="button"
            onClick={() => {
              if (partners.length > 0) {
                setSelectedChatPartner(partners[0]);
              } else if (onOpenCommunity) {
                onOpenCommunity();
              }
            }}
            style={{ ...iconHeaderBtnStyle, padding: '7px 9px' }}
            title="Mensajes Directos In-App"
            aria-label="Mensajes Directos"
          >
            <MessageSquare size={17} color="var(--team1-primary)" />
            {totalUnreadChat > 0 && (
              <span style={unreadBadgeCountStyle}>{totalUnreadChat}</span>
            )}
          </button>

          {/* 2. Campana de Notificaciones */}
          {onOpenNotifications && (
            <button 
              type="button"
              onClick={onOpenNotifications} 
              style={{ ...iconHeaderBtnStyle, padding: '7px 9px' }} 
              title="Notificaciones & Convocatorias"
              aria-label="Notificaciones"
            >
              <Bell size={17} color="var(--gold-primary)" />
              {unreadNotifs > 0 && (
                <span style={unreadBadgeCountStyle}>{unreadNotifs}</span>
              )}
            </button>
          )}

          {/* 3. Menú Rápido del Jugador (Abre Bottom Sheet con Ajustes, Tema, Privacidad, Admin y Salir) */}
          <button
            type="button"
            onClick={() => setIsMenuDrawerOpen(true)}
            style={{
              ...iconHeaderBtnStyle,
              padding: '3px',
              borderRadius: '50%',
              borderColor: getEloTier(player?.elo || user.elo).color,
              borderWidth: '2px'
            }}
            title="Abrir Menú de Jugador & Ajustes"
            aria-label="Menú del Jugador"
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              {user.avatar ? (
                isImageAvatar(user.avatar) ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{user.avatar}</span>
                )
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </button>
        </div>
      </header>

      {/* 2. ATHLETE PROFILE CARD (FICHA RESUMIDA DEL JUGADOR) */}
      <div style={athleteProfileCardStyle} className="glass-panel apple-card">
        <div 
          onClick={onOpenProfile}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: onOpenProfile ? 'pointer' : 'default' }}
          title={onOpenProfile ? 'Ver o editar mi ficha de jugador' : undefined}
        >
          {/* Avatar with ELO Tier Border */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: `2px solid ${getEloTier(player?.elo || user.elo).color}`,
            boxShadow: `0 0 12px ${getEloTier(player?.elo || user.elo).color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--bg-elevated)'
          }}>
            {user.avatar ? (
              isImageAvatar(user.avatar) ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{user.avatar}</span>
              )
            ) : (
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--team1-primary)' }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Athlete Info */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Hola, {user.name.split(' ')[0]} 👋
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '4px',
                background: `${getEloTier(player?.elo || user.elo).color}22`,
                color: getEloTier(player?.elo || user.elo).color,
                border: `1px solid ${getEloTier(player?.elo || user.elo).color}`
              }}>
                {getEloTier(player?.elo || user.elo).badge}
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.62rem', fontWeight: 900, padding: '2px 6px' }}>
                ELO {player?.elo || user.elo}
              </span>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>{user.category || '4ta'} Cat</span>
              {user.city && <span>• 📍 {user.city}</span>}
              <span>• {partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}</span>
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {onOpenCommunity && (
            <button
              type="button"
              onClick={onOpenCommunity}
              style={{
                ...iconHeaderBtnStyle,
                padding: '6px 9px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}
              title="Ranking Oficial ELO & Comunidad"
              aria-label="Ranking Oficial ELO"
            >
              <Trophy size={14} color="var(--gold-primary)" />
              <span style={{ display: 'none' }} className="mobile-show-desktop">Ranking</span>
            </button>
          )}

          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              style={{
                ...iconHeaderBtnStyle,
                background: 'rgba(0, 230, 118, 0.12)',
                borderColor: 'rgba(0, 230, 118, 0.35)',
                color: 'var(--team1-primary)',
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontWeight: 900
              }}
              title="Ver o Editar Mi Ficha de Jugador"
              aria-label="Mi Perfil"
            >
              <User size={14} />
              <span>Mi Ficha</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PENDING PARTNER REQUESTS BANNER (FRIEND REQUEST INBOX) */}
      {pendingRequests.length > 0 && (
        <div style={partnerRequestBannerStyle} className="glass-panel apple-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={partnerRequestIconStyle}>
              <UserPlus size={18} color="var(--team1-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>
                Nueva Solicitud de Partner
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <strong>{pendingRequests[0].requesterName}</strong> ({pendingRequests[0].requesterCategory} Cat • ELO {pendingRequests[0].requesterElo}) quiere conectar contigo.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleRespondRequest(pendingRequests[0].id, true)}
              style={acceptPartnerBtnStyle}
            >
              <Check size={14} />
              <span>Aceptar</span>
            </button>
            <button
              onClick={() => handleRespondRequest(pendingRequests[0].id, false)}
              style={rejectPartnerBtnStyle}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 3. HERO IN-COURT LAUNCH CARD (INVITATION TO PLAY IN COURT) */}
      <div style={inCourtHeroCardStyle} className="glass-panel apple-card glow-team1">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="badge badge-team1" style={{ fontSize: '0.68rem', fontWeight: 900 }}>
                MODO PARTIDO EN PISTA
              </span>
              {remainingFree !== Infinity && (
                <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                  ⚡ {remainingFree} partidos de cortesía restantes
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
              ¿Listo para jugar o convocar?
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: '440px' }}>
              Inicia el marcador en vivo si ya estás en cancha, o programa un partido e invita a tus amigos por WhatsApp.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={onStartMatch}
              style={heroPlayBtnStyle}
              aria-label="Jugar Ahora (En Cancha)"
            >
              <Play size={16} fill="#070a10" />
              <span>Jugar Ahora</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              style={heroScheduleBtnStyle}
              aria-label="Programar Partido y Convocar"
            >
              <Calendar size={16} color="var(--gold-primary)" />
              <span>Programar Partido</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3.1 PENDING MATCH INVITATIONS BANNER (QUICK RSVP INBOX) */}
      {scheduledData.pendingInvitesToMe.length > 0 && (
        <div style={scheduledInviteBannerStyle} className="glass-panel apple-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={scheduledInviteIconCircle}>
              <Calendar size={18} color="var(--gold-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>
                ¡Invitación a Partido! 🎾
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <strong>{scheduledData.pendingInvitesToMe[0].creatorName}</strong> te invitó a jugar en <strong>{scheduledData.pendingInvitesToMe[0].clubName}</strong> el <strong>{scheduledData.pendingInvitesToMe[0].matchDate}</strong> a las <strong>{scheduledData.pendingInvitesToMe[0].matchTime} hrs</strong>.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                scheduleService.respondInvite(scheduledData.pendingInvitesToMe[0].id, {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  avatar: user.avatar,
                  category: user.category
                }, true);
              }}
              style={quickAcceptBtnStyle}
            >
              <Check size={13} strokeWidth={3} />
              <span>Asistiré</span>
            </button>
            <button
              type="button"
              onClick={() => {
                scheduleService.respondInvite(scheduledData.pendingInvitesToMe[0].id, {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }, false);
              }}
              style={quickDeclineBtnStyle}
            >
              <X size={13} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDetailMatch(scheduledData.pendingInvitesToMe[0])}
              style={quickViewBtnStyle}
            >
              Ver
            </button>
          </div>
        </div>
      )}

      {/* 3.2 UPCOMING CONFIRMED MATCHES & OPEN CALLOUTS SECTION */}
      {(scheduledData.confirmedUpcoming.length > 0 || scheduledData.myOpenCallouts.length > 0) && (
        <div style={sectionWrapperStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--team1-primary)" />
              <h3 style={sectionTitleStyle}>Mis Próximos Partidos & Convocatorias</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              style={addPartnerTriggerBtnStyle}
            >
              <Plus size={13} />
              <span>+ Programar Partido</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* Confirmed Matches (Ready to play!) */}
            {scheduledData.confirmedUpcoming.map(match => (
              <div key={match.id} style={confirmedMatchCardStyle} className="glass-panel apple-card glow-team1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={confirmedBadgeStyle}>🟢 CONFIRMADO Y AGENDADO</span>
                    <h4 style={{ margin: '4px 0 2px', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
                      {match.clubName}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 800 }}>
                      📅 {match.matchDate} • {match.matchTime} hrs {match.courtName ? `(${match.courtName})` : ''}
                    </span>
                  </div>
                </div>

                {/* 4 Avatars in Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px' }}>
                  <div style={{ display: 'flex', marginLeft: '6px' }}>
                    {match.slots.map((slot, idx) => (
                      <div 
                        key={slot.id || idx}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-elevated)',
                          border: '2px solid var(--team1-primary)',
                          marginLeft: idx === 0 ? 0 : '-8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          color: '#fff',
                          overflow: 'hidden',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                        }}
                        title={slot.name}
                      >
                        {slot.avatar ? (
                          isImageAvatar(slot.avatar) ? (
                            <img src={slot.avatar} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>{slot.avatar}</span>
                          )
                        ) : (
                          slot.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                    4 jugadores listos ✓
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {onLaunchScheduledMatch && (
                    <button
                      type="button"
                      onClick={() => onLaunchScheduledMatch(match)}
                      style={launchToCourtCardBtn}
                    >
                      <Play size={14} fill="#070a10" />
                      <span>🎾 Entrar a Cancha</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedDetailMatch(match)}
                    style={viewCalloutDetailsBtn}
                  >
                    Detalles
                  </button>
                </div>
              </div>
            ))}

            {/* My Open Callouts (Looking for Players) */}
            {scheduledData.myOpenCallouts.map(callout => {
              const confirmedCount = callout.slots.filter(s => s.status === 'confirmed').length;
              const isFull = confirmedCount >= 4;

              return (
                <div key={callout.id} style={openCalloutCardStyle} className="glass-panel apple-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={openCalloutBadgeStyle}>
                        🟡 CONVOCATORIA ({confirmedCount}/4)
                      </span>
                      <h4 style={{ margin: '4px 0 2px', fontSize: '0.98rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        {callout.clubName}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800 }}>
                        📅 {callout.matchDate} • {callout.matchTime} hrs
                      </span>
                    </div>
                  </div>

                  {/* Quorum Progress Indicator */}
                  <div style={{ margin: '8px 0 12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {callout.slots.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          style={{
                            flex: 1,
                            height: '6px',
                            borderRadius: '3px',
                            background: s.status === 'confirmed' ? 'var(--team1-primary)' : 'rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const text = scheduleService.generateWhatsAppInviteText(callout, user.name);
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      style={shareWhatsAppCardBtn}
                    >
                      <Share2 size={13} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDetailMatch(callout)}
                      style={isFull ? fullConfirmCalloutBtn : viewCalloutDetailsBtn}
                    >
                      {isFull ? '✅ Cerrar Partido (4/4)' : `Gestionar (${confirmedCount}/4)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PARTNERS ROW (HORIZONTALLY SCROLLABLE STORIES/STATUSES) */}
      <div style={sectionWrapperStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} color="var(--team1-primary)" />
            <h3 style={sectionTitleStyle}>Mis Partners Conectados</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800 }}>
              ({partners.length})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setInviteFriendName('');
                setIsInviteExternalOpen(true);
              }}
              style={inviteWhatsAppHeaderBtnStyle}
              title="Invitar amigo externo por WhatsApp con link a registro"
            >
              <Share2 size={13} color="#25D366" />
              <span>Invitar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddPartnerOpen(true)}
              style={addPartnerTriggerBtnStyle}
            >
              <UserPlus size={13} />
              <span>Conectar Partner</span>
            </button>
          </div>
        </div>

        <div style={partnersCarouselStyle}>
          {/* Add Partner Card (Internal Search) */}
          <div 
            onClick={() => setIsAddPartnerOpen(true)} 
            style={addPartnerBubbleStyle}
            role="button"
            tabIndex={0}
            title="Buscar jugadores en la comunidad PadelMatch"
          >
            <div style={addPartnerIconCircle}>
              <UserPlus size={20} color="var(--team1-primary)" />
            </div>
            <span style={partnerNameStyle}>+ Conectar</span>
          </div>

          {/* Invite External Partner Card (WhatsApp) */}
          <div 
            onClick={() => {
              setInviteFriendName('');
              setIsInviteExternalOpen(true);
            }} 
            style={inviteWhatsAppBubbleStyle}
            role="button"
            tabIndex={0}
            title="Invitar a un amigo externo a registrarse por WhatsApp"
          >
            <div style={inviteWhatsAppIconCircle}>
              <Share2 size={18} color="#25D366" />
            </div>
            <span style={{ ...partnerNameStyle, color: '#25D366' }}>+ Invitar WA</span>
          </div>

          {partners.map(p => {
            const chatId = directChatService.getChatId(user.id, p.id);
            const msgs = directChatService.getMessages(chatId);
            const unread = msgs.filter(m => m.recipientId === user.id && !m.read).length;

            return (
              <div 
                key={p.id} 
                style={{ ...partnerBubbleStyle, cursor: 'pointer' }}
                onClick={() => setSelectedChatPartner(p)}
                title={`Abrir chat privado con ${p.name}`}
                role="button"
                tabIndex={0}
              >
                <div style={{ ...partnerAvatarCircle, position: 'relative' }}>
                  {p.avatar ? (
                    isImageAvatar(p.avatar) ? (
                      <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{p.avatar}</span>
                    )
                  ) : (
                    p.name.charAt(0).toUpperCase()
                  )}
                  <span style={partnerStatusDotStyle} className="pulsing-dot" />
                  {unread > 0 && (
                    <span style={chatUnreadBadgeStyle}>{unread}</span>
                  )}
                </div>
                <span style={partnerNameStyle}>{p.name.split(' ')[0]}</span>
                <span style={{ 
                  ...partnerMetaStyle, 
                  color: unread > 0 ? '#00E676' : 'var(--text-dim)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '3px' 
                }}>
                  <MessageSquare size={10} color={unread > 0 ? '#00E676' : 'var(--text-muted)'} />
                  <span>{unread > 0 ? `${unread} nuevo` : `${p.category} Cat`}</span>
                </span>
              </div>
            );
          })}

          {partners.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px' }}>
              Aún no tienes partners conectados. ¡Pulsa "+ Conectar" para invitar a tus amigos de juego!
            </div>
          )}
        </div>
      </div>

      {/* 5. MAIN CONTENT FEED: 2-COLUMN LUXURY GRID */}
      <div style={contentGridStyle}>
        {/* LEFT COLUMN: SOCIAL FEED OF PARTNERS (COMMENTS & MATCH ACTIVITY) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Post Composer Card */}
          <div style={composerCardStyle} className="glass-panel apple-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                ...userMiniAvatar,
                overflow: 'hidden'
              }}>
                {user.avatar ? (
                  isImageAvatar(user.avatar) ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>{user.avatar}</span>
                  )
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Comparte una actualización con tus Partners
              </span>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="¿Qué tal estuvo el partido de anoche? ¿Quién busca partido para hoy?..."
                style={postTextareaStyle}
                rows={2}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  disabled={!newPostContent.trim()} 
                  style={{
                    ...postSubmitBtnStyle,
                    opacity: newPostContent.trim() ? 1 : 0.5,
                    cursor: newPostContent.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Send size={13} />
                  <span>Publicar</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activity Feed Section Title */}
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="var(--gold-primary)" />
              <h3 style={sectionTitleStyle}>Actividad y Comentarios del Circuito</h3>
            </div>
          </div>

          {/* Posts List */}
          {feedPosts.map(post => {
            const isCommentsOpen = openCommentsPostId === post.id;
            return (
              <div key={post.id} style={postCardStyle} className="glass-panel apple-card">
                {/* Author Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      ...authorAvatarCircle,
                      overflow: 'hidden'
                    }}>
                      {post.authorAvatar ? (
                        isImageAvatar(post.authorAvatar) ? (
                          <img src={post.authorAvatar} alt={post.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{post.authorAvatar}</span>
                        )
                      ) : (
                        post.authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {post.authorName}
                        </span>
                        <span className="badge badge-team1" style={{ fontSize: '0.62rem' }}>
                          {post.authorCategory} Cat
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {formatRelativeTime(post.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Snippet (If post represents a finished game) */}
                {post.matchSnippet && (
                  <div style={matchSnippetBoxStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--team1-primary)', fontWeight: 800 }}>
                        🏆 PARTIDO COMPLETADO
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {post.matchSnippet.courtName}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>
                      {post.matchSnippet.scoreSets}
                    </div>
                  </div>
                )}

                {/* Post Content */}
                <p style={postContentTextStyle}>
                  {post.content}
                </p>

                {/* Post Actions: Reactions (Clap / Fire), Comments, Direct Chat & Delete */}
                {(() => {
                  const fireCount = post.reactions ? post.reactions.filter(r => r.type === 'fire').length : 0;
                  const hasFired = post.userReaction === 'fire' || (post.reactions && post.reactions.some(r => r.userId === user.id && r.type === 'fire'));
                  const hasClapped = post.hasClapped || post.userReaction === 'clap' || (post.reactions && post.reactions.some(r => r.userId === user.id && r.type === 'clap'));
                  const isOwnPost = post.authorId === user.id;
                  const isAdminUser = user.email?.toLowerCase() === 'mariolabbes@gmail.com' || user.email?.toLowerCase().includes('admin');
                  const authorPartner = !isOwnPost ? (
                    partners.find(p => p.id === post.authorId || p.name.toLowerCase() === post.authorName.toLowerCase()) ||
                    communityService.getPlayers().find(p => (p.id === post.authorId || p.name.toLowerCase() === post.authorName.toLowerCase()) && p.id !== user.id)
                  ) : null;

                  return (
                    <div style={postActionsRowStyle}>
                      <button
                        type="button"
                        onClick={() => handleToggleReaction(post.id, 'clap')}
                        style={{
                          ...postActionBtnStyle,
                          color: hasClapped ? 'var(--gold-primary)' : 'var(--text-muted)',
                          background: hasClapped ? 'rgba(255, 214, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: hasClapped ? 'var(--gold-primary)' : 'var(--border-subtle)'
                        }}
                        title="¡Chócala! Apoyo deportivo"
                      >
                        <span>👏 Chócala ({post.clapsCount || 0})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleReaction(post.id, 'fire')}
                        style={{
                          ...postActionBtnStyle,
                          color: hasFired ? '#ff5722' : 'var(--text-muted)',
                          background: hasFired ? 'rgba(255, 87, 34, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: hasFired ? '#ff5722' : 'var(--border-subtle)'
                        }}
                        title="¡Puntazo tremendo!"
                      >
                        <span>🔥 Puntazo{fireCount > 0 ? ` (${fireCount})` : ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                        style={postActionBtnStyle}
                      >
                        <MessageSquare size={13} />
                        <span>Comentarios ({post.comments.length})</span>
                      </button>

                      {authorPartner && (
                        <button
                          type="button"
                          onClick={() => setSelectedChatPartner(authorPartner)}
                          style={{
                            ...postActionBtnStyle,
                            color: '#00e5ff',
                            background: 'rgba(0, 229, 255, 0.06)',
                            borderColor: 'rgba(0, 229, 255, 0.25)'
                          }}
                          title={`Mensaje directo en la app a ${authorPartner.name}`}
                        >
                          <Send size={12} />
                          <span>Mensaje</span>
                        </button>
                      )}

                      {(isOwnPost || isAdminUser) && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          style={{
                            ...postActionBtnStyle,
                            color: '#ff5252',
                            background: 'rgba(255, 82, 82, 0.06)',
                            borderColor: 'rgba(255, 82, 82, 0.2)',
                            marginLeft: 'auto'
                          }}
                          title="Eliminar publicación"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Collapsible Comments Section */}
                {isCommentsOpen && (
                  <div style={commentsThreadStyle}>
                    {post.comments.map(c => (
                      <div key={c.id} style={commentItemStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {c.authorName}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                            {formatRelativeTime(c.timestamp)}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          {c.content}
                        </p>
                      </div>
                    ))}

                    {/* New Comment Input */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Escribe un comentario deportivo..."
                        style={commentInputStyle}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        style={commentSendBtnStyle}
                        title="Enviar comentario"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: GROUPS ("FALTA 1"), CLUBS CAMPAIGNS & PADEL NEWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Callouts in Groups ("Falta 1" Alert) */}
          <div style={sidebarCardStyle} className="glass-panel apple-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="var(--gold-primary)" />
                <h4 style={sidebarTitleStyle}>Convocatorias en tus Grupos</h4>
              </div>
              {onNavigateToGroups && (
                <button onClick={onNavigateToGroups} style={linkSmallBtnStyle}>
                  Ver todos
                </button>
              )}
            </div>

            {activeCallouts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeCallouts.map(callout => {
                  const needed = 4 - (callout.acceptedPlayerIds.length % 4);
                  return (
                    <div key={callout.id} style={calloutUrgentBoxStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                            {callout.groupName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#fff', marginTop: '2px' }}>
                            📅 {callout.matchDate} a las {callout.matchTime} hrs
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            📍 {callout.clubName}
                          </div>
                        </div>

                        <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                          ¡Falta {needed}!
                        </span>
                      </div>

                      {onNavigateToGroups && (
                        <button onClick={onNavigateToGroups} style={joinCalloutBtnStyle}>
                          <span>Unirme a Convocatoria</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '14px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No hay partidos con "Falta 1" pendientes en tus grupos en este momento.
              </div>
            )}
          </div>

          {/* Club Campaigns & Special Offers (Only rendered if official active campaigns exist) */}
          {clubCampaigns.length > 0 && (
            <div style={sidebarCardStyle} className="glass-panel apple-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--team2-primary)" />
                <h4 style={sidebarTitleStyle}>Campañas y Ofertas de Clubes</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clubCampaigns.map(camp => (
                  <div key={camp.id} style={campaignCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--team2-primary)', fontWeight: 800 }}>
                        📍 {camp.clubName} ({camp.clubCity})
                      </span>
                      {camp.discountLabel && (
                        <span className="badge badge-team2" style={{ fontSize: '0.62rem' }}>
                          {camp.discountLabel}
                        </span>
                      )}
                    </div>

                    <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', margin: '4px 0 2px' }}>
                      {camp.title}
                    </h5>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                      {camp.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        {camp.validUntil}
                      </span>
                      {camp.contactPhone && (
                        <a
                          href={`https://wa.me/${camp.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola! Vi la promo "${camp.title}" en PadelMatch y me gustaría consultar disponibilidad de pista.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={whatsappContactBtnStyle}
                        >
                          <span>Reservar Pista</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sport News & Insights */}
          <div style={sidebarCardStyle} className="glass-panel apple-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <TrendingUp size={16} color="var(--team1-primary)" />
              <h4 style={sidebarTitleStyle}>Noticias & Tips de Pádel</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {padelNews.map(item => (
                <div key={item.id} style={newsItemStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--team1-primary)', textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>•</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>{item.readTimeMinutes} min lectura</span>
                  </div>
                  <h6 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', margin: '3px 0 2px' }}>
                    {item.title}
                  </h6>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODAL: SEARCH & CONNECT PARTNER */}
      {isAddPartnerOpen && (
        <div style={modalOverlayStyle}>
          <div style={searchModalCardStyle} className="glass-panel apple-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--team1-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Conectar Nuevo Partner
                </h3>
              </div>
              <button onClick={() => setIsAddPartnerOpen(false)} style={closeModalBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Busca jugadores de la comunidad por nombre o club. Al conectar, podrán ver sus partidos, racha de victorias y comentarse jugadas.
            </p>

            {partnerFeedbackMsg && (
              <div style={feedbackAlertStyle}>
                <Sparkles size={14} />
                <span>{partnerFeedbackMsg}</span>
              </div>
            )}

            {/* Invite external friend card */}
            <div style={inviteExternalCalloutStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#25D366" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>
                    ¿Tu amigo(a) aún no usa PadelMatch?
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Envíale una invitación por WhatsApp con tu link de partner para que cree su cuenta y queden conectados automáticamente.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInviteFriendName(searchQuery.trim());
                  setIsInviteExternalOpen(true);
                }}
                style={inviteWhatsAppModalBtnStyle}
              >
                <MessageSquare size={14} fill="#fff" />
                <span>Invitar Amigo por WhatsApp</span>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar jugador por nombre (ej: Fernando, Matías)..."
                style={searchInputStyle}
                autoFocus
              />
            </div>

            {/* Search Results List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.map(p => {
                const alreadyPartner = partnerService.isPartner(user, p.id);
                const hasPending = partnerService.hasPendingRequest(user, p.id);

                return (
                  <div key={p.id} style={playerResultRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        ...authorAvatarCircle,
                        overflow: 'hidden'
                      }}>
                        {p.avatar ? (
                          isImageAvatar(p.avatar) ? (
                            <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{p.avatar}</span>
                          )
                        ) : (
                          p.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {p.category} Cat • ELO {p.elo} {p.city ? `• 📍 ${p.city}` : ''}
                        </div>
                      </div>
                    </div>

                    {alreadyPartner ? (
                      <span className="badge badge-team1" style={{ fontSize: '0.65rem' }}>
                        Partner ✓
                      </span>
                    ) : hasPending ? (
                      <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                        Pendiente...
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendPartnerRequest(p)}
                        style={connectBtnStyle}
                      >
                        <UserPlus size={13} />
                        <span>Conectar</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '18px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <p style={{ margin: '0 0 10px' }}>
                    {searchQuery.trim() 
                      ? `No encontramos a "${searchQuery.trim()}" entre los jugadores registrados.` 
                      : 'No se encontraron jugadores con ese nombre.'}
                  </p>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setInviteFriendName(searchQuery.trim());
                        setIsInviteExternalOpen(true);
                      }}
                      style={inviteSpecificPlayerBtnStyle}
                    >
                      <Share2 size={13} color="#25D366" />
                      <span>Invitar a "{searchQuery.trim()}" por WhatsApp</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Match Modal */}
      <ScheduleMatchModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentUser={user}
        onMatchCreated={(newMatch) => {
          setSelectedDetailMatch(newMatch);
        }}
      />

      {/* Scheduled Match Detail & Management Modal */}
      <ScheduledMatchDetailModal
        isOpen={!!selectedDetailMatch}
        match={selectedDetailMatch}
        currentUser={user}
        onClose={() => setSelectedDetailMatch(null)}
        onLaunchMatch={(match) => {
          if (onLaunchScheduledMatch) {
            onLaunchScheduledMatch(match);
          }
        }}
      />

      {/* Invite External Partner WhatsApp Modal */}
      <InviteExternalPartnerModal
        isOpen={isInviteExternalOpen}
        onClose={() => setIsInviteExternalOpen(false)}
        currentUser={user}
        initialFriendName={inviteFriendName}
      />

      {/* 1-to-1 Direct Chat Modal with Partner */}
      {selectedChatPartner && (
        <PartnerChatModal
          isOpen={!!selectedChatPartner}
          onClose={() => setSelectedChatPartner(null)}
          currentUser={user}
          partner={selectedChatPartner}
          onOpenScheduleInvite={(_partner) => {
            setSelectedChatPartner(null);
            setIsScheduleModalOpen(true);
          }}
          onOpenProfile={(_partner) => {
            setSelectedChatPartner(null);
            if (onOpenCommunity) onOpenCommunity();
          }}
        />
      )}

      {/* Privacy Settings & Data Governance Modal */}
      <PrivacySettingsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        currentUser={user}
      />

      {/* Mobile Player Menu Drawer (Action Sheet de Ajustes, Tema, Privacidad, Admin) */}
      <MobilePlayerMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        currentUser={user}
        isAdmin={isAdmin}
        isSubscribed={isSubscribed}
        theme={theme}
        onToggleTheme={() => themeService.toggleTheme()}
        onOpenProfile={() => {
          if (onOpenProfile) onOpenProfile();
        }}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenSubscription={onOpenSubscriptionModal}
        onOpenBluetoothModal={onOpenBluetoothModal}
        onOpenAdmin={onOpenAdmin}
        onLogout={onLogout}
      />
    </div>
  );
};

// Relative Time Helper
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Recién';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'calc(var(--safe-bottom) + 80px)', // space for bottom nav
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  background: 'var(--bg-deep)',
  color: 'var(--text-main)',
  boxSizing: 'border-box',
  maxWidth: '960px',
  margin: '0 auto'
};

const brandTopBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  marginBottom: '12px',
  borderRadius: '16px',
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-subtle)',
  boxShadow: 'var(--shadow-sm)'
};

const athleteProfileCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  marginBottom: '14px',
  borderRadius: '16px',
  gap: '12px'
};

const inviteWhatsAppHeaderBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '8px',
  background: 'rgba(37, 211, 102, 0.12)',
  border: '1px solid rgba(37, 211, 102, 0.35)',
  color: '#25D366',
  fontSize: '0.78rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const inviteWhatsAppBubbleStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 10px',
  borderRadius: '12px',
  border: '1px dashed rgba(37, 211, 102, 0.45)',
  background: 'rgba(37, 211, 102, 0.05)',
  cursor: 'pointer',
  minWidth: '68px',
  flexShrink: 0
};

const inviteWhatsAppIconCircle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  background: 'rgba(37, 211, 102, 0.15)',
  border: '1px solid rgba(37, 211, 102, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const inviteExternalCalloutStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.1) 0%, rgba(0, 176, 255, 0.08) 100%)',
  border: '1px solid rgba(37, 211, 102, 0.3)',
  marginBottom: '14px'
};

const inviteWhatsAppModalBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '9px 14px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  color: '#fff',
  fontSize: '0.82rem',
  fontWeight: 900,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(37, 211, 102, 0.3)'
};

const inviteSpecificPlayerBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '10px',
  background: 'rgba(37, 211, 102, 0.12)',
  border: '1px solid #25D366',
  color: '#25D366',
  fontSize: '0.8rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const iconHeaderBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 10px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  position: 'relative'
};

const unreadBadgeCountStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: 'var(--danger-primary)',
  color: '#ffffff',
  fontSize: '0.62rem',
  fontWeight: 900,
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 8px rgba(255, 61, 113, 0.6)'
};

const partnerRequestBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  marginBottom: '14px',
  background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.12) 0%, rgba(14, 21, 36, 0.95) 100%)',
  border: '1.5px solid var(--team1-primary)',
  borderRadius: '14px',
  animation: 'fadeIn 0.2s ease-out'
};

const partnerRequestIconStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '8px',
  background: 'rgba(0, 230, 118, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const acceptPartnerBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  background: 'var(--team1-primary)',
  color: '#070a10',
  borderRadius: '8px',
  fontWeight: 900,
  fontSize: '0.78rem',
  cursor: 'pointer'
};

const rejectPartnerBtnStyle: React.CSSProperties = {
  padding: '6px 9px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  borderRadius: '8px',
  cursor: 'pointer'
};

const inCourtHeroCardStyle: React.CSSProperties = {
  padding: 'clamp(14px, 3vw, 20px)',
  marginBottom: '16px',
  borderRadius: '18px',
  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08) 0%, rgba(14, 21, 36, 0.95) 100%)',
  border: '1.5px solid rgba(0, 230, 118, 0.35)'
};

const heroPlayBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 18px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: '12px',
  fontWeight: 900,
  fontSize: '0.88rem',
  cursor: 'pointer',
  boxShadow: '0 3px 15px var(--team1-glow)',
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap'
};

const sectionWrapperStyle: React.CSSProperties = {
  marginBottom: '18px'
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
  padding: '0 4px'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 900,
  color: 'var(--text-main)',
  margin: 0,
  letterSpacing: '-0.01em'
};

const addPartnerTriggerBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(0, 230, 118, 0.1)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  color: 'var(--team1-primary)',
  fontSize: '0.72rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const partnersCarouselStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  overflowX: 'auto',
  padding: '4px 2px 10px',
  scrollbarWidth: 'none'
};

const partnerBubbleStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  minWidth: '64px',
  cursor: 'pointer'
};

const partnerAvatarCircle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2) 0%, rgba(0, 176, 255, 0.2) 100%)',
  border: '2px solid rgba(0, 230, 118, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '1.1rem',
  color: '#fff',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
};

const partnerStatusDotStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: 'var(--team1-primary)',
  border: '2px solid #070a10'
};

const chatUnreadBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-3px',
  right: '-3px',
  background: '#00E676',
  color: '#070a10',
  fontSize: '0.62rem',
  fontWeight: 900,
  minWidth: '16px',
  height: '16px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 3px',
  boxShadow: '0 2px 6px rgba(0, 230, 118, 0.5)'
};

const addPartnerBubbleStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  minWidth: '64px',
  cursor: 'pointer'
};

const addPartnerIconCircle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  border: '2px dashed rgba(0, 230, 118, 0.4)',
  background: 'rgba(0, 230, 118, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const partnerNameStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  textAlign: 'center',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  maxWidth: '68px'
};

const partnerMetaStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  color: 'var(--text-dim)',
  fontWeight: 700
};

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '16px'
};

const composerCardStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '16px'
};

const userMiniAvatar: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const postTextareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid var(--border-medium)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  outline: 'none',
  resize: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const postSubmitBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: '8px',
  fontWeight: 900,
  fontSize: '0.78rem'
};

const postCardStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '16px'
};

const authorAvatarCircle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '0.85rem',
  color: 'var(--team1-primary)'
};

const matchSnippetBoxStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(0, 0, 0, 0.45)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  borderRadius: '10px',
  marginBottom: '8px'
};

const postContentTextStyle: React.CSSProperties = {
  fontSize: '0.84rem',
  color: '#e2e8f0',
  margin: '0 0 10px',
  lineHeight: 1.45
};

const postActionsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  borderTop: '1px solid var(--border-subtle)',
  paddingTop: '8px'
};

const postActionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 10px',
  borderRadius: '8px',
  fontSize: '0.74rem',
  fontWeight: 800,
  cursor: 'pointer',
  border: '1px solid var(--border-subtle)',
  background: 'rgba(255, 255, 255, 0.04)',
  color: 'var(--text-muted)'
};

const commentsThreadStyle: React.CSSProperties = {
  marginTop: '10px',
  paddingTop: '8px',
  borderTop: '1px solid var(--border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const commentItemStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '8px'
};

const commentInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '7px 10px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
  outline: 'none'
};

const commentSendBtnStyle: React.CSSProperties = {
  padding: '7px 10px',
  background: 'var(--team1-primary)',
  color: '#070a10',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const sidebarCardStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '16px'
};

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 900,
  color: 'var(--text-main)',
  margin: 0
};

const linkSmallBtnStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--team1-primary)',
  fontWeight: 800,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0
};

const calloutUrgentBoxStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(255, 214, 0, 0.08)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  borderRadius: '12px'
};

const joinCalloutBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '7px',
  background: 'var(--gold-primary)',
  color: '#070a10',
  borderRadius: '8px',
  fontWeight: 900,
  fontSize: '0.75rem',
  marginTop: '8px',
  cursor: 'pointer'
};

const campaignCardStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(0, 176, 255, 0.06)',
  border: '1px solid rgba(0, 176, 255, 0.25)',
  borderRadius: '12px'
};

const whatsappContactBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.7rem',
  fontWeight: 800,
  color: 'var(--team2-primary)',
  textDecoration: 'none'
};

const newsItemStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 8, 15, 0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const searchModalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  padding: '20px',
  borderRadius: '20px',
  background: 'var(--bg-card)'
};

const closeModalBtnStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px 11px 36px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const playerResultRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px'
};

const connectBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: '8px',
  fontWeight: 900,
  fontSize: '0.74rem',
  cursor: 'pointer'
};

const feedbackAlertStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid var(--team1-primary)',
  borderRadius: '8px',
  color: 'var(--team1-primary)',
  fontSize: '0.78rem',
  fontWeight: 800,
  marginBottom: '10px'
};

const heroScheduleBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  background: 'rgba(255, 214, 0, 0.12)',
  color: 'var(--gold-primary)',
  border: '1.5px solid rgba(255, 214, 0, 0.35)',
  borderRadius: '12px',
  fontWeight: 900,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 14px rgba(255, 214, 0, 0.15)'
};

const scheduledInviteBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.14) 0%, rgba(14, 21, 36, 0.95) 100%)',
  border: '1.5px solid rgba(255, 214, 0, 0.4)',
  marginBottom: '16px',
  boxShadow: '0 8px 24px rgba(255, 214, 0, 0.12)'
};

const scheduledInviteIconCircle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  background: 'rgba(255, 214, 0, 0.2)',
  border: '1px solid var(--gold-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const quickAcceptBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: '8px',
  fontWeight: 900,
  fontSize: '0.75rem',
  border: 'none',
  cursor: 'pointer'
};

const quickDeclineBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: 'rgba(255, 82, 82, 0.15)',
  color: '#ff5252',
  borderRadius: '8px',
  border: '1px solid rgba(255, 82, 82, 0.3)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const quickViewBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--text-main)',
  borderRadius: '8px',
  border: '1px solid var(--border-medium)',
  fontSize: '0.72rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const confirmedMatchCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08) 0%, rgba(14, 21, 36, 0.95) 100%)',
  border: '1.5px solid rgba(0, 230, 118, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const confirmedBadgeStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 900,
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(0, 230, 118, 0.2)',
  color: 'var(--team1-primary)',
  border: '1px solid var(--team1-primary)',
  letterSpacing: '0.04em'
};

const launchToCourtCardBtn: React.CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '9px 12px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  borderRadius: '10px',
  fontWeight: 900,
  fontSize: '0.8rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0, 230, 118, 0.35)'
};

const viewCalloutDetailsBtn: React.CSSProperties = {
  padding: '9px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--text-main)',
  borderRadius: '10px',
  border: '1px solid var(--border-medium)',
  fontWeight: 800,
  fontSize: '0.78rem',
  cursor: 'pointer'
};

const openCalloutCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1.5px solid var(--border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const openCalloutBadgeStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 900,
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(255, 214, 0, 0.15)',
  color: 'var(--gold-primary)',
  border: '1px solid var(--gold-primary)',
  letterSpacing: '0.04em'
};

const shareWhatsAppCardBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '9px 12px',
  background: '#25D366',
  color: '#ffffff',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.78rem',
  border: 'none',
  cursor: 'pointer'
};

const fullConfirmCalloutBtn: React.CSSProperties = {
  flex: 1,
  padding: '9px 12px',
  background: 'var(--gold-gradient)',
  color: '#070a10',
  borderRadius: '10px',
  fontWeight: 900,
  fontSize: '0.8rem',
  border: 'none',
  cursor: 'pointer'
};

