import React, { useState, useEffect } from 'react';
import type { 
  PlayerCategory, 
  DominantHand, 
  CommunityPlayer,
  AppViewMode
} from '../types/padel';
import { authService, type UserSession } from '../services/authService';
import { communityService } from '../services/communityService';
import { partnerService } from '../services/partnerService';
import { themeService, type AppTheme } from '../services/themeService';
import { getEloTier, DEFAULT_INITIAL_ELO } from '../engine/eloEngine';
import { ClubSelectCombobox } from './ClubSelectCombobox';
import { AvatarSelector } from './AvatarSelector';
import { isImageAvatar } from '../utils/imageOptimizer';
import { referralService } from '../services/referralService';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Zap, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Users, 
  Sparkles,
  Sun,
  Moon,
  Crosshair,
  Target,
  HelpCircle,
  Check,
  X,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { PartnerChatModal } from './PartnerChatModal';

interface Props {
  currentUser: UserSession;
  onBack: () => void;
  onNavigateToView?: (view: AppViewMode) => void;
  onLogout?: () => void;
}

export const UserProfileView: React.FC<Props> = ({
  currentUser,
  onBack,
  onNavigateToView,
  onLogout
}) => {
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());
  const [activeTab, setActiveTab] = useState<'profile' | 'insights' | 'partners' | 'security'>('profile');

  // Form State
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [favoritePosition, setFavoritePosition] = useState<'drive' | 'reves' | 'ambas'>(currentUser.favoritePosition || 'ambas');
  const [dominantHand, setDominantHand] = useState<DominantHand>(currentUser.dominantHand || 'diestro');
  const [category, setCategory] = useState<PlayerCategory>(currentUser.category || '4ta');
  const [city, setCity] = useState(currentUser.city || 'La Serena');
  const [preferredClub, setPreferredClub] = useState(currentUser.club || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  // Baseline Form State (tracks original saved values to detect modifications)
  const [baseline, setBaseline] = useState(() => ({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    favoritePosition: currentUser.favoritePosition || 'ambas',
    dominantHand: currentUser.dominantHand || 'diestro',
    category: currentUser.category || '4ta',
    city: currentUser.city || 'La Serena',
    club: currentUser.club || '',
    avatar: currentUser.avatar || ''
  }));

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Feedback State
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState<string | null>(null);
  const [pwdErrorMsg, setPwdErrorMsg] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Real-time Community & Partner Data
  const [communityPlayer, setCommunityPlayer] = useState<CommunityPlayer | null>(() => {
    return communityService.getPlayers().find(p => p.id === currentUser.id || p.email?.toLowerCase() === currentUser.email.toLowerCase()) || null;
  });
  const [partners, setPartners] = useState<CommunityPlayer[]>(() => partnerService.getPartners(currentUser));
  const [insights, setInsights] = useState(() => communityService.getUserDuoInsights(currentUser.name));
  const [referralStats, setReferralStats] = useState(() => referralService.getStatsForInviter(currentUser.id));
  const [allPlatformReferrals, setAllPlatformReferrals] = useState(() => referralService.getAllReferrals());
  const [topReferrers, setTopReferrers] = useState(() => referralService.getTopReferrers());

  // Privacy & Chat Modals State
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [selectedChatPartner, setSelectedChatPartner] = useState<CommunityPlayer | null>(null);

  const isAdmin = currentUser.email?.toLowerCase() === 'mariolabbes@gmail.com' || currentUser.email?.toLowerCase().includes('admin');

  useEffect(() => {
    // If external currentUser updates (e.g. from cloud Firestore sync) and local fields haven't been edited
    setName(prev => (prev === baseline.name ? (currentUser.name || '') : prev));
    setPhone(prev => (prev === baseline.phone ? (currentUser.phone || '') : prev));
    setFavoritePosition(prev => (prev === baseline.favoritePosition ? (currentUser.favoritePosition || 'ambas') : prev));
    setDominantHand(prev => (prev === baseline.dominantHand ? (currentUser.dominantHand || 'diestro') : prev));
    setCategory(prev => (prev === baseline.category ? (currentUser.category || '4ta') : prev));
    setCity(prev => (prev === baseline.city ? (currentUser.city || 'La Serena') : prev));
    setPreferredClub(prev => (prev === baseline.club ? (currentUser.club || '') : prev));
    setAvatar(prev => (prev === baseline.avatar ? (currentUser.avatar || '') : prev));
    setBaseline({
      name: currentUser.name || '',
      phone: currentUser.phone || '',
      favoritePosition: currentUser.favoritePosition || 'ambas',
      dominantHand: currentUser.dominantHand || 'diestro',
      category: currentUser.category || '4ta',
      city: currentUser.city || 'La Serena',
      club: currentUser.club || '',
      avatar: currentUser.avatar || ''
    });
  }, [currentUser]);

  useEffect(() => {
    const unsubTheme = themeService.subscribe(setTheme);
    const unsubCommunity = communityService.subscribe(() => {
      const p = communityService.getPlayers().find(pl => pl.id === currentUser.id || pl.email?.toLowerCase() === currentUser.email.toLowerCase()) || null;
      setCommunityPlayer(p);
      setInsights(communityService.getUserDuoInsights(currentUser.name));
    });
    const unsubPartners = partnerService.subscribe(() => {
      setPartners(partnerService.getPartners(currentUser));
    });
    const unsubReferrals = referralService.subscribe(() => {
      setReferralStats(referralService.getStatsForInviter(currentUser.id));
      setAllPlatformReferrals(referralService.getAllReferrals());
      setTopReferrers(referralService.getTopReferrers());
    });

    return () => {
      unsubTheme();
      unsubCommunity();
      unsubPartners();
      unsubReferrals();
    };
  }, [currentUser]);

  // Detected Modifications Calculation
  interface DetectedChange {
    label: string;
    oldVal: string;
    newVal: string;
  }

  const detectedChanges: DetectedChange[] = [];
  if (name.trim() !== baseline.name.trim()) {
    detectedChanges.push({
      label: 'Nombre Completo',
      oldVal: baseline.name || 'Sin nombre',
      newVal: name.trim()
    });
  }
  if (phone.trim() !== baseline.phone.trim()) {
    detectedChanges.push({
      label: 'Teléfono / WhatsApp',
      oldVal: baseline.phone || 'Sin registrar',
      newVal: phone.trim() || 'Sin registrar'
    });
  }
  if (favoritePosition !== baseline.favoritePosition) {
    const posMap: Record<string, string> = { drive: 'Drive (Derecha)', reves: 'Revés (Izquierda)', ambas: 'Ambas' };
    detectedChanges.push({
      label: 'Posición en Cancha',
      oldVal: posMap[baseline.favoritePosition] || baseline.favoritePosition,
      newVal: posMap[favoritePosition] || favoritePosition
    });
  }
  if (dominantHand !== baseline.dominantHand) {
    const handMap: Record<string, string> = { diestro: 'Diestro 🎾', zurdo: 'Zurdo ⭐' };
    detectedChanges.push({
      label: 'Mano Dominante',
      oldVal: handMap[baseline.dominantHand] || baseline.dominantHand,
      newVal: handMap[dominantHand] || dominantHand
    });
  }
  if (category !== baseline.category) {
    detectedChanges.push({
      label: 'Categoría de Referencia',
      oldVal: `${baseline.category} Cat`,
      newVal: `${category} Cat`
    });
  }
  if (city.trim() !== baseline.city.trim()) {
    detectedChanges.push({
      label: 'Ciudad de Circuito',
      oldVal: baseline.city || 'Sin registrar',
      newVal: city.trim() || 'Sin registrar'
    });
  }
  if (preferredClub.trim() !== baseline.club.trim()) {
    detectedChanges.push({
      label: 'Club Preferido',
      oldVal: baseline.club || 'Sin club',
      newVal: preferredClub.trim() || 'Sin club'
    });
  }
  if (avatar.trim() !== baseline.avatar.trim()) {
    detectedChanges.push({
      label: 'Foto / Avatar',
      oldVal: baseline.avatar ? (isImageAvatar(baseline.avatar) ? 'Foto guardada previa' : `Avatar ${baseline.avatar}`) : 'Iniciales',
      newVal: avatar.trim() ? (isImageAvatar(avatar) ? 'Nueva foto 1:1 optimizada' : `Avatar ${avatar.trim()}`) : 'Iniciales'
    });
  }

  const hasChanges = detectedChanges.length > 0;

  const currentElo = communityPlayer?.elo || currentUser.elo || DEFAULT_INITIAL_ELO;
  const eloTier = getEloTier(currentElo);

  // Next Tier calculation
  const nextTierMin = eloTier.tier === 'amateur' ? 1150 :
    eloTier.tier === 'intermedio' ? 1350 :
    eloTier.tier === 'avanzado' ? 1600 :
    eloTier.tier === 'competicion' ? 1850 : 2500;
  
  const currentTierMin = eloTier.minElo;
  const progressPercent = Math.min(100, Math.max(5, Math.round(((currentElo - currentTierMin) / (nextTierMin - currentTierMin)) * 100)));

  // Matches stats
  const matchesPlayed = communityPlayer?.matchesPlayed || 0;
  const matchesWon = communityPlayer?.matchesWon || 0;
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const winStreak = communityPlayer?.winStreak || 0;
  const goldenPlayed = communityPlayer?.goldenPointsPlayed || 0;
  const goldenWon = communityPlayer?.goldenPointsWon || 0;
  const goldenRate = goldenPlayed > 0 ? Math.round((goldenWon / goldenPlayed) * 100) : 0;
  const tieBreaksPlayed = communityPlayer?.tieBreaksPlayed || 0;
  const tieBreaksWon = communityPlayer?.tieBreaksWon || 0;

  // Step 1: User clicks Guardar -> Prompt confirmation if changes detected
  const handleInitiateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSaving) return;
    if (!name.trim()) {
      setSaveErrorMsg('El nombre es obligatorio.');
      return;
    }
    setSaveErrorMsg(null);
    setIsConfirmModalOpen(true);
  };

  // Step 2: User confirms in Modal -> Execute update and feedback
  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const res = await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        favoritePosition,
        dominantHand,
        category,
        city: city.trim() || undefined,
        club: preferredClub.trim() || undefined,
        avatar: avatar.trim() || undefined
      });

      if (res.success) {
        setBaseline({
          name: name.trim(),
          phone: phone.trim(),
          favoritePosition,
          dominantHand,
          category,
          city: city.trim(),
          club: preferredClub.trim(),
          avatar: avatar.trim()
        });
        setIsConfirmModalOpen(false);
        setSaveSuccessMsg('¡Cambios guardados con éxito! Tu ficha oficial ha sido actualizada.');
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      } else {
        setSaveErrorMsg('No se pudo guardar la información.');
      }
    } catch {
      setSaveErrorMsg('Error inesperado al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErrorMsg(null);
    setPwdSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdErrorMsg('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (newPassword.length < 4) {
      setPwdErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsChangingPwd(true);

    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPwdSuccessMsg('¡Contraseña actualizada exitosamente!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdSuccessMsg(null), 4000);
      } else {
        setPwdErrorMsg(res.error || 'No fue posible cambiar la contraseña.');
      }
    } catch {
      setPwdErrorMsg('Ocurrió un error al actualizar la contraseña.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Top Header Bar */}
      <header style={headerBarStyle} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            onClick={onBack} 
            style={backBtnStyle}
            title="Volver al panel"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-gold" style={{ fontSize: '0.68rem', fontWeight: 900 }}>
                PERFIL INTEGRAL
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ficha Oficial de Jugador
              </span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '2px 0 0', color: 'var(--text-main)' }}>
              {currentUser.name}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            style={themeBtnStyle}
            title={theme === 'day' ? 'Modo Noche' : 'Modo Día'}
          >
            {theme === 'day' ? <Sun size={16} color="var(--gold-primary)" /> : <Moon size={16} color="var(--team2-primary)" />}
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={logoutSmallBtn}
              title="Cerrar sesión"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={mainContentStyle}>
        {/* Athlete Overview Card */}
        <section style={athleteHeroCard} className="glass-panel apple-card">
          <div style={heroGrid}>
            {/* Avatar & Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                ...avatarWrapperStyle,
                borderColor: eloTier.color,
                boxShadow: `0 0 20px ${eloTier.color}33`
              }}>
                {avatar ? (
                  isImageAvatar(avatar) ? (
                    <img src={avatar} alt={currentUser.name} style={avatarImgStyle} />
                  ) : (
                    <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{avatar}</span>
                  )
                ) : (
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    {currentUser.name}
                  </h2>
                  <span style={{
                    ...tierBadgeStyle,
                    background: `${eloTier.color}22`,
                    borderColor: eloTier.color,
                    color: eloTier.color
                  }}>
                    {eloTier.badge}
                  </span>
                  {dominantHand === 'zurdo' && (
                    <span style={zurdoBadgeStyle}>
                      ⭐ ZURDO
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>{currentUser.email}</span>
                  {phone && <span>• 📲 {phone}</span>}
                  <span>• 📍 {city}</span>
                  {preferredClub && <span>• 🏟️ {preferredClub}</span>}
                </div>

                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-team1" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                    Posición: {favoritePosition.toUpperCase()}
                  </span>
                  <span className="badge badge-team2" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                    Ref: {category} Cat
                  </span>
                </div>
              </div>
            </div>

            {/* ELO & Tier Progress Box */}
            <div style={eloBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  RATING ELO OFICIAL
                </span>
                <span style={{ fontSize: '0.75rem', color: eloTier.color, fontWeight: 800 }}>
                  {eloTier.label}
                </span>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)', lineHeight: 1 }}>
                {currentElo} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>pts</span>
              </div>

              {/* Progress bar to next tier */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                  <span>Tier actual: {eloTier.label}</span>
                  <span>Meta: {nextTierMin} pts</span>
                </div>
                <div style={progressBarContainer}>
                  <div style={{
                    ...progressBarFill,
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${eloTier.color}, var(--gold-primary))`
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div style={metricsStripStyle}>
            <div style={metricItem}>
              <div style={metricValue}>{matchesPlayed}</div>
              <div style={metricLabel}>Partidos Jugados</div>
            </div>
            <div style={metricItem}>
              <div style={{ ...metricValue, color: 'var(--team1-primary)' }}>{matchesWon}</div>
              <div style={metricLabel}>Victorias</div>
            </div>
            <div style={metricItem}>
              <div style={{ ...metricValue, color: 'var(--gold-primary)' }}>{winRate}%</div>
              <div style={metricLabel}>% Efectividad</div>
            </div>
            <div style={metricItem}>
              <div style={{ ...metricValue, color: '#00b0ff' }}>{winStreak} 🔥</div>
              <div style={metricLabel}>Racha Actual</div>
            </div>
            <div style={metricItem}>
              <div style={{ ...metricValue, color: 'var(--team2-primary)' }}>
                {goldenWon}/{goldenPlayed} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>({goldenRate}%)</span>
              </div>
              <div style={metricLabel}>Punto de Oro (Clutch)</div>
            </div>
            <div style={metricItem}>
              <div style={{ ...metricValue, color: '#f59e0b' }}>
                {tieBreaksWon}/{tieBreaksPlayed}
              </div>
              <div style={metricLabel}>Tie-Breaks Ganados</div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav style={tabsNavStyle}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              ...tabBtnStyle,
              borderBottomColor: activeTab === 'profile' ? 'var(--team1-primary)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--team1-primary)' : 'var(--text-muted)'
            }}
          >
            <User size={16} />
            <span>Datos & Configuración</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            style={{
              ...tabBtnStyle,
              borderBottomColor: activeTab === 'insights' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'insights' ? 'var(--gold-primary)' : 'var(--text-muted)'
            }}
          >
            <Target size={16} />
            <span>Sinergia & Rivalidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            style={{
              ...tabBtnStyle,
              borderBottomColor: activeTab === 'partners' ? '#00e5ff' : 'transparent',
              color: activeTab === 'partners' ? '#00e5ff' : 'var(--text-muted)'
            }}
          >
            <Users size={16} />
            <span>Mis Partners ({partners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              ...tabBtnStyle,
              borderBottomColor: activeTab === 'security' ? '#ff5252' : 'transparent',
              color: activeTab === 'security' ? '#ff5252' : 'var(--text-muted)'
            }}
          >
            <ShieldCheck size={16} />
            <span>Seguridad & Privacidad</span>
          </button>
        </nav>

        {/* TAB 1: DATOS & CONFIGURACIÓN */}
        {activeTab === 'profile' && (
          <form onSubmit={handleInitiateSave} style={tabCardStyle} className="glass-panel apple-card">
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--team1-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Edición de Perfil y Preferencias de Cancha
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Ajusta tu posición en pista, mano hábil, ciudad y club de preferencia para convocatorias y emparejamientos.
              </p>
            </div>

            {saveSuccessMsg && (
              <div style={successBanner}>
                <CheckCircle2 size={18} color="var(--team1-primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>¡Cambios guardados con éxito!</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Tu ficha técnica ha sido actualizada en la base central.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveSuccessMsg(null)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
                  aria-label="Cerrar notificación"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {saveErrorMsg && (
              <div style={errorBanner}>
                <AlertCircle size={16} />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            <div style={formGrid}>
              {/* Nombre */}
              <div style={fieldGroup}>
                <label style={labelStyle}>
                  Nombre Completo <span style={{ color: 'var(--team1-primary)' }}>*</span>
                </label>
                <div style={inputWrapper}>
                  <User size={16} color="var(--text-muted)" style={inputIcon} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Teléfono / WhatsApp */}
              <div style={fieldGroup}>
                <label style={labelStyle}>Teléfono / WhatsApp</label>
                <div style={inputWrapper}>
                  <Phone size={16} color="var(--text-muted)" style={inputIcon} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Posición en Cancha */}
              <div style={fieldGroup}>
                <label style={labelStyle}>Posición Favorita en Cancha</label>
                <div style={segmentedControl}>
                  <button
                    type="button"
                    onClick={() => setFavoritePosition('drive')}
                    style={{
                      ...segmentBtn,
                      background: favoritePosition === 'drive' ? 'var(--team1-primary)' : 'transparent',
                      color: favoritePosition === 'drive' ? '#070a10' : 'var(--text-muted)',
                      fontWeight: favoritePosition === 'drive' ? 900 : 600
                    }}
                  >
                    🎾 DRIVE (Derecha)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFavoritePosition('reves')}
                    style={{
                      ...segmentBtn,
                      background: favoritePosition === 'reves' ? 'var(--team1-primary)' : 'transparent',
                      color: favoritePosition === 'reves' ? '#070a10' : 'var(--text-muted)',
                      fontWeight: favoritePosition === 'reves' ? 900 : 600
                    }}
                  >
                    🎾 REVÉS (Izquierda)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFavoritePosition('ambas')}
                    style={{
                      ...segmentBtn,
                      background: favoritePosition === 'ambas' ? 'var(--team1-primary)' : 'transparent',
                      color: favoritePosition === 'ambas' ? '#070a10' : 'var(--text-muted)',
                      fontWeight: favoritePosition === 'ambas' ? 900 : 600
                    }}
                  >
                    🔄 AMBAS
                  </button>
                </div>
              </div>

              {/* Mano Dominante */}
              <div style={fieldGroup}>
                <label style={labelStyle}>Mano Dominante</label>
                <div style={segmentedControl}>
                  <button
                    type="button"
                    onClick={() => setDominantHand('diestro')}
                    style={{
                      ...segmentBtn,
                      background: dominantHand === 'diestro' ? 'var(--gold-primary)' : 'transparent',
                      color: dominantHand === 'diestro' ? '#070a10' : 'var(--text-muted)',
                      fontWeight: dominantHand === 'diestro' ? 900 : 600
                    }}
                  >
                    ✋ DIESTRO
                  </button>
                  <button
                    type="button"
                    onClick={() => setDominantHand('zurdo')}
                    style={{
                      ...segmentBtn,
                      background: dominantHand === 'zurdo' ? 'var(--gold-primary)' : 'transparent',
                      color: dominantHand === 'zurdo' ? '#070a10' : 'var(--text-muted)',
                      fontWeight: dominantHand === 'zurdo' ? 900 : 600
                    }}
                  >
                    🤚 ZURDO ⭐
                  </button>
                </div>
              </div>

              {/* Categoría Referencial */}
              <div style={fieldGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={labelStyle}>Categoría Deportiva de Referencia</label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Autodeclarada</span>
                </div>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as PlayerCategory)}
                  style={selectStyle}
                >
                  <option value="1ra">1ra Categoría (Profesional / Élite)</option>
                  <option value="2da">2da Categoría (Competición Avanzada)</option>
                  <option value="3ra">3ra Categoría (Avanzado)</option>
                  <option value="4ta">4ta Categoría (Intermedio Alto)</option>
                  <option value="5ta">5ta Categoría (Intermedio)</option>
                  <option value="6ta">6ta Categoría (Iniciación Competitiva)</option>
                  <option value="7ma">7ma Categoría (Iniciación Recreativa)</option>
                  <option value="Iniciación">Iniciación / Aprendiz</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  ℹ️ Esta categoría es una referencia social. El ranking competitivo oficial y las tablas de posiciones se calculan exclusivamente mediante tu puntaje ELO universal.
                </div>
              </div>

              {/* Ciudad de Residencia / Circuito */}
              <div style={fieldGroup}>
                <label style={labelStyle}>Ciudad de Circuito Habitual</label>
                <div style={inputWrapper}>
                  <MapPin size={16} color="var(--text-muted)" style={inputIcon} />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ej. La Serena, Coquimbo, Santiago..."
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {['La Serena', 'Coquimbo', 'Santiago'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      style={{
                        ...cityChipBtn,
                        background: city === c ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: city === c ? 'var(--team1-primary)' : 'var(--text-muted)',
                        borderColor: city === c ? 'var(--team1-primary)' : 'transparent'
                      }}
                    >
                      📍 {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Club Preferido */}
              <div style={{ ...fieldGroup, gridColumn: '1 / -1' }}>
                <ClubSelectCombobox
                  label="Club de Pádel Preferido"
                  placeholder="Selecciona o busca tu club de cabecera..."
                  value={preferredClub}
                  onChange={(clubName) => setPreferredClub(clubName)}
                />
              </div>

              {/* Avatar Selector */}
              <div style={{ ...fieldGroup, gridColumn: '1 / -1' }}>
                <AvatarSelector
                  value={avatar}
                  onChange={(newAvatar) => setAvatar(newAvatar)}
                  type="player"
                  fallbackLetter={currentUser.name.charAt(0) || 'P'}
                  label="Foto o Avatar del Jugador"
                />
              </div>
            </div>

            <div style={formFooterStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                {hasChanges ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={changesBadgeStyle}>
                      {detectedChanges.length}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--team1-primary)', fontWeight: 700 }}>
                      {detectedChanges.length === 1 ? '1 cambio pendiente de guardar' : `${detectedChanges.length} cambios pendientes de guardar`}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="var(--team1-primary)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Ficha al día (sin modificaciones)
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  title={hasChanges ? "Haz clic para guardar las modificaciones a tu ficha" : "No has realizado cambios en la ficha"}
                  style={{
                    ...saveBtnStyle,
                    ...(hasChanges
                      ? {
                          background: 'linear-gradient(135deg, var(--team1-primary), #00b0ff)',
                          color: '#070a10',
                          boxShadow: '0 4px 18px rgba(0, 230, 118, 0.35)',
                          cursor: 'pointer',
                          opacity: isSaving ? 0.7 : 1
                        }
                      : {
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-dim)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: 'none',
                          cursor: 'not-allowed',
                          opacity: 0.55
                        })
                  }}
                >
                  {hasChanges ? <Save size={16} /> : <Check size={16} />}
                  <span>
                    {isSaving
                      ? 'Guardando cambios...'
                      : hasChanges
                        ? 'GUARDAR FICHA DE JUGADOR'
                        : 'GUARDAR FICHA DE JUGADOR'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: SINERGIA & RIVALIDAD (HEAD-TO-HEAD INSIGHTS) */}
        {activeTab === 'insights' && (
          <div style={tabCardStyle} className="glass-panel apple-card">
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={18} color="var(--gold-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Inteligencia de Duplas y Análisis de Rivalidad
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Algoritmo de rendimiento en cancha basado en el histórico de todos tus partidos oficiales finalizados.
              </p>
            </div>

            <div style={insightsGrid}>
              {/* Card 1: Pareja Más Eficiente */}
              <div style={insightCard} className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ ...insightIconBg, background: 'rgba(0, 230, 118, 0.15)', color: 'var(--team1-primary)' }}>
                      <Users size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--team1-primary)', letterSpacing: '0.05em' }}>
                        MÁXIMA QUÍMICA
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        Pareja Más Eficiente
                      </h4>
                    </div>
                  </div>
                  <Sparkles size={20} color="var(--team1-primary)" />
                </div>

                {insights.bestPartner ? (() => {
                  const bpPlayer = communityService.getPlayers().find(pl => pl.name.toLowerCase() === insights.bestPartner!.name.toLowerCase());
                  return (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ ...partnerAvatarStyle, overflow: 'hidden' }}>
                          {bpPlayer?.avatar ? (
                            isImageAvatar(bpPlayer.avatar) ? (
                              <img src={bpPlayer.avatar} alt={insights.bestPartner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{bpPlayer.avatar}</span>
                            )
                          ) : (
                            insights.bestPartner.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                          {insights.bestPartner.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tu dupla de mayor efectividad en pista
                        </div>
                      </div>
                    </div>

                    <div style={insightMetricsGrid}>
                      <div style={insightMetricBox}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--team1-primary)', fontFamily: 'var(--font-mono)' }}>
                          {insights.bestPartner.winRate}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          EFECTIVIDAD JUNTOS
                        </div>
                      </div>

                      <div style={insightMetricBox}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>
                          {insights.bestPartner.matchesWon}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          VICTORIAS EN DUPLA
                        </div>
                      </div>

                      <div style={insightMetricBox}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                          {insights.bestPartner.matchesTogether}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          PARTIDOS JUGADOS
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                  <div style={emptyInsightState}>
                    <p style={{ margin: '14px 0 6px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      Aún no hay suficientes partidos registrados en dupla para calcular tu sinergia.
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      ¡Juega partidos en cancha con tus amigos y el algoritmo detectará automáticamente tu mejor química!
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: Pareja / Rival Némesis */}
              <div style={insightCard} className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ ...insightIconBg, background: 'rgba(255, 82, 82, 0.15)', color: '#ff5252' }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ff5252', letterSpacing: '0.05em' }}>
                        DESAFÍO COMPETITIVO
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        Rival / Pareja Némesis
                      </h4>
                    </div>
                  </div>
                  <Target size={20} color="#ff5252" />
                </div>

                {insights.nemesis || insights.nemesisDuo ? (() => {
                  const nemPlayer = !insights.nemesisDuo && insights.nemesis ? communityService.getPlayers().find(pl => pl.name.toLowerCase() === insights.nemesis!.name.toLowerCase()) : null;
                  return (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ ...partnerAvatarStyle, background: 'rgba(255, 82, 82, 0.2)', borderColor: '#ff5252', color: '#ff5252', overflow: 'hidden' }}>
                          {nemPlayer?.avatar ? (
                            isImageAvatar(nemPlayer.avatar) ? (
                              <img src={nemPlayer.avatar} alt={nemPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{nemPlayer.avatar}</span>
                            )
                          ) : (
                            (insights.nemesisDuo?.rivalNames || insights.nemesis?.name || '?').charAt(0).toUpperCase()
                          )}
                        </div>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                          {insights.nemesisDuo?.rivalNames || insights.nemesis?.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {insights.nemesisDuo ? 'Dupla rival que más se te dificulta' : 'Rival individual con mayor índice de victorias frente a ti'}
                        </div>
                      </div>
                    </div>

                    <div style={insightMetricsGrid}>
                      <div style={insightMetricBox}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ff5252', fontFamily: 'var(--font-mono)' }}>
                          {insights.nemesisDuo?.lossRate || insights.nemesis?.lossRate}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          TASA DE DIFICULTAD
                        </div>
                      </div>

                      <div style={insightMetricBox}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ff8a80', fontFamily: 'var(--font-mono)' }}>
                          {insights.nemesisDuo?.matchesLost || insights.nemesis?.matchesLost}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          DERROTAS FRENTE A ELLOS
                        </div>
                      </div>

                      <div style={insightMetricBox}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                          {insights.nemesisDuo?.matchesAgainst || insights.nemesis?.matchesAgainst}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          DUELOS DISPUTADOS
                        </div>
                      </div>
                    </div>
                    </div>
                  );
                })() : (
                  <div style={emptyInsightState}>
                    <p style={{ margin: '14px 0 6px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      ¡Invicto o sin rivales recurrentes registrados!
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Continúa jugando partidos en el circuito para registrar las estadísticas contra tus adversarios directos.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MIS PARTNERS */}
        {activeTab === 'partners' && (
          <div style={tabCardStyle} className="glass-panel apple-card">
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#00e5ff" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Red de Partners Conectados ({partners.length})
                  </h3>
                </div>

                {onNavigateToView && (
                  <button
                    type="button"
                    onClick={() => onNavigateToView('community')}
                    style={actionLinkBtn}
                  >
                    + Buscar Jugadores en Ranking
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Jugadores de confianza para convocar rápidamente a partidos cerrados o en grupos.
              </p>
            </div>

            {partners.length > 0 ? (
              <div style={partnersGrid}>
                {partners.map(p => {
                  const pTier = getEloTier(p.elo);
                  return (
                    <div key={p.id} style={partnerCard} className="glass-panel">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          ...partnerMiniAvatar,
                          borderColor: pTier.color,
                          overflow: 'hidden'
                        }}>
                          {p.avatar ? (
                            isImageAvatar(p.avatar) ? (
                              <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{p.avatar}</span>
                            )
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              {p.name}
                            </span>
                            {p.dominantHand === 'zurdo' && (
                              <span style={{ fontSize: '0.6rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                                ⭐ ZURDO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span>{p.category} Cat</span>
                            <span>•</span>
                            <span style={{ color: pTier.color, fontWeight: 700 }}>{pTier.badge}</span>
                            <span>•</span>
                            <span style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>{p.elo} pts</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        <span>📍 {p.city || 'Chile'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedChatPartner(p)}
                            style={{
                              background: 'rgba(0, 230, 118, 0.12)',
                              border: '1px solid rgba(0, 230, 118, 0.3)',
                              color: '#00E676',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            title={`Abrir chat con ${p.name}`}
                          >
                            <MessageSquare size={12} />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <Users size={40} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Aún no tienes partners en tu red
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '8px auto 16px' }}>
                  Conecta con tus amigos de pádel para armar partidos en 1 toque y comparar sinergias.
                </p>
                {onNavigateToView && (
                  <button
                    type="button"
                    onClick={() => onNavigateToView('community')}
                    style={saveBtnStyle}
                  >
                    Explorar Jugadores en Comunidad
                  </button>
                )}
              </div>
            )}

            {/* SUB-SECCIÓN: JUGADORES QUE SE SUMARON CON TU INVITACIÓN */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="var(--gold-primary)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Amigos sumados con tu Invitación ({referralStats.totalInvited})
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: 'rgba(255, 215, 0, 0.12)', 
                    border: '1px solid rgba(255, 215, 0, 0.3)', 
                    color: 'var(--gold-primary)', 
                    fontWeight: 800 
                  }}>
                    ⭐ {referralStats.proSubscribedCount} en Plan PRO
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                Jugadores de tu círculo que se registraron a través de tus invitaciones de WhatsApp.
              </p>

              {referralStats.totalInvited > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {referralStats.referrals.map(ref => (
                    <div key={ref.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {ref.referredUserName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Registrado el {new Date(ref.registeredAt).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                      <div>
                        {ref.hasSubscribedPro ? (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(0, 230, 118, 0.15)',
                            border: '1px solid var(--team1-primary)',
                            color: 'var(--team1-primary)'
                          }}>
                            ⭐ Plan PRO
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)'
                          }}>
                            Plan Gratuito
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-subtle)',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  Aún no tienes amigos registrados con tu enlace directo. Cuando invites a tus compañeros de pádel por WhatsApp, quedarán enlazados aquí automáticamente.
                </div>
              )}
            </div>

            {/* SECCIÓN EXCLUSIVA ADMIN (MARIO LABBÉ) */}
            {isAdmin && (
              <div style={{ 
                marginTop: '28px', 
                padding: '18px', 
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.06), rgba(0, 229, 255, 0.03))', 
                borderRadius: '14px', 
                border: '1px solid rgba(255, 215, 0, 0.25)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <TrendingUp size={20} color="var(--gold-primary)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    Métricas de Red & Adquisición Orgánica (Vista Fundador)
                  </h4>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                  Monitoreo de tracción en vivo de tu red de cercanos previa al lanzamiento de campañas comerciales con clubes y tiendas.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00e5ff', fontFamily: 'var(--font-mono)' }}>
                      {allPlatformReferrals.length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Usuarios por Recomendación
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>
                      {allPlatformReferrals.filter(r => r.hasSubscribedPro).length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Conversiones a Plan PRO
                    </div>
                  </div>
                </div>

                {topReferrers.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                      🏆 Top Jugadores con más Invitados Registrados:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {topReferrers.slice(0, 5).map((top, idx) => (
                        <div key={top.inviterId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.25)',
                          borderRadius: '8px',
                          fontSize: '0.78rem'
                        }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>
                            #{idx + 1} {top.inviterName}
                          </span>
                          <span style={{ color: 'var(--text-dim)' }}>
                            <strong style={{ color: '#00e5ff' }}>{top.totalInvited}</strong> invitados • <strong style={{ color: 'var(--gold-primary)' }}>{top.proSubscribedCount}</strong> PRO
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onNavigateToView && (
                  <button
                    type="button"
                    onClick={() => onNavigateToView('admin')}
                    style={{
                      width: '100%',
                      marginTop: '14px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--gold-primary), #ffb300)',
                      border: 'none',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Abrir Panel de Control & Administración General ⚙️</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SEGURIDAD & PRIVACIDAD */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tarjeta de Gobernanza & Privacidad */}
            <div style={tabCardStyle} className="glass-panel apple-card">
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="var(--team1-primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Gobernanza y Privacidad de Datos
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Define con precisión qué información compartes con tus Partners y con la comunidad general.
                </p>
              </div>

              <div style={{ padding: '16px 0 4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(0, 230, 118, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(0, 230, 118, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ShieldCheck size={22} color="var(--team1-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                        Centro de Configuración de Privacidad
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Teléfono, Progreso ELO, Fichas de Partidos y Presencia en Cancha
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    style={{
                      padding: '9px 18px',
                      background: 'linear-gradient(135deg, var(--team1-primary), #00b0ff)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#070a10',
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0, 230, 118, 0.25)'
                    }}
                  >
                    ⚙️ Gestionar Privacidad
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={tabCardStyle} className="glass-panel apple-card">
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#ff5252" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Cambiar Contraseña de Acceso
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Actualiza tu clave de acceso. Se sincronizará inmediatamente en tu dispositivo y en la base central segura.
                </p>
              </div>

            {pwdSuccessMsg && (
              <div style={successBanner}>
                <CheckCircle2 size={16} />
                <span>{pwdSuccessMsg}</span>
              </div>
            )}
            {pwdErrorMsg && (
              <div style={errorBanner}>
                <AlertCircle size={16} />
                <span>{pwdErrorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px', marginTop: '16px' }}>
              <div style={fieldGroup}>
                <label style={labelStyle}>Contraseña Actual</label>
                <div style={inputWrapper}>
                  <Lock size={16} color="var(--text-muted)" style={inputIcon} />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu clave actual"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Nueva Contraseña (mínimo 4 caracteres)</label>
                <div style={inputWrapper}>
                  <Lock size={16} color="var(--text-muted)" style={inputIcon} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva clave"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Confirmar Nueva Contraseña</label>
                <div style={inputWrapper}>
                  <Lock size={16} color="var(--text-muted)" style={inputIcon} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva clave"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isChangingPwd}
                  style={{
                    ...saveBtnStyle,
                    background: 'linear-gradient(135deg, #ff5252, #d32f2f)',
                    opacity: isChangingPwd ? 0.7 : 1
                  }}
                >
                  <Lock size={16} />
                  <span>{isChangingPwd ? 'Actualizando contraseña...' : 'Actualizar Contraseña'}</span>
                </button>
              </div>
            </div>
          </form>
          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN: ¿DESEAS GUARDAR LOS CAMBIOS? */}
      {isConfirmModalOpen && (
        <div 
          style={modalBackdropStyle}
          onClick={() => !isSaving && setIsConfirmModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-save-title"
        >
          <div 
            style={confirmModalStyle} 
            className="glass-panel apple-card"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={modalIconCircle}>
                  <HelpCircle size={22} color="var(--team1-primary)" />
                </div>
                <div>
                  <h3 id="confirm-save-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    ¿Deseas guardar los cambios?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Se actualizará tu ficha de jugador oficial en el sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setIsConfirmModalOpen(false)}
                style={modalCloseBtnStyle}
                aria-label="Cerrar modal"
                disabled={isSaving}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Changes preview */}
            <div style={modalBodyStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Modificaciones detectadas ({detectedChanges.length})
              </div>

              <div style={changesListBox}>
                {detectedChanges.map((change, idx) => (
                  <div key={idx} style={changeItemStyle}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {change.label}
                    </div>
                    <div style={changeValuesRow}>
                      <span style={oldValueBadge} title="Valor previo">
                        {change.oldVal}
                      </span>
                      <span style={{ color: 'var(--team1-primary)', fontSize: '0.82rem', fontWeight: 900 }}>➔</span>
                      <span style={newValueBadge} title="Nuevo valor">
                        {change.newVal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ margin: '14px 0 0', fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.45 }}>
                Al confirmar, tus datos se sincronizarán inmediatamente en la base de datos de la comunidad y en tus dispositivos.
              </p>
            </div>

            {/* Modal Footer */}
            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSaving}
                style={modalCancelBtnStyle}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                style={modalConfirmBtnStyle}
              >
                {isSaving ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Sí, Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRIVACIDAD */}
      {isPrivacyModalOpen && (
        <PrivacySettingsModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* MODAL DE CHAT DIRECTO ENTRE PARTNERS */}
      {selectedChatPartner && (
        <PartnerChatModal
          isOpen={!!selectedChatPartner}
          onClose={() => setSelectedChatPartner(null)}
          currentUser={currentUser}
          partner={selectedChatPartner}
        />
      )}
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-deep)',
  color: 'var(--text-main)',
  paddingBottom: '90px'
};

const headerBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  borderBottom: '1px solid var(--border-subtle)',
  position: 'sticky',
  top: 0,
  zIndex: 40
};

const backBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)',
  background: 'rgba(120, 120, 120, 0.08)',
  color: 'var(--text-main)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const themeBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const logoutSmallBtn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 82, 82, 0.3)',
  background: 'rgba(255, 82, 82, 0.1)',
  color: '#ff5252',
  fontSize: '0.75rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const mainContentStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const athleteHeroCard: React.CSSProperties = {
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 23, 42, 0.65)'
};

const heroGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
  alignItems: 'center'
};

const avatarWrapperStyle: React.CSSProperties = {
  width: '76px',
  height: '76px',
  borderRadius: '50%',
  border: '3px solid var(--gold-primary)',
  background: 'rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0
};

const avatarImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const tierBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 900,
  padding: '3px 8px',
  borderRadius: '6px',
  border: '1px solid',
  letterSpacing: '0.02em'
};

const zurdoBadgeStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  background: 'rgba(255, 214, 0, 0.2)',
  color: 'var(--gold-primary)',
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: 900
};

const eloBoxStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: '12px',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.08)'
};

const progressBarContainer: React.CSSProperties = {
  height: '7px',
  borderRadius: '4px',
  background: 'rgba(255, 255, 255, 0.08)',
  overflow: 'hidden'
};

const progressBarFill: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.4s ease'
};

const metricsStripStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
  gap: '12px',
  marginTop: '20px',
  paddingTop: '18px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
};

const metricItem: React.CSSProperties = {
  textAlign: 'center',
  padding: '8px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.02)'
};

const metricValue: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 900,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-main)'
};

const metricLabel: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'var(--text-dim)',
  fontWeight: 700,
  marginTop: '2px'
};

const tabsNavStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  overflowX: 'auto',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  paddingBottom: '4px'
};

const tabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  fontSize: '0.85rem',
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const tabCardStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 23, 42, 0.65)'
};

const cardHeaderStyle: React.CSSProperties = {
  marginBottom: '20px',
  paddingBottom: '14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '18px'
};

const fieldGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--text-muted)'
};

const inputWrapper: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const inputIcon: React.CSSProperties = {
  position: 'absolute',
  left: '12px',
  pointerEvents: 'none'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px 11px 38px',
  borderRadius: '10px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: 'var(--text-main)',
  fontSize: '0.88rem'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '10px',
  background: 'rgba(10, 16, 28, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: 'var(--text-main)',
  fontSize: '0.88rem'
};

const segmentedControl: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  padding: '4px',
  borderRadius: '10px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)'
};

const segmentBtn: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '0.75rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center'
};

const cityChipBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid',
  fontSize: '0.72rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const formFooterStyle: React.CSSProperties = {
  marginTop: '24px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const saveBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, var(--team1-primary), #00b0ff)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.88rem',
  border: 'none',
  cursor: 'pointer'
};

const actionLinkBtn: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--team1-primary)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer'
};

const successBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '8px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  color: 'var(--team1-primary)',
  fontSize: '0.82rem',
  marginBottom: '16px'
};

const errorBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '8px',
  background: 'rgba(255, 82, 82, 0.15)',
  border: '1px solid rgba(255, 82, 82, 0.4)',
  color: '#ff5252',
  fontSize: '0.82rem',
  marginBottom: '16px'
};

const insightsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px'
};

const insightCard: React.CSSProperties = {
  padding: '20px',
  borderRadius: '14px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.25)'
};

const insightIconBg: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const partnerAvatarStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '2px solid var(--team1-primary)',
  background: 'rgba(0, 230, 118, 0.2)',
  color: 'var(--team1-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '1.1rem'
};

const insightMetricsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  marginTop: '16px',
  paddingTop: '14px',
  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
};

const insightMetricBox: React.CSSProperties = {
  textAlign: 'center'
};

const emptyInsightState: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 12px'
};

const partnersGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '14px'
};

const partnerCard: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.25)'
};

const partnerMiniAvatar: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  border: '2px solid',
  background: 'rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '0.95rem'
};

const changesBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '22px',
  height: '22px',
  padding: '0 6px',
  borderRadius: '11px',
  background: 'rgba(0, 230, 118, 0.2)',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  color: 'var(--team1-primary)',
  fontWeight: 900,
  fontSize: '0.74rem'
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 1000
};

const confirmModalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  borderRadius: '18px',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  background: 'linear-gradient(180deg, rgba(17, 27, 46, 0.96), rgba(10, 16, 28, 0.98))',
  boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 230, 118, 0.15)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
};

const modalIconCircle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const modalCloseBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const modalBodyStyle: React.CSSProperties = {
  padding: '20px'
};

const changesListBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: '230px',
  overflowY: 'auto',
  paddingRight: '4px'
};

const changeItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '10px 12px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.06)'
};

const changeValuesRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
};

const oldValueBadge: React.CSSProperties = {
  fontSize: '0.74rem',
  padding: '2px 8px',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--text-dim)',
  textDecoration: 'line-through'
};

const newValueBadge: React.CSSProperties = {
  fontSize: '0.74rem',
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: '6px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid rgba(0, 230, 118, 0.35)',
  color: 'var(--team1-primary)'
};

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '16px 20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.2)'
};

const modalCancelBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--text-main)',
  fontSize: '0.84rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const modalConfirmBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, var(--team1-primary), #00b0ff)',
  border: 'none',
  color: '#070a10',
  fontSize: '0.86rem',
  fontWeight: 900,
  boxShadow: '0 4px 16px rgba(0, 230, 118, 0.3)',
  cursor: 'pointer'
};
