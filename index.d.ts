
export {};

declare global {
  interface Window {
    FEATURES: Record<
      string,
      { enable: () => void; disable: () => void, state: () => boolean }
    >;
  }
}
