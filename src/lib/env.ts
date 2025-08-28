// Environment variable helpers for client and server
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  // Handle client-side environment variables safely
  if (typeof process === 'undefined') {
    return defaultValue;
  }
  
  return process.env[key] || defaultValue;
}

export function getClientEnv() {
  return {
    WS_URL: getEnvVar('NEXT_PUBLIC_WS_URL', process.env.NODE_ENV === 'production' ? 'wss://your-domain.com' : 'ws://localhost:8081'),
    APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'),
  };
}