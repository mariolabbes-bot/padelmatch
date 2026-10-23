/**
 * Image Optimizer for PadelMatch Avatars and Badges.
 * Crops any uploaded photo into a perfect 1:1 square, scales it down to optimal dimensions (256x256 or 300x300),
 * and compresses it using HTML5 Canvas (WebP/JPEG quality 0.82-0.85).
 * 
 * Takes a 10MB phone camera photo and reduces it by 99% to ~15KB - 30KB.
 * Ensures instant loading, 0 latency, and fast Cloud Firestore synchronization.
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  squareCrop?: boolean;
}

export interface OptimizedResult {
  dataUrl: string;
  originalSizeKb: number;
  optimizedSizeKb: number;
}

export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizedResult> {
  const {
    maxWidth = 280,
    maxHeight = 280,
    quality = 0.84,
    squareCrop = true
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.');
  }

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        let sx = 0;
        let sy = 0;
        let sWidth = naturalWidth;
        let sHeight = naturalHeight;
        let targetWidth = naturalWidth;
        let targetHeight = naturalHeight;

        if (squareCrop) {
          const minDim = Math.min(naturalWidth, naturalHeight);
          sx = Math.round((naturalWidth - minDim) / 2);
          sy = Math.round((naturalHeight - minDim) / 2);
          sWidth = minDim;
          sHeight = minDim;

          const finalDim = Math.min(maxWidth, minDim);
          targetWidth = finalDim;
          targetHeight = finalDim;
        } else {
          if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
            const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
            targetWidth = Math.round(naturalWidth * ratio);
            targetHeight = Math.round(naturalHeight * ratio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('No se pudo inicializar el lienzo gráfico para procesar la imagen.'));
          return;
        }

        // High quality rendering configuration
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

        // Try webp first, fallback to jpeg
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate size in KB from data URL
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const optimizedSizeKb = Math.round((base64Length * 3) / 4 / 1024);

        URL.revokeObjectURL(objectUrl);
        resolve({ dataUrl, originalSizeKb, optimizedSizeKb });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen seleccionada.'));
    };

    img.src = objectUrl;
  });
}

export function isImageAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;
  return avatar.startsWith('data:image') || avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:');
}

export interface GenericAvatarPreset {
  id: string;
  emoji: string;
  label: string;
  bgGradient: string;
  borderColor: string;
}

export const PLAYER_GENERIC_AVATARS: GenericAvatarPreset[] = [
  { id: 'visera', emoji: '🧢', label: 'Drive Visera', bgGradient: 'linear-gradient(135deg, #00e676, #00b0ff)', borderColor: 'var(--team1-primary)' },
  { id: 'reves', emoji: '⚡', label: 'Revés Relámpago', bgGradient: 'linear-gradient(135deg, #00b0ff, #7c4dff)', borderColor: '#00b0ff' },
  { id: 'smash', emoji: '🚀', label: 'Pegador / Smash', bgGradient: 'linear-gradient(135deg, #ff5252, #ff7a00)', borderColor: '#ff5252' },
  { id: 'muralla', emoji: '🛡️', label: 'Defensa Cristal', bgGradient: 'linear-gradient(135deg, #00e5ff, #1de9b6)', borderColor: '#00e5ff' },
  { id: 'tactico', emoji: '🎯', label: 'Estratega', bgGradient: 'linear-gradient(135deg, #ffd600, #ff9100)', borderColor: 'var(--gold-primary)' },
  { id: 'fuego', emoji: '🔥', label: 'En Racha', bgGradient: 'linear-gradient(135deg, #ff1744, #d500f9)', borderColor: '#ff1744' },
  { id: 'pro', emoji: '👑', label: 'Maestro Pista', bgGradient: 'linear-gradient(135deg, #ffd700, #ffab00)', borderColor: '#ffd700' },
  { id: 'leon', emoji: '🦁', label: 'Competidor', bgGradient: 'linear-gradient(135deg, #ff6d00, #ffab00)', borderColor: '#ff6d00' },
  { id: 'zurdo', emoji: '⭐', label: 'Zurdo de Oro', bgGradient: 'linear-gradient(135deg, #ffd600, #00e676)', borderColor: 'var(--gold-primary)' },
  { id: 'zen', emoji: '🧘', label: 'Mente Fría', bgGradient: 'linear-gradient(135deg, #7c4dff, #651fff)', borderColor: '#7c4dff' },
  { id: 'padel', emoji: '🎾', label: 'Pádel Clásico', bgGradient: 'linear-gradient(135deg, #00e676, #76ff03)', borderColor: 'var(--team1-primary)' },
  { id: 'campeon', emoji: '🏆', label: 'Campeón', bgGradient: 'linear-gradient(135deg, #ffab00, #ffd600)', borderColor: '#ffd600' }
];

export const GROUP_GENERIC_AVATARS: GenericAvatarPreset[] = [
  { id: 'grp-padel', emoji: '🎾', label: 'Club de Pádel', bgGradient: 'linear-gradient(135deg, #00e676, #00b0ff)', borderColor: 'var(--team1-primary)' },
  { id: 'grp-trofeo', emoji: '🏆', label: 'Liga & Torneo', bgGradient: 'linear-gradient(135deg, #ffd700, #ff9100)', borderColor: '#ffd700' },
  { id: 'grp-rayo', emoji: '⚡', label: 'Team Relámpago', bgGradient: 'linear-gradient(135deg, #00b0ff, #2979ff)', borderColor: '#00b0ff' },
  { id: 'grp-fuego', emoji: '🔥', label: 'Fuego en Pista', bgGradient: 'linear-gradient(135deg, #ff5252, #ff7a00)', borderColor: '#ff5252' },
  { id: 'grp-corona', emoji: '👑', label: 'Los Reyes', bgGradient: 'linear-gradient(135deg, #ffd600, #ffab00)', borderColor: '#ffd600' },
  { id: 'grp-muralla', emoji: '🛡️', label: 'Inquebrantables', bgGradient: 'linear-gradient(135deg, #00e5ff, #00b0ff)', borderColor: '#00e5ff' },
  { id: 'grp-lobo', emoji: '🐺', label: 'La Manada', bgGradient: 'linear-gradient(135deg, #78909c, #37474f)', borderColor: '#78909c' },
  { id: 'grp-smash', emoji: '🚀', label: 'Smash Squad', bgGradient: 'linear-gradient(135deg, #e040fb, #7c4dff)', borderColor: '#e040fb' },
  { id: 'grp-cerveza', emoji: '🍻', label: 'Tercer Tiempo', bgGradient: 'linear-gradient(135deg, #ffab00, #ff6d00)', borderColor: '#ffab00' },
  { id: 'grp-playa', emoji: '🌴', label: 'Pádel Sunset', bgGradient: 'linear-gradient(135deg, #00e676, #00e5ff)', borderColor: '#00e676' },
  { id: 'grp-espadas', emoji: '⚔️', label: 'Duelos Duplas', bgGradient: 'linear-gradient(135deg, #ff1744, #b71c1c)', borderColor: '#ff1744' },
  { id: 'grp-diamante', emoji: '💎', label: 'Circuito Diamante', bgGradient: 'linear-gradient(135deg, #40c4ff, #e040fb)', borderColor: '#40c4ff' }
];
