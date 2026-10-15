/**
 * PadelMatch - Smartwatch & Apple Watch Remote Controller Service
 * 
 * Works with watchOS (Apple Watch Series 1, 2, 3, 4, 5, 6, 7, 8, Ultra, SE)
 * and Wear OS / HarmonyOS via the HTML5 Media Session API + Background Silent Audio Loop.
 * 
 * Why this is required on Apple Watch:
 * watchOS does not allow generic Bluetooth HID keyboard pairing directly to iPhone.
 * Safari / WebKit deactivates the Media Session API unless audio is actively playing.
 * By playing an inaudible, continuous 0-volume silent audio stream, iOS keeps the Media Session
 * active in the background, allowing the Apple Watch "Now Playing" (En Reproducción) screen
 * to stay open on the user's wrist and receive Previous / Next / Pause hardware events!
 */

export interface SmartwatchState {
  isActive: boolean;
  isAudioPlaying: boolean;
  lastCommand: string | null;
  lastCommandTime: number | null;
}

type CommandListener = (command: 'team1' | 'team2' | 'undo' | 'repeat') => void;
type StateListener = (state: SmartwatchState) => void;

class SmartwatchService {
  private audioElement: HTMLAudioElement | null = null;
  private isActive: boolean = false;
  private commandListeners: Set<CommandListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private lastCommand: string | null = null;
  private lastCommandTime: number | null = null;

  // Base64 1-second inaudible WAV audio loop
  private readonly SILENT_WAV_BASE64 = 
    'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';

  constructor() {
    this.initAudioElement();
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio();
      audio.src = this.SILENT_WAV_BASE64;
      audio.loop = true;
      audio.volume = 0.01; // Inaudible
      (audio as any).playsInline = true;
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      this.audioElement = audio;
    } catch (e) {
      console.warn('SmartwatchService: audio element init error', e);
    }
  }

  /**
   * Activates Apple Watch background sync.
   * MUST be called from a user gesture (e.g. click/tap) so iOS Safari permits audio playback.
   */
  public async activate(): Promise<boolean> {
    if (!this.audioElement) {
      this.initAudioElement();
    }

    try {
      if (this.audioElement) {
        await this.audioElement.play();
      }
      this.isActive = true;
      this.setupMediaSessionHandlers();
      this.notifyState();
      return true;
    } catch (err) {
      console.warn('SmartwatchService: could not play background audio', err);
      // Even if autoplay fails initially, keep active flag and retry on next interaction
      this.isActive = true;
      this.setupMediaSessionHandlers();
      this.notifyState();
      return false;
    }
  }

  public deactivate() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }
    this.isActive = false;
    this.notifyState();
  }

  public toggle(): Promise<boolean> {
    if (this.isActive) {
      this.deactivate();
      return Promise.resolve(false);
    } else {
      return this.activate();
    }
  }

  public getState(): SmartwatchState {
    return {
      isActive: this.isActive,
      isAudioPlaying: !!(this.audioElement && !this.audioElement.paused),
      lastCommand: this.lastCommand,
      lastCommandTime: this.lastCommandTime
    };
  }

  /**
   * Updates the live score text displayed on the Apple Watch / lock screen.
   */
  public updateScoreDisplay(params: {
    team1Name: string;
    team2Name: string;
    team1Score: string;
    team2Score: string;
    team1Games: number;
    team2Games: number;
    currentSetNum: number;
    courtName: string;
    isGoldenPoint?: boolean;
    isTieBreak?: boolean;
  }) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const stateSuffix = params.isGoldenPoint 
        ? ' [PUNTO DE ORO]' 
        : params.isTieBreak 
          ? ' [TIE-BREAK]' 
          : '';

      const title = `🎾 ${params.team1Score} - ${params.team2Score}${stateSuffix}`;
      const artist = `${params.team1Name} (${params.team1Games}) vs ${params.team2Name} (${params.team2Games}) - Set ${params.currentSetNum}`;
      const album = `${params.courtName} | PadelMatch`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: '/favicon.svg', sizes: '96x96', type: 'image/svg+xml' },
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }
        ]
      });
    } catch (e) {
      // mediaSession metadata might fail on older browsers
    }
  }

  private setupMediaSessionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      // Apple Watch "Previous Track" button [⏮] -> Point Team 1
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.triggerCommand('team1');
      });

      // Apple Watch "Next Track" button [⏭] -> Point Team 2
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.triggerCommand('team2');
      });

      // Apple Watch "Pause" button [⏸] -> Undo last point
      navigator.mediaSession.setActionHandler('pause', () => {
        this.triggerCommand('undo');
        // Resume silent loop so audio session stays active
        if (this.isActive && this.audioElement) {
          setTimeout(() => {
            this.audioElement?.play().catch(() => {});
          }, 200);
        }
      });

      // Apple Watch "Play" button [▶] -> Repeat score announcement
      navigator.mediaSession.setActionHandler('play', () => {
        this.triggerCommand('repeat');
        if (this.isActive && this.audioElement) {
          this.audioElement.play().catch(() => {});
        }
      });

      // Seek actions for compatibility with clickers
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.triggerCommand('undo');
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        this.triggerCommand('repeat');
      });
    } catch (e) {
      console.warn('SmartwatchService: media session handlers setup error', e);
    }
  }

  private triggerCommand(command: 'team1' | 'team2' | 'undo' | 'repeat') {
    this.lastCommand = command;
    this.lastCommandTime = Date.now();

    // Haptic feedback on device if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(command === 'undo' ? [50, 50, 50] : [70]);
      } catch {
        // ignore
      }
    }

    this.commandListeners.forEach(listener => {
      try {
        listener(command);
      } catch (err) {
        console.error('Error in smartwatch command listener:', err);
      }
    });

    this.notifyState();
  }

  public subscribeCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  private notifyState() {
    const s = this.getState();
    this.stateListeners.forEach(l => l(s));
  }
}

export const smartwatchService = new SmartwatchService();
