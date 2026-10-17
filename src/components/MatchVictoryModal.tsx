import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { MatchScoreState, Team, MatchRules } from '../types/padel';
import { calculatePadelElo } from '../engine/eloEngine';
import { MatchShareCardModal } from './MatchShareCardModal';
import { 
  Trophy, 
  RefreshCw, 
  Flame, 
  Clock, 
  Share2, 
  Sparkles, 
  Award, 
  Zap, 
  CheckCircle2,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  state: MatchScoreState;
  teams: { team1: Team; team2: Team };
  onRematch: () => void;
  onNewMatch: () => void;
  rules?: MatchRules;
  matchElapsedSeconds?: number;
}

export const MatchVictoryModal: React.FC<Props> = ({
  isOpen,
  state,
  teams,
  onRematch,
  onNewMatch,
  rules,
  matchElapsedSeconds
}) => {
  const [showProModal, setShowProModal] = useState(false);
  const [proSuccess, setProSuccess] = useState(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);

  useEffect(() => {
    if (isOpen && state.winner) {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#00e676', '#00b0ff', '#ffd600', '#ffffff'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 65,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 65,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, state.winner]);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const setsScoreStr = state.sets.map((s, idx) => `Set ${idx + 1}: ${s.team1}-${s.team2}`).join(' | ');
    const winnerText = state.winner ? `🏆 Ganadores: *${teams[state.winner].name}*` : '⏱️ Partido concluido por tiempo de cancha';

    const text = 
      `🎾 *PADEL MATCH • RESULTADO OFICIAL* 🏆\n\n` +
      `⚔️ *${teams.team1.name}* (${teams.team1.player1.name} & ${teams.team1.player2.name})\n` +
      `   vs\n` +
      `⚔️ *${teams.team2.name}* (${teams.team2.player1.name} & ${teams.team2.player2.name})\n\n` +
      `📊 *Marcador:* ${setsScoreStr}\n` +
      `${winnerText}\n\n` +
      `📈 Revisa la ficha de jugadores, ranking ELO y estadísticas avanzadas:\n` +
      `https://padelmatch.web.app`;

    if (navigator.share) {
      navigator.share({
        title: 'PadelMatch - Resultado de Partido',
        text: text,
        url: 'https://padelmatch.web.app'
      }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Render Incomplete / Unfinished Match Summary
  if (!state.winner) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle} className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <img src="/logo.png" alt="PadelMatch" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span> • FICHA OFICIAL
            </span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ ...trophyCircleStyle, background: 'rgba(255, 214, 0, 0.1)', borderColor: 'rgba(255, 214, 0, 0.3)' }}>
              <Clock size={44} color="var(--gold-primary)" />
            </div>
            <span className="badge badge-gold" style={{ marginTop: '12px' }}>
              Partido Inconcluso Registrado
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
              Tiempo de Cancha Cumplido
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {teams.team1.name} vs {teams.team2.name}
            </p>
          </div>

          {/* Final Sets Scoreboard Card */}
          <div style={setsCardStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Marcador Alcanzado en Cancha
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {state.sets.map((set, idx) => (
                <div key={idx} style={setScoreBadge}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SET {idx + 1}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                    <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : '#94a3b8' }}>{set.team1}</span>
                    <span style={{ opacity: 0.4 }}> - </span>
                    <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : '#94a3b8' }}>{set.team2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Share Card Button */}
          <button 
            type="button" 
            onClick={() => setIsShareCardOpen(true)} 
            style={visualShareCardBtnStyle}
          >
            <Sparkles size={16} color="var(--gold-primary)" />
            <span>Generar Tarjeta Gráfica HD (Historias / WhatsApp)</span>
          </button>

          {/* WhatsApp Share Button */}
          <button 
            type="button" 
            onClick={handleShareWhatsApp} 
            style={whatsappShareBtnStyle}
          >
            <Share2 size={16} />
            <span>Enviar Ficha por WhatsApp a Jugadores ($0)</span>
          </button>

          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', margin: '14px 0', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              ℹ️ Este partido ha sido computado en el total de partidos jugados de los 4 participantes, preservando el puntaje ELO y las rachas invictas.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button onClick={onRematch} style={rematchBtnStyle}>
              <RefreshCw size={18} />
              <span>Continuar Partido</span>
            </button>
            <button onClick={onNewMatch} style={newMatchBtnStyle}>
              <span>Nuevo Partido</span>
            </button>
          </div>

          {/* Match Share Card HD Modal */}
          <MatchShareCardModal
            isOpen={isShareCardOpen}
            onClose={() => setIsShareCardOpen(false)}
            teams={teams}
            state={state}
            rules={rules}
            matchDurationSeconds={matchElapsedSeconds}
          />
        </div>
      </div>
    );
  }

  const winnerTeam = teams[state.winner];

  // Calculate ELO progression
  const eloResults = calculatePadelElo(
    [teams.team1.player1, teams.team1.player2],
    [teams.team2.player1, teams.team2.player2],
    state.winner,
    state.sets
  );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        {/* Top App Brand Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <img src="/logo.png" alt="PadelMatch" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span> • FICHA OFICIAL
          </span>
        </div>

        {/* Trophy icon */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={trophyCircleStyle}>
            <Trophy size={44} color="var(--gold-primary)" />
          </div>
          <span className="badge badge-gold" style={{ marginTop: '10px' }}>
            ¡Victoria de Partido!
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '6px', color: '#fff' }}>
            {winnerTeam.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {winnerTeam.player1.name} & {winnerTeam.player2.name}
          </p>
        </div>

        {/* Final Sets Scoreboard Card */}
        <div style={setsCardStyle}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Resultado Final Oficial
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            {state.sets.map((set, idx) => (
              <div key={idx} style={setScoreBadge}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SET {idx + 1}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : '#94a3b8' }}>{set.team1}</span>
                  <span style={{ opacity: 0.4 }}> - </span>
                  <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : '#94a3b8' }}>{set.team2}</span>
                </div>
                {set.tiebreakPoints && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--gold-primary)' }}>
                    ({set.tiebreakPoints.team1}-{set.tiebreakPoints.team2})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ELO Rating Changes */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Flame size={15} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-primary)' }}>
              Ajuste de Ranking ELO de Comunidad
            </span>
          </div>

          <div style={eloGridStyle}>
            {/* Team 1 Players */}
            <div style={{ ...eloTeamCard, borderColor: state.winner === 'team1' ? 'var(--team1-primary)' : 'var(--border-subtle)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--team1-primary)', marginBottom: '4px' }}>
                {teams.team1.name}
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team1.player1.name}</span>
                <span style={{ color: eloResults.team1Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team1Delta >= 0 ? `+${eloResults.team1Delta}` : eloResults.team1Delta} pts
                </span>
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team1.player2.name}</span>
                <span style={{ color: eloResults.team1Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team1Delta >= 0 ? `+${eloResults.team1Delta}` : eloResults.team1Delta} pts
                </span>
              </div>
            </div>

            {/* Team 2 Players */}
            <div style={{ ...eloTeamCard, borderColor: state.winner === 'team2' ? 'var(--team2-primary)' : 'var(--border-subtle)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--team2-primary)', marginBottom: '4px' }}>
                {teams.team2.name}
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team2.player1.name}</span>
                <span style={{ color: eloResults.team2Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team2Delta >= 0 ? `+${eloResults.team2Delta}` : eloResults.team2Delta} pts
                </span>
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team2.player2.name}</span>
                <span style={{ color: eloResults.team2Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team2Delta >= 0 ? `+${eloResults.team2Delta}` : eloResults.team2Delta} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Share Card Button */}
        <button 
          type="button" 
          onClick={() => setIsShareCardOpen(true)} 
          style={visualShareCardBtnStyle}
        >
          <Sparkles size={16} color="var(--gold-primary)" />
          <span>Generar Tarjeta Gráfica HD (Historias / WhatsApp)</span>
        </button>

        {/* WhatsApp Share Button */}
        <button 
          type="button" 
          onClick={handleShareWhatsApp} 
          style={whatsappShareBtnStyle}
        >
          <Share2 size={16} />
          <span>Enviar Ficha por WhatsApp a Jugadores ($0)</span>
        </button>

        {/* Player Pass Pro Founder Offer Card ($9.990 CLP Lifetime) */}
        <div style={proFounderCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.04em' }}>
              <Sparkles size={13} color="var(--gold-primary)" />
              PLAYER PASS PRO • FUNDADORES
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--team1-primary)', background: 'rgba(0, 230, 118, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
              CLP $9.990 VITALICIO
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 8px', lineHeight: 1.35 }}>
            Paga una sola vez y desbloquea tu <strong>Ficha Completa de Rendimiento</strong>: estadísticas Luz Día vs Foco Noche, Algoritmo de Pareja Ideal, control Smartwatch y voz sin límites.
          </p>
          <button 
            type="button"
            onClick={() => setShowProModal(true)}
            style={proCtaBtnStyle}
          >
            <Zap size={14} />
            <span>Activar Player Pass Pro ($9.990)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={onRematch} style={rematchBtnStyle}>
            <RefreshCw size={16} /> Jugar Revancha
          </button>
          <button onClick={onNewMatch} style={newMatchBtnStyle}>
            Nuevo Partido
          </button>
        </div>

        {/* Pro Pass Modal */}
        {showProModal && (
          <div style={proModalOverlayStyle}>
            <div style={proModalCardStyle} className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={22} color="var(--gold-primary)" />
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>Player Pass Pro Vitalicio</span>
                </div>
                <button 
                  onClick={() => setShowProModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ textAlign: 'center', margin: '14px 0' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--team1-primary)' }}>
                  $9.990 <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>CLP</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
                  Pago Único Para Siempre • Sin suscripciones mensuales
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0', fontSize: '0.82rem', color: '#e2e8f0' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span>Historial ilimitado de partidos y fichas de juego</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span>Analítica Día vs Noche (Luz Natural vs Artificial)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span>Algoritmo de Sinergia (Tu Pareja Ideal y Tu Némesis)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span>Control desde Apple Watch & Samsung Galaxy Watch</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span>Árbitro por voz inteligente ilimitado</span>
                </div>
              </div>

              {proSuccess ? (
                <div style={{ padding: '12px', background: 'rgba(0, 230, 118, 0.15)', borderRadius: '10px', color: 'var(--team1-primary)', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  ¡Suscripción Pro Fundador Registrada! Gracias por apoyar a PadelMatch.
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setProSuccess(true)}
                  style={proCheckoutBtnStyle}
                >
                  <Sparkles size={16} />
                  <span>Confirmar Player Pass Pro ($9.990 CLP)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Match Share Card HD Modal */}
        <MatchShareCardModal
          isOpen={isShareCardOpen}
          onClose={() => setIsShareCardOpen(false)}
          teams={teams}
          state={state}
          rules={rules}
          matchDurationSeconds={matchElapsedSeconds}
        />
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 8, 15, 0.9)',
  backdropFilter: 'blur(12px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  background: '#0d1424',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 214, 0, 0.15)',
  animation: 'slideDown 0.3s ease-out'
};

const trophyCircleStyle: React.CSSProperties = {
  width: '84px',
  height: '84px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255, 214, 0, 0.25) 0%, rgba(255, 214, 0, 0.05) 70%)',
  border: '2px solid rgba(255, 214, 0, 0.5)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 30px rgba(255, 214, 0, 0.35)'
};

const setsCardStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '16px',
  padding: '16px',
  textAlign: 'center',
  marginBottom: '20px',
  border: '1px solid var(--border-subtle)'
};

const setScoreBadge: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  padding: '8px 14px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  minWidth: '70px'
};

const eloGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px'
};

