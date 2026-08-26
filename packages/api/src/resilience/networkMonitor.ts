export type NetworkStatus = 'online' | 'offline' | 'unstable';

export type NetworkChangeListener = (status: NetworkStatus) => void;

class NetworkMonitor {
  private currentStatus: NetworkStatus = 'online';
  private listeners: Set<NetworkChangeListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      this.currentStatus = window.navigator.onLine ? 'online' : 'offline';
      window.addEventListener('online', () => this.setStatus('online'));
      window.addEventListener('offline', () => this.setStatus('offline'));
    }
  }

  public getStatus(): NetworkStatus {
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
      return window.navigator.onLine ? this.currentStatus : 'offline';
    }
    return this.currentStatus;
  }

  public isOnline(): boolean {
    return this.getStatus() !== 'offline';
  }

  public setStatus(status: NetworkStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.notifyListeners();
    }
  }

  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    // Emit immediate status
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentStatus);
      } catch (err) {
        console.error('[NetworkMonitor] Error in listener callback:', err);
      }
    }
  }
}

export const networkMonitor = new NetworkMonitor();
