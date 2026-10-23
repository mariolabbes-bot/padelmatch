import React, { useState } from 'react';
import type { ScheduledMatch } from '../types/padel';
import type { UserSession } from '../services/authService';
import { clubService } from '../services/clubService';
import { partnerService } from '../services/partnerService';
import { scheduleService } from '../services/scheduleService';
import { isImageAvatar } from '../utils/imageOptimizer';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  X, 
  Check, 
  Sparkles, 
  Share2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onMatchCreated?: (match: ScheduledMatch) => void;
}

export const ScheduleMatchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onMatchCreated
}) => {
  // Quick Date Helpers
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const getDayAfterTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  // Form State
  const [matchDate, setMatchDate] = useState<string>(getTomorrowStr());
  const [matchTime, setMatchTime] = useState<string>('20:00');
  const [selectedClub, setSelectedClub] = useState<string>(() => currentUser.club || 'Pádel 4 Esquinas');
  const [courtName, setCourtName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Custom Club Input
  const [isAddingCustomClub, setIsAddingCustomClub] = useState(false);
  const [customClubName, setCustomClubName] = useState('');

  // Selected Partners (up to 3)
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [createdMatch, setCreatedMatch] = useState<ScheduledMatch | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const partners = partnerService.getPartners(currentUser);
  const availableClubs = clubService.getClubs();

  if (!isOpen) return null;

  const handleTogglePartner = (partnerId: string) => {
    if (selectedPartnerIds.includes(partnerId)) {
      setSelectedPartnerIds(prev => prev.filter(id => id !== partnerId));
    } else {
      if (selectedPartnerIds.length >= 3) {
        setErrorMsg('Solo puedes invitar directamente hasta 3 partners (para completar los 4 cupos de la cancha).');
        setTimeout(() => setErrorMsg(null), 3500);
        return;
      }
      setSelectedPartnerIds(prev => [...prev, partnerId]);
    }
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalClubName = selectedClub;
    if (isAddingCustomClub && customClubName.trim()) {
      const added = clubService.addCustomClub(customClubName.trim(), currentUser.city || 'La Serena');
      finalClubName = added.name;
    }

    if (!finalClubName.trim()) {
      setErrorMsg('Por favor selecciona o ingresa el nombre de un club.');
      return;
    }

    if (!matchDate) {
      setErrorMsg('Por favor selecciona la fecha del partido.');
      return;
    }

    if (!matchTime) {
      setErrorMsg('Por favor selecciona la hora del partido.');
      return;
    }

    const invitedPartners = partners.filter(p => selectedPartnerIds.includes(p.id));

    try {
      const newMatch = scheduleService.createScheduledMatch(currentUser, {
        clubName: finalClubName,
        courtName: courtName.trim() || undefined,
        matchDate,
        matchTime,
        invitedPartners,
        notes: notes.trim() || undefined
      });

      setCreatedMatch(newMatch);
      if (onMatchCreated) {
        onMatchCreated(newMatch);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al programar el partido.');
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdMatch) return;
    const text = scheduleService.generateWhatsAppInviteText(createdMatch, currentUser.name);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCloseAndReset = () => {
    setCreatedMatch(null);
    setSelectedPartnerIds([]);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={handleCloseAndReset}>
      <div 
        style={modalCardStyle} 
        className="glass-panel apple-card" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={headerIconCircle}>
              <Calendar size={22} color="var(--team1-primary)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Programar Partido
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Convoca a tus partners y completa los 4 jugadores
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleCloseAndReset} 
            style={closeBtnStyle}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* If match was created: Success & WhatsApp Sharing View */}
        {createdMatch ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 230, 118, 0.15)',
              border: '2px solid var(--team1-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--team1-primary)'
            }}>
              <Check size={36} strokeWidth={3} />
            </div>

            <h4 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
              ¡Convocatoria Creada con Éxito! 🎾
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Se agendó tu partido para el <strong style={{ color: 'var(--text-main)' }}>{createdMatch.matchDate} a las {createdMatch.matchTime} hrs</strong> en <strong style={{ color: 'var(--team1-primary)' }}>{createdMatch.clubName}</strong>.
            </p>

            {/* Quorum Progress Pill */}
            <div style={summaryQuorumBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                <span>Quórum inicial</span>
                <span style={{ color: 'var(--team1-primary)' }}>
                  {createdMatch.slots.filter(s => s.status === 'confirmed').length} de 4 confirmados
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {createdMatch.slots.map((slot, idx) => (
                  <div 
                    key={slot.id} 
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      background: slot.status === 'confirmed' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: slot.status === 'confirmed' ? '1px solid var(--team1-primary)' : '1px dashed var(--border-subtle)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: slot.status === 'confirmed' ? 'var(--team1-primary)' : 'var(--text-dim)',
                      textAlign: 'center'
                    }}
                  >
                    {slot.isHost ? 'Tú (Host) ✅' : (slot.status === 'confirmed' ? slot.name.split(' ')[0] : `Cupo ${idx + 1} ⏳`)}
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={whatsappShareBtn}
              >
                <Share2 size={18} />
                <span>Invitar por WhatsApp con Link Directo</span>
              </button>

              <button
                type="button"
                onClick={handleCloseAndReset}
                style={doneBtnStyle}
              >
                Ver en mi Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Create Form */
          <form onSubmit={handleCreateMatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={errorAlertBox}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Fecha & Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>
                  <Calendar size={14} color="var(--team1-primary)" />
                  <span>Fecha del Partido</span>
                </label>
                <input 
                  type="date"
                  value={matchDate}
                  min={getTodayStr()}
                  onChange={e => setMatchDate(e.target.value)}
                  style={inputStyle}
                  required
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => setMatchDate(getTodayStr())}
                    style={{ ...quickChipBtn, borderColor: matchDate === getTodayStr() ? 'var(--team1-primary)' : undefined }}
                  >
                    Hoy
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMatchDate(getTomorrowStr())}
                    style={{ ...quickChipBtn, borderColor: matchDate === getTomorrowStr() ? 'var(--team1-primary)' : undefined }}
                  >
                    Mañana
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMatchDate(getDayAfterTomorrowStr())}
                    style={{ ...quickChipBtn, borderColor: matchDate === getDayAfterTomorrowStr() ? 'var(--team1-primary)' : undefined }}
                  >
                    +2 días
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  <Clock size={14} color="var(--team1-primary)" />
                  <span>Hora de Turno</span>
                </label>
                <input 
                  type="time"
                  value={matchTime}
                  onChange={e => setMatchTime(e.target.value)}
                  style={inputStyle}
                  required
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {['18:00', '19:30', '20:00', '21:30'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMatchTime(t)}
                      style={{ ...quickChipBtn, borderColor: matchTime === t ? 'var(--team1-primary)' : undefined }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Club y Cancha */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={labelStyle}>
                  <MapPin size={14} color="var(--team1-primary)" />
                  <span>Club de Pádel</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomClub(!isAddingCustomClub)}
                  style={textToggleBtn}
                >
                  {isAddingCustomClub ? 'Elegir de lista oficial' : '+ Otro club'}
                </button>
              </div>

              {isAddingCustomClub ? (
                <input 
                  type="text"
                  placeholder="Escribe el nombre del club o complejo..."
                  value={customClubName}
                  onChange={e => setCustomClubName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              ) : (
                <select
                  value={selectedClub}
                  onChange={e => setSelectedClub(e.target.value)}
                  style={selectStyle}
                  required
                >
                  {availableClubs.map(c => (
                    <option key={c.id} value={c.name} style={{ background: '#0e1422', color: '#fff' }}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              )}

              {/* Cancha opcional */}
              <input 
                type="text"
                placeholder="Cancha (opcional, ej. Cancha 1 Cristal)"
                value={courtName}
                onChange={e => setCourtName(e.target.value)}
                style={{ ...inputStyle, marginTop: '8px' }}
              />
            </div>

            {/* 3. Selección de Partners Invitados */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>
                  <Users size={14} color="var(--team1-primary)" />
                  <span>Invitar a tus Partners ({selectedPartnerIds.length}/3)</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {partners.length} conectados
                </span>
              </div>

              {partners.length > 0 ? (
                <div style={partnersPickerGrid}>
                  {partners.map(p => {
                    const isSelected = selectedPartnerIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleTogglePartner(p.id)}
                        style={{
                          ...partnerPickerItem,
                          borderColor: isSelected ? 'var(--team1-primary)' : 'var(--border-subtle)',
                          background: isSelected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.03)'
                        }}
                      >
                        <div style={partnerPickerAvatar}>
                          {p.avatar ? (
                            isImageAvatar(p.avatar) ? (
                              <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span>{p.avatar}</span>
                            )
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {p.category} Cat • ELO {p.elo}
                          </div>
                        </div>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--team1-primary)' : '1.5px solid var(--border-medium)',
                          background: isSelected ? 'var(--team1-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#070a10'
                        }}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={noPartnersNotice}>
                  <span>Aún no tienes partners conectados en la app. Podrás invitar a tus amigos directamente vía enlace de WhatsApp en el siguiente paso.</span>
                </div>
              )}
            </div>

            {/* 4. Notas opcionales */}
            <div>
              <label style={labelStyle}>
                <MessageSquare size={14} color="var(--team1-primary)" />
                <span>Notas o Comentarios (Opcional)</span>
              </label>
              <input 
                type="text"
                placeholder="Ej. Llevar pelotas nuevas, tercer tiempo en la terraza..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={submitBtnStyle}
            >
              <Sparkles size={18} />
              <span>Crear Convocatoria y Agendar Partido</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.82)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
};

const headerIconCircle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1.5px solid rgba(0, 230, 118, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'none',
  color: 'var(--text-muted)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.8rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300e676' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '16px'
};

const quickChipBtn: React.CSSProperties = {
  flex: 1,
  padding: '4px 6px',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  fontSize: '0.68rem',
  fontWeight: 800,
  cursor: 'pointer'
};

const textToggleBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--team1-primary)',
  fontSize: '0.74rem',
  fontWeight: 800,
  cursor: 'pointer',
  padding: 0
};

const partnersPickerGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
  gap: '8px',
  maxHeight: '180px',
  overflowY: 'auto',
  padding: '2px'
};

const partnerPickerItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 10px',
  borderRadius: '12px',
  border: '1.5px solid var(--border-subtle)',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const partnerPickerAvatar: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.85rem',
  fontWeight: 900,
  color: 'var(--team1-primary)',
  overflow: 'hidden',
  flexShrink: 0
};

const noPartnersNotice: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px dashed var(--border-subtle)',
  borderRadius: '12px',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  lineHeight: 1.4
};

const submitBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 900,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0, 230, 118, 0.3)',
  marginTop: '8px'
};

const whatsappShareBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px',
  background: '#25D366',
  color: '#ffffff',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 900,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)'
};

const doneBtnStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-medium)',
  borderRadius: '14px',
  fontWeight: 800,
  fontSize: '0.88rem',
  cursor: 'pointer'
};

const summaryQuorumBox: React.CSSProperties = {
  padding: '14px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '16px',
  maxWidth: '420px',
  margin: '0 auto'
};

const errorAlertBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(255, 82, 82, 0.15)',
  border: '1px solid #ff5252',
  color: '#ff5252',
  fontSize: '0.82rem',
  fontWeight: 700
};