const eloTeamCard: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid',
  borderRadius: '12px',
  padding: '12px'
};

const eloPlayerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.8rem',
  color: '#e2e8f0',
  marginTop: '4px'
};

const rematchBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--bg-elevated)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.95rem',
  border: '1px solid var(--border-subtle)'
};

const newMatchBtnStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.95rem',
  boxShadow: '0 4px 16px var(--team1-glow)'
};

const whatsappShareBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '0.88rem',
  border: 'none',
  cursor: 'pointer',
  marginBottom: '14px',
  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)'
};

const proFounderCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.08) 0%, rgba(0, 230, 118, 0.05) 100%)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  borderRadius: '14px',
  padding: '12px 14px',
  marginBottom: '14px'
};

const proCtaBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '9px 12px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #ffd600 0%, #ffab00 100%)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.82rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(255, 214, 0, 0.3)'
};

const proModalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const proModalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  background: '#0d1527',
  border: '1px solid rgba(255, 214, 0, 0.4)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 214, 0, 0.15)'
};

const proCheckoutBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '13px',
  borderRadius: '12px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.92rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 16px var(--team1-glow)'
};

const visualShareCardBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '13px 16px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.22) 0%, rgba(0, 230, 118, 0.25) 100%)',
  border: '1.5px solid var(--gold-primary)',
  color: '#ffffff',
  fontWeight: 900,
  fontSize: '0.92rem',
  cursor: 'pointer',
  marginBottom: '10px',
  boxShadow: '0 4px 18px rgba(255, 214, 0, 0.25)',
  transition: 'transform 0.15s ease'
};
