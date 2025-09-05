declare global {
  interface Window {
    Vimeo?: {
      Player: new (element: HTMLElement | string, options?: any) => VimeoPlayer;
    };
  }
}

interface VimeoPlayer {
  on(event: string, callback: (data: any) => void): void;
  getDuration(): Promise<number>;
  getCurrentTime(): Promise<number>;
  play(): Promise<void>;
  pause(): Promise<void>;
}

export {};