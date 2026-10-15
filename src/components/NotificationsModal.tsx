import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../types/padel';
import { 
  Bell, 
  BellRing, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Building2, 
  MapPin
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenMatchJoin?: (matchId: string) => void;
}

export const NotificationsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(() => notificationService.getPermission());
  const [activeFilter, setActiveFilter] = useState<'all' | 'open_match' | 'friend_invite' | 'club_offer'>('all');
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = notificationService.subscribe(setNotifications);
    setPermission(notificationService.getPermission());
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
  };

  const handleSendTestAlert = (type: 'open_match' | 'friend_invite' | 'club_offer') => {
    notificationService.sendTestAlert(type);
    setTestSentMsg('¡Notificación enviada a tu dispositivo!');
    setTimeout(() => setTestSentMsg(null), 3000);
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  return (
    <div style={overlayStyle}>
      <div style={modalCardStyle} className="glass-panel">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={bellIconBadge}>
              <BellRing size={20} color="var(--gold-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                Centro de Notificaciones & Partidos
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Partidos abiertos (falta 1), invitaciones y alertas de canchas
              </p>
            </div>
          </div>

          <button onClick={onClose} style={closeBtnStyle} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Permission Banner */}
        <div style={permissionBannerCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {permission === 'granted' ? (
                <>
                  <CheckCircle2 size={18} color="var(--team1-primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--team1-primary)' }}>
                    Notificaciones Push Activadas en este Teléfono
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} color="var(--gold-primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                    Activa las notificaciones para recibir alertas de "Falta 1"
                  </span>
                </>
              )}
            </div>

            {permission !== 'granted' ? (
              <button onClick={handleRequestPermission} style={enableNotifBtnStyle}>
                <Bell size={14} />
                <span>Activar Notificaciones</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => handleSendTestAlert('open_match')} 
                  style={testAlertBtnStyle}
                  title="Enviar prueba"
                >
                  <Send size={13} />
                  <span>Probar Alerta Real</span>
                </button>
              </div>
            )}
          </div>

          {testSentMsg && (
            <div style={{ fontSize: '0.75rem', color: 'var(--team1-primary)', fontWeight: 700, marginTop: '8px' }}>
              ✓ {testSentMsg}
            </div>
          )}
        </div>

        {/* Quick Simulator Buttons */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '10px 12px', margin: '14px 0', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
            🧪 Simular alertas en vivo para probar tu teléfono:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button 
              type="button" 
              onClick={() => handleSendTestAlert('open_match')} 
              style={simulatorBtnStyle}
            >
              🎾 Simular "Falta 1"
            </button>
            <button 
              type="button" 
              onClick={() => handleSendTestAlert('friend_invite')} 
              style={simulatorBtnStyle}
            >
              ✉️ Simular Invitación
            </button>
            <button 
              type="button" 
              onClick={() => handleSendTestAlert('club_offer')} 
              style={simulatorBtnStyle}
            >
              🔥 Simular Oferta Club
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'open_match', label: '🎾 Partidos Abiertos (Falta 1)' },
            { id: 'friend_invite', label: '✉️ Invitaciones' },
            { id: 'club_offer', label: '🏷️ Ofertas Clubes' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: activeFilter === f.id ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                color: activeFilter === f.id ? '#050c18' : 'var(--text-muted)',
                border: '1px solid ' + (activeFilter === f.id ? 'var(--team1-primary)' : 'var(--border-subtle)')
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => notificationService.markAsRead(notif.id)}
                style={{
                  ...notifCardStyle,
                  borderColor: !notif.read ? 'rgba(0, 230, 118, 0.4)' : 'var(--border-subtle)',
                  background: !notif.read ? 'rgba(0, 230, 118, 0.05)' : 'var(--bg-elevated)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!notif.read && <div style={unreadDot} />}
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                      {notif.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {formatTimeAgo(notif.timestamp)}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 8px', lineHeight: 1.35 }}>
                  {notif.body}
                </p>

                {/* Context Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {notif.clubName && (
                    <span style={tagStyle}>
                      <Building2 size={11} /> {notif.clubName}
                    </span>
                  )}
                  {notif.courtName && (
                    <span style={tagStyle}>
                      <MapPin size={11} /> {notif.courtName}
                    </span>
                  )}
                  {notif.category && (
                    <span style={{ ...tagStyle, color: 'var(--gold-primary)' }}>
                      🏆 {notif.category} Cat
                    </span>
                  )}
                  {notif.discountPercentage && (
                    <span style={{ ...tagStyle, color: '#38bdf8', fontWeight: 900 }}>
                      🏷️ -{notif.discountPercentage}% OFF
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)' }}>
              <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>No hay notificaciones en esta categoría</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => notificationService.markAllAsRead()}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Marcar todas como leídas
          </button>

          <button onClick={onClose} style={closeModalBtnStyle}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 8, 15, 0.88)',
  backdropFilter: 'blur(10px)',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '540px',
  background: '#0d1527',
  border: '1px solid rgba(255, 214, 0, 0.35)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 214, 0, 0.12)'
};

const bellIconBadge: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px'
};

const permissionBannerCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '14px',
  padding: '12px 14px',
  border: '1px solid var(--border-subtle)',
  marginBottom: '4px'
};

const enableNotifBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.8rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 8px var(--team1-glow)'
};

const testAlertBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'var(--bg-elevated)',
  color: 'var(--gold-primary)',
  borderRadius: '8px',
  fontWeight: 800,
  fontSize: '0.75rem',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  cursor: 'pointer'
};

const simulatorBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: 'rgba(255, 255, 255, 0.04)',
  color: '#e2e8f0',
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '0.72rem',
  border: '1px solid var(--border-subtle)',
  cursor: 'pointer',
  textAlign: 'center'
};

const notifCardStyle: React.CSSProperties = {
  borderRadius: '14px',
  padding: '12px 14px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const unreadDot: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: 'var(--team1-primary)'
};

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.7rem',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '2px 8px',
  borderRadius: '6px',
  color: 'var(--text-muted)'
};

const closeModalBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '10px',
  background: 'var(--bg-elevated)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.82rem',
  border: '1px solid var(--border-subtle)',
  cursor: 'pointer'
};
