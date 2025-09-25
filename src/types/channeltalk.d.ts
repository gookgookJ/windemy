declare global {
  interface Window {
    ChannelIO?: {
      (command: string, ...args: any[]): void;
    };
  }
}

export {};