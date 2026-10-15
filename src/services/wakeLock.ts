class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested: boolean = false;

  public async requestLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock API not supported in this browser.');
      return false;
    }

    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      this.isRequested = true;

      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
        // If release happened unintentionally (e.g. tab switch), re-acquire on visibility
        if (this.isRequested && document.visibilityState === 'visible') {
          this.requestLock();
        }
      });

      return true;
    } catch (err) {
      console.warn('Wake Lock request error:', err);
      return false;
    }
  }

  public releaseLock() {
    this.isRequested = false;
    if (this.sentinel) {
      this.sentinel.release().catch(() => {});
      this.sentinel = null;
    }
  }

  public isLocked(): boolean {
    return this.sentinel !== null;
  }
}

export const wakeLockService = new WakeLockService();
