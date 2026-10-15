import type { HardwareKeyMapping } from '../types/padel';

const STORAGE_KEY = 'padelmatch_hardware_mapping_v1';

export const DEFAULT_KEY_PRESETS: Record<string, { name: string; description: string; mapping: HardwareKeyMapping }> = {
  selfie_shutter: {
    name: 'Disparador Selfie / AB Shutter',
    description: 'Botón iOS (Volumen+) para Pareja 1 y Botón Android (Enter) para Pareja 2',
    mapping: {
      team1PointKeys: ['AudioVolumeUp', 'VolumeUp', '+', '='],
      team2PointKeys: ['Enter', 'AudioVolumeDown', 'VolumeDown', '-'],
      undoKeys: ['Backspace', 'KeyZ', 'z'],
      repeatScoreKeys: ['Space', 'KeyR', 'r']
    }
  },
  ring_remote: {
    name: 'Anillo Inteligente / Control TikTok',
    description: 'Arriba para Pareja 1, Abajo para Pareja 2, Clic Central para Deshacer',
    mapping: {
      team1PointKeys: ['ArrowUp', 'PageUp', 'VolumeUp'],
      team2PointKeys: ['ArrowDown', 'PageDown', 'VolumeDown'],
      undoKeys: ['Enter', 'Space', 'Backspace'],
      repeatScoreKeys: ['KeyR', 'r']
    }
  },
  presentation_clicker: {
    name: 'Presentador Inalámbrico (Poste/Reja)',
    description: 'Flecha Derecha/PageDown Pareja 1, Flecha Izquierda/PageUp Pareja 2, Escape Deshacer',
    mapping: {
      team1PointKeys: ['PageDown', 'ArrowRight', 'ArrowDown', 'KeyN'],
      team2PointKeys: ['PageUp', 'ArrowLeft', 'ArrowUp', 'KeyP'],
      undoKeys: ['Escape', 'Period', 'Backspace', 'KeyB'],
      repeatScoreKeys: ['Space', 'KeyR']
    }
  },
  smartwatch_media: {
    name: 'Smartwatch (Apple Watch / Wear OS)',
    description: 'Control multimedia en la muñeca (Now Playing): Siguiente = Pareja 2, Anterior = Pareja 1, Pausa = Deshacer',
    mapping: {
      team1PointKeys: ['MediaTrackPrevious', 'AudioVolumeUp', 'VolumeUp', 'ArrowLeft'],
      team2PointKeys: ['MediaTrackNext', 'AudioVolumeDown', 'VolumeDown', 'ArrowRight'],
      undoKeys: ['MediaPlayPause', 'KeyZ', 'Backspace', 'Space'],
      repeatScoreKeys: ['KeyR', 'r']
    }
  },
  keyboard_simple: {
    name: 'Teclado Estándar / NumPad',
    description: 'Tecla 1 para Pareja 1, Tecla 2 para Pareja 2, Z para Deshacer, R para repetir voz',
    mapping: {
      team1PointKeys: ['Digit1', 'Numpad1', '1'],
      team2PointKeys: ['Digit2', 'Numpad2', '2'],
      undoKeys: ['KeyZ', 'z', 'Backspace'],
      repeatScoreKeys: ['KeyR', 'r', 'Space']
    }
  }
};

export function loadSavedKeyMapping(): HardwareKeyMapping {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return DEFAULT_KEY_PRESETS.ring_remote.mapping;
}

export function saveKeyMapping(mapping: HardwareKeyMapping) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch (e) {
    console.error('Failed to save hardware mapping:', e);
  }
}
