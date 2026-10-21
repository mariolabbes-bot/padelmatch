import type { Team, MatchScoreState, MatchRules } from '../types/padel';
import { calculatePadelElo } from '../engine/eloEngine';

export interface MatchCardOptions {
  teams: { team1: Team; team2: Team };
  state: MatchScoreState;
  rules?: MatchRules;
  matchDurationSeconds?: number;
  qrDataUrl?: string;
  guestClaimName?: string;
}

// Helper: load image safely as Promise
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Helper: Draw rounded rectangle
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Helper: Format duration
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '58m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Generates an ultra high definition 1080x1350 Canvas for social media sharing
 */
export async function generateMatchCardCanvas(options: MatchCardOptions): Promise<HTMLCanvasElement> {
  const { teams, state, rules, matchDurationSeconds } = options;

  // Make sure fonts are loaded if possible
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  // Load official logo image
  const logoImg = await loadImage('/logo.png');

  // Create high-res canvas (1080 x 1350)
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // 1. BASE BACKGROUND & AMBIENT NEON GLOWS
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1350);
  bgGrad.addColorStop(0, '#060a12');
  bgGrad.addColorStop(0.5, '#0a101d');
  bgGrad.addColorStop(1, '#070b14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // Top Left Neon Green Glow
  const greenGlow = ctx.createRadialGradient(140, 140, 10, 140, 140, 480);
  greenGlow.addColorStop(0, 'rgba(0, 230, 118, 0.16)');
  greenGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
  ctx.fillStyle = greenGlow;
  ctx.fillRect(0, 0, 700, 700);

  // Bottom Right Cyan Glow
  const cyanGlow = ctx.createRadialGradient(940, 1200, 10, 940, 1200, 520);
  cyanGlow.addColorStop(0, 'rgba(0, 176, 255, 0.14)');
  cyanGlow.addColorStop(1, 'rgba(0, 176, 255, 0)');
  ctx.fillStyle = cyanGlow;
  ctx.fillRect(380, 650, 700, 700);

  // Subtle Geometric Court Wireframe
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 2;
  // Border court line
  drawRoundRect(ctx, 35, 35, 1010, 1280, 28);
  ctx.stroke();
  // Center court service lines
  ctx.beginPath();
  ctx.moveTo(35, 675);
  ctx.lineTo(1045, 675);
  ctx.stroke();
  ctx.restore();

  // 2. HEADER: LOGO, BRAND & METADATA
  const headerCenterY = 100;

  // Draw Logo
  if (logoImg) {
    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(255, 214, 0, 0.45)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(540, headerCenterY - 10, 44, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e17';
    ctx.fill();

    // Clip circle
    ctx.beginPath();
    ctx.arc(540, headerCenterY - 10, 44, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, 540 - 44, headerCenterY - 10 - 44, 88, 88);
    ctx.restore();

    // Border ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 214, 0, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(540, headerCenterY - 10, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Brand Name
  ctx.textAlign = 'center';
  ctx.font = '900 32px Outfit, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PADEL', 505, headerCenterY + 68);
  ctx.fillStyle = '#00e676';
  ctx.fillText('MATCH', 585, headerCenterY + 68);

  // Official Badge Pill
  ctx.save();
  drawRoundRect(ctx, 360, headerCenterY + 84, 360, 28, 14);
  ctx.fillStyle = 'rgba(0, 230, 118, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '800 12px Outfit, sans-serif';
  ctx.fillStyle = '#00e676';
  ctx.letterSpacing = '1px';
  ctx.fillText('ACTA OFICIAL DE PARTIDO • FIP ENGINE', 540, headerCenterY + 102);
  ctx.restore();

  // Court Name & Date
  const courtText = rules?.courtName || 'CANCHA CENTRAL';
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();
  const timeStr = today.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  ctx.font = '600 15px Outfit, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`📍 ${courtText}   •   📅 ${dateStr} ${timeStr}`, 540, headerCenterY + 138);

  // 3. MAIN SCOREBOARD SECTION (Sets Board)
  const boardY = 275;
  const boardH = 260;
  const boardW = 960;
  const boardX = 60;

  ctx.save();
  // Scoreboard background glass
  drawRoundRect(ctx, boardX, boardY, boardW, boardH, 22);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fill();
  ctx.strokeStyle = state.winner ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 214, 0, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header of Scoreboard Table
  ctx.font = '800 13px Outfit, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('EQUIPOS EN PISTA', boardX + 32, boardY + 36);

  ctx.textAlign = 'center';
  const setsCount = Math.max(state.sets.length, 1);
  const colWidth = 76;
  const setsStartX = boardX + boardW - (setsCount * (colWidth + 12)) - 32;

  state.sets.forEach((_, idx) => {
    const colX = setsStartX + idx * (colWidth + 12) + colWidth / 2;
    ctx.fillText(`SET ${idx + 1}`, colX, boardY + 36);
  });

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(boardX + 24, boardY + 52);
  ctx.lineTo(boardX + boardW - 24, boardY + 52);
  ctx.stroke();

  // TEAM 1 ROW
  const t1RowY = boardY + 110;
  // Team 1 Color Dot
  ctx.beginPath();
  ctx.arc(boardX + 40, t1RowY - 6, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#00e676';
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = '900 24px Outfit, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(teams.team1.name, boardX + 60, t1RowY);

  if (state.winner === 'team1') {
    ctx.save();
    drawRoundRect(ctx, boardX + 60 + ctx.measureText(teams.team1.name).width + 16, t1RowY - 22, 130, 26, 13);
    ctx.fillStyle = 'rgba(255, 214, 0, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 214, 0, 0.5)';
    ctx.stroke();
    ctx.font = '900 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffd600';
    ctx.fillText('🏆 GANADORES', boardX + 60 + ctx.measureText(teams.team1.name).width + 24, t1RowY - 5);
    ctx.restore();
  }

  // TEAM 2 ROW
  const t2RowY = boardY + 195;
  // Team 2 Color Dot
  ctx.beginPath();
  ctx.arc(boardX + 40, t2RowY - 6, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#00b0ff';
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = '900 24px Outfit, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(teams.team2.name, boardX + 60, t2RowY);

  if (state.winner === 'team2') {
    ctx.save();
    drawRoundRect(ctx, boardX + 60 + ctx.measureText(teams.team2.name).width + 16, t2RowY - 22, 130, 26, 13);
    ctx.fillStyle = 'rgba(255, 214, 0, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 214, 0, 0.5)';
    ctx.stroke();
    ctx.font = '900 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffd600';
    ctx.fillText('🏆 GANADORES', boardX + 60 + ctx.measureText(teams.team2.name).width + 24, t2RowY - 5);
    ctx.restore();
  }

  // Draw Set score boxes for each team
  state.sets.forEach((set, idx) => {
    const boxX = setsStartX + idx * (colWidth + 12);
    
    // Team 1 Set Box
    const t1BoxY = t1RowY - 36;
    drawRoundRect(ctx, boxX, t1BoxY, colWidth, 54, 12);
    const t1WonSet = set.team1 > set.team2;
    ctx.fillStyle = t1WonSet ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 255, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = t1WonSet ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '900 30px "JetBrains Mono", monospace';
    ctx.fillStyle = t1WonSet ? '#00e676' : '#94a3b8';
    ctx.fillText(set.team1.toString(), boxX + colWidth / 2, t1BoxY + 38);

    // Team 2 Set Box
    const t2BoxY = t2RowY - 36;
    drawRoundRect(ctx, boxX, t2BoxY, colWidth, 54, 12);
    const t2WonSet = set.team2 > set.team1;
    ctx.fillStyle = t2WonSet ? 'rgba(0, 176, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = t2WonSet ? 'rgba(0, 176, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.font = '900 30px "JetBrains Mono", monospace';
    ctx.fillStyle = t2WonSet ? '#00b0ff' : '#94a3b8';
    ctx.fillText(set.team2.toString(), boxX + colWidth / 2, t2BoxY + 38);

    // Tie-break points indicator if exists
    if (set.tiebreakPoints) {
      ctx.font = '700 11px Outfit, sans-serif';
      ctx.fillStyle = '#ffd600';
      ctx.fillText(`(${set.tiebreakPoints.team1}-${set.tiebreakPoints.team2})`, boxX + colWidth / 2, t2BoxY + 70);
    }
  });

  ctx.restore();

  // 4. PLAYERS ROSTER & ELO PROGRESSION
  let eloDelta1 = 0;
  let eloDelta2 = 0;
  if (state.winner) {
    const eloCalc = calculatePadelElo(
      [teams.team1.player1, teams.team1.player2],
      [teams.team2.player1, teams.team2.player2],
      state.winner,
      state.sets
    );
    eloDelta1 = eloCalc.team1Delta;
    eloDelta2 = eloCalc.team2Delta;
  }

  const rosterY = 560;
  const rosterCardW = 468;
  const rosterCardH = 295;

  // Function to render team card
  const renderTeamCard = (
    team: Team,
    isTeam1: boolean,
    cardX: number,
    delta: number
  ) => {
    ctx.save();
    drawRoundRect(ctx, cardX, rosterY, rosterCardW, rosterCardH, 20);
    ctx.fillStyle = 'rgba(13, 20, 36, 0.75)';
    ctx.fill();
    ctx.strokeStyle = isTeam1 ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 176, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Color header strip
    drawRoundRect(ctx, cardX, rosterY, rosterCardW, 8, 4);
    ctx.fillStyle = isTeam1 ? '#00e676' : '#00b0ff';
    ctx.fill();

    // Team Card Title & ELO Delta
    ctx.textAlign = 'left';
    ctx.font = '800 18px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(team.name, cardX + 24, rosterY + 38);

    if (delta !== 0) {
      ctx.textAlign = 'right';
      ctx.font = '900 17px "JetBrains Mono", monospace';
      ctx.fillStyle = delta > 0 ? '#00e676' : '#ff3d71';
      ctx.fillText(`${delta > 0 ? '+' : ''}${delta} ELO`, cardX + rosterCardW - 24, rosterY + 38);
    }

    // Player 1 Details
    const p1Y = rosterY + 85;
    ctx.textAlign = 'left';
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(team.player1.name, cardX + 24, p1Y);

    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const p1Hand = team.player1.dominantHand === 'zurdo' ? '⭐ Zurdo' : '🎾 Diestro';
    const p1Elo = (team.player1.elo || 1200) + delta;
    ctx.fillText(`Drive  •  ${p1Hand}  •  ELO ${p1Elo}`, cardX + 24, p1Y + 22);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(cardX + 24, p1Y + 44);
    ctx.lineTo(cardX + rosterCardW - 24, p1Y + 44);
    ctx.stroke();

    // Player 2 Details
    const p2Y = p1Y + 78;
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(team.player2.name, cardX + 24, p2Y);

    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const p2Hand = team.player2.dominantHand === 'zurdo' ? '⭐ Zurdo' : '🎾 Diestro';
    const p2Elo = (team.player2.elo || 1200) + delta;
    ctx.fillText(`Revés  •  ${p2Hand}  •  ELO ${p2Elo}`, cardX + 24, p2Y + 22);

    ctx.restore();
  };

  renderTeamCard(teams.team1, true, boardX, eloDelta1);
  renderTeamCard(teams.team2, false, boardX + rosterCardW + 24, eloDelta2);

  // 5. MVP OF THE MATCH BANNER
  const mvpY = 880;
  const mvpH = 145;
  const mvpW = boardW;

  // Determine MVP
  let mvpPlayer = teams.team1.player1;
  let mvpTeamName = teams.team1.name;
  if (state.winner === 'team2') {
    mvpPlayer = teams.team2.player1;
    mvpTeamName = teams.team2.name;
  } else if (!state.winner) {
    // Unfinished match
    mvpPlayer = teams.team1.player1;
  }

  ctx.save();
  // Golden bordered glass card
  drawRoundRect(ctx, boardX, mvpY, mvpW, mvpH, 20);
  const mvpGrad = ctx.createLinearGradient(boardX, mvpY, boardX + mvpW, mvpY + mvpH);
  mvpGrad.addColorStop(0, 'rgba(255, 214, 0, 0.12)');
  mvpGrad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
  ctx.fillStyle = mvpGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 0, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Medal circle
  ctx.beginPath();
  ctx.arc(boardX + 60, mvpY + mvpH / 2, 34, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 214, 0, 0.2)';
  ctx.fill();
  ctx.strokeStyle = '#ffd600';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '28px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⭐', boardX + 60, mvpY + mvpH / 2 + 10);

  // MVP text details
  ctx.textAlign = 'left';
  ctx.font = '900 13px Outfit, sans-serif';
  ctx.fillStyle = '#ffd600';
  ctx.fillText('JUGADOR MÁS VALIOSO (MVP DEL PARTIDO)', boardX + 115, mvpY + 44);

  ctx.font = '900 28px Outfit, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(mvpPlayer.name, boardX + 115, mvpY + 80);

  ctx.font = '600 14px Outfit, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Pilar determinante para ${mvpTeamName} con solidez en puntos clave`, boardX + 115, mvpY + 110);
  ctx.restore();

  // 6. MATCH STATS CHIPS ROW
  const statsY = 1050;
  const chipW = 298;
  const chipH = 82;
  const chipGap = 33;

  const stats = [
    { label: 'DURACIÓN TOTAL', value: formatDuration(matchDurationSeconds || 0), icon: '⏱️' },
    { label: 'MODO DE JUEGO', value: rules?.gameRule === 'advantage' ? 'Ventaja FIP' : 'Punto de Oro', icon: '⚡' },
    { label: 'SETS DISPUTADOS', value: `${state.sets.length} Sets Oficiales`, icon: '🎾' }
  ];

  stats.forEach((st, idx) => {
    const sX = boardX + idx * (chipW + chipGap);
    ctx.save();
    drawRoundRect(ctx, sX, statsY, chipW, chipH, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '22px Outfit, sans-serif';
    ctx.fillText(st.icon, sX + 18, statsY + 48);

    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(st.label, sX + 54, statsY + 34);

    ctx.font = '800 16px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(st.value, sX + 54, statsY + 60);
    ctx.restore();
  });

  // 7. FOOTER & VERIFICATION (WITH EMBEDDED SCANNABLE QR CODE)
  const footerY = 1170;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(boardX, footerY);
  ctx.lineTo(boardX + boardW, footerY);
  ctx.stroke();

  // Try to load QR image if provided
  let qrImg: HTMLImageElement | null = null;
  if (options.qrDataUrl) {
    qrImg = await loadImage(options.qrDataUrl);
  }

  if (qrImg) {
    // QR Code box on right
    const qrBoxSize = 120;
    const qrBoxX = boardX + boardW - qrBoxSize - 10;
    const qrBoxY = footerY + 16;

    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.drawImage(qrImg, qrBoxX + 6, qrBoxY + 6, qrBoxSize - 12, qrBoxSize - 12);

    // Left text aligned
    ctx.textAlign = 'left';
    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillStyle = '#00e676';
    ctx.fillText('VERIFICADO POR PADELMATCH • PWA DEPORTIVA EN CANCHA', boardX + 10, footerY + 42);

    ctx.font = '900 15px Outfit, sans-serif';
    ctx.fillStyle = '#ffd600';
    const claimMsg = options.guestClaimName 
      ? `👉 ESCANEA CON TU CÁMARA PARA RECLAMAR ESTE PARTIDO (${options.guestClaimName})`
      : '👉 ESCANEA CON TU CÁMARA PARA REGISTRARTE Y SUMAR ESTE PARTIDO';
    ctx.fillText(claimMsg, boardX + 10, footerY + 70);

    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Crea tu cuenta, guarda tus estadísticas de juego y sube en el ranking de tu club', boardX + 10, footerY + 95);

    ctx.font = '800 14px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('padelmatch.web.app', boardX + 10, footerY + 120);
  } else {
    // Fallback centered
    ctx.textAlign = 'center';
    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillStyle = '#00e676';
    ctx.fillText('VERIFICADO POR PADELMATCH • PWA DEPORTIVA EN CANCHA', 540, footerY + 45);

    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Lleva el marcador por voz, vincula tu reloj y compite en el ranking de tu club', 540, footerY + 70);

    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('padelmatch.web.app', 540, footerY + 100);
  }
  ctx.restore();

  return canvas;
}
