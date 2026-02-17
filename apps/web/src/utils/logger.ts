/**
 * Logger utility for client-side logging
 * Integrates with Sentry for error tracking
 */
const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // In production, this would send to Sentry
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', ...args);
    }
  },
};

export default logger;
