// API configuration
// Automatically detect production vs development environment

const getApiUrl = (): string => {
  // 1. Check for explicit environment variable (set during build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Check if running in browser on railway.app domain
  if (typeof window !== 'undefined' && window.location?.hostname?.includes('railway.app')) {
    // Production: use Railway API URL
    return 'https://api-production-ae87.up.railway.app';
  }

  // 3. Default to localhost for development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

// Debug log (only in development)
if (__DEV__) {
  console.log('API_BASE_URL:', API_BASE_URL);
}

export default API_BASE_URL;
