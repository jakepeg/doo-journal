// Debug utility to control logging levels
const isDev = import.meta.env.DEV;
const isDebugEnabled = import.meta.env.VITE_DEBUG_LOGS === 'true' || isDev;

export const debug = {
  log: (message: string, ...args: any[]) => {
    if (isDebugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};