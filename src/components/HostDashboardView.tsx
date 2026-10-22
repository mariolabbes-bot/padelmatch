import React, { useState, useEffect } from 'react';
import type { MatchRules, CommunityPlayer, PadelGroup, PartnerPost, ClubCampaign, PadelNewsItem, PartnerConnection } from '../types/padel';
import { authService, type UserSession } from '../services/authService';
import { communityService } from '../services/communityService';
import { notificationService } from '../services/notificationService';
import { themeService, type AppTheme } from '../services/themeService';
import { partnerService } from '../services/partnerService';
import { groupService } from '../services/groupService';
import { 
  Trophy, 
  LogOut, 
  ChevronRight, 
  Flame,
  Sun,
  Moon,
  Bell,
  Crown,
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
  TrendingUp
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
  onLogout: () => void;
}

export const HostDashboardView: React.FC<Props> = ({
  user,
  onOpenCommunity,
  onOpenNotifications,
  onOpenSubscriptionModal,
  onNavigateToGroups,
  onStartMatch,
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

  // Post Composer State
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);

  // Partner Search Modal State
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityPlayer[]>([]);
  const [partnerFeedbackMsg, setPartnerFeedbackMsg] = useState<string | null>(null);

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

    return () => {
      unsubNotifs();
      unsubPartners();
      unsubGroups();
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

  const handleToggleClap = (postId: string) => {
    partnerService.toggleClap(postId);
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
      {/* 1. TOP ATHLETE HEADER */}
      <header style={topBarStyle} className="glass-panel apple-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.25)', flexShrink: 0 }} 
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.15rem', color: 'var(--text-main)' }}>
                Hola, {user.name.split(' ')[0]} 👋
              </span>
              <span className="badge badge-team1" style={{ fontSize: '0.65rem', fontWeight: 900 }}>
                {user.category} Cat
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem', fontWeight: 900 }}>
                ELO {player?.elo || user.elo}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {partners.length} Partners conectados • {groups.length} Grupos activos
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* ELO Ranking & Community Button */}
          {onOpenCommunity && (
            <button
              type="button"
              onClick={onOpenCommunity}
              style={iconHeaderBtnStyle}
              title="Ranking Oficial ELO & Comunidad"
              aria-label="Ranking Oficial ELO & Comunidad"
            >
              <Trophy size={16} color="var(--gold-primary)" />
            </button>
          )}

          {/* Day / Night Theme Switcher */}
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            style={iconHeaderBtnStyle}
            title={theme === 'day' ? 'Modo Noche (Estadio Neón)' : 'Modo Día (Luz Natural / Alto Contraste)'}
            aria-label="Cambiar tema día/noche"
          >
            {theme === 'day' ? <Sun size={16} color="var(--gold-primary)" /> : <Moon size={16} color="var(--team2-primary)" />}
          </button>

          {/* Subscription Badge Button */}
          {onOpenSubscriptionModal && (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              style={{
                ...iconHeaderBtnStyle,
                background: isSubscribed ? 'rgba(0, 230, 118, 0.14)' : 'rgba(255, 214, 0, 0.14)',
                borderColor: isSubscribed ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 214, 0, 0.35)',
                color: isSubscribed ? 'var(--team1-primary)' : 'var(--gold-primary)'
              }}
              title="Planes y Suscripción"
            >
              <Crown size={15} />
              <span style={{ fontSize: '0.72rem', fontWeight: 900 }}>{isSubscribed ? 'PRO' : 'PLANES'}</span>
            </button>
          )}

          {/* Notifications Bell */}
          {onOpenNotifications && (
            <button 
              onClick={onOpenNotifications} 
              style={iconHeaderBtnStyle} 
              title="Notificaciones & Convocatorias"
              type="button"
            >
              <Bell size={16} color="var(--gold-primary)" />
              {unreadNotifs > 0 && (
                <span style={unreadBadgeCountStyle}>{unreadNotifs}</span>
              )}
            </button>
          )}

          {/* Logout */}
          <button onClick={onLogout} style={logoutBtnStyle} title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </header>

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
              ¿Listo para jugar hoy?
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: '440px' }}>
              Inicia el marcador con árbitro por voz y código QR para tus rivales. Pulsa el botón central abajo o toca iniciar aquí.
            </p>
          </div>

          <button 
            type="button"
            onClick={onStartMatch}
            style={heroPlayBtnStyle}
            aria-label="Configurar e Iniciar Partido"
          >
            <Play size={16} fill="#070a10" />
            <span>Configurar Partido</span>
          </button>
        </div>
      </div>

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

          <button
            type="button"
            onClick={() => setIsAddPartnerOpen(true)}
            style={addPartnerTriggerBtnStyle}
          >
            <UserPlus size={13} />
            <span>Conectar Partner</span>
          </button>
        </div>

        <div style={partnersCarouselStyle}>
          {/* Add Partner Card */}
          <div 
            onClick={() => setIsAddPartnerOpen(true)} 
            style={addPartnerBubbleStyle}
            role="button"
            tabIndex={0}
          >
            <div style={addPartnerIconCircle}>
              <UserPlus size={20} color="var(--team1-primary)" />
            </div>
            <span style={partnerNameStyle}>+ Conectar</span>
          </div>

          {partners.map(p => (
            <div key={p.id} style={partnerBubbleStyle}>
              <div style={partnerAvatarCircle}>
                {p.name.charAt(0).toUpperCase()}
                <span style={partnerStatusDotStyle} className="pulsing-dot" />
              </div>
              <span style={partnerNameStyle}>{p.name.split(' ')[0]}</span>
              <span style={partnerMetaStyle}>{p.category} Cat</span>
            </div>
          ))}

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
              <div style={userMiniAvatar}>
                {user.name.charAt(0).toUpperCase()}
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
                    <div style={authorAvatarCircle}>
                      {post.authorName.charAt(0).toUpperCase()}
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

                {/* Post Actions: Claps & Comments */}
                <div style={postActionsRowStyle}>
                  <button
                    type="button"
                    onClick={() => handleToggleClap(post.id)}
                    style={{
                      ...postActionBtnStyle,
                      color: post.hasClapped ? 'var(--gold-primary)' : 'var(--text-muted)',
                      background: post.hasClapped ? 'rgba(255, 214, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: post.hasClapped ? 'var(--gold-primary)' : 'var(--border-subtle)'
                    }}
                  >
                    <span>👏 Chócala ({post.clapsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                    style={postActionBtnStyle}
                  >
                    <MessageSquare size={13} />
                    <span>Comentarios ({post.comments.length})</span>
                  </button>
                </div>

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
                      <div style={authorAvatarCircle}>
                        {p.name.charAt(0).toUpperCase()}
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
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No se encontraron jugadores con ese nombre.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
  background: 'radial-gradient(ellipse at 50% 15%, #0d1527 0%, var(--bg-deep) 75%)',
  color: 'var(--text-main)',
  boxSizing: 'border-box',
  maxWidth: '960px',
  margin: '0 auto'
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  marginBottom: '14px',
  borderRadius: '16px'
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

const logoutBtnStyle: React.CSSProperties = {
  padding: '7px 9px',
  borderRadius: '8px',
  background: 'rgba(255, 61, 113, 0.1)',
  border: '1px solid rgba(255, 61, 113, 0.3)',
  color: 'var(--danger-primary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
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
