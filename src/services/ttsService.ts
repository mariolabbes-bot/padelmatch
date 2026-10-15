import type { TTSSettings } from '../types/padel';

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private isUnlocked: boolean = false;
  private speakingCallbacks: Set<(isSpeaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public subscribeSpeakingState(callback: (isSpeaking: boolean) => void): () => void {
    this.speakingCallbacks.add(callback);
    return () => this.speakingCallbacks.delete(callback);
  }

  private notifySpeakingState(isSpeaking: boolean) {
    this.speakingCallbacks.forEach(cb => cb(isSpeaking));
  }

  /**
   * Unlock Audio context and speech synthesis with user interaction (critical for mobile iOS/Android)
   */
  public unlockAudioContext() {
    if (this.isUnlocked || !this.synth) return;

    try {
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      silentUtterance.rate = 2;
      this.synth.speak(silentUtterance);
      this.isUnlocked = true;
    } catch {
      // Silently catch audio policy restrictions until real interaction
    }
  }

  public getAvailableSpanishVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    return voices.filter(voice => voice.lang.toLowerCase().startsWith('es'));
  }

  public getAllVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(text: string, settings: TTSSettings) {
    if (!this.synth || !settings.enabled || !text) return;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = settings.pitch || 1.0;
    utterance.rate = settings.rate || 1.05;
    utterance.volume = settings.volume ?? 1.0;

    const voices = this.synth.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (settings.voiceName) {
      selectedVoice = voices.find(v => v.name === settings.voiceName);
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === 'es-CL') ||
                      voices.find(v => v.lang === 'es-ES') ||
                      voices.find(v => v.lang === 'es-MX') ||
                      voices.find(v => v.lang.startsWith('es'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'es-ES';
    }

    utterance.onstart = () => {
      this.notifySpeakingState(true);
    };

    utterance.onend = () => {
      this.notifySpeakingState(false);
    };

    utterance.onerror = (e) => {
      console.warn('TTS Announcement error:', e);
      this.notifySpeakingState(false);
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.notifySpeakingState(false);
    }
  }
}

export const ttsService = new TTSService();
