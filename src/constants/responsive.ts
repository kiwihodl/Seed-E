// Web-adapted responsive utilities for Seed-E
export const windowHeight: number =
  typeof window !== "undefined" ? window.innerHeight : 812;
export const windowWidth: number =
  typeof window !== "undefined" ? window.innerWidth : 375;

export const getTransactionPadding = () => windowHeight * 0.047;

// Web-adapted height percentage (hp) - converts design height to viewport height
export const hp = (height: number) => (height / 812) * windowHeight;

// Web-adapted width percentage (wp) - converts design width to viewport width
export const wp = (width: number) => (width / 375) * windowWidth;

// Additional web-specific utilities
export const isMobile = () => windowWidth < 768;
export const isTablet = () => windowWidth >= 768 && windowWidth < 1024;
export const isDesktop = () => windowWidth >= 1024;
