export const environment = {
  production: true,
  environmentName: 'production',
  appVersion: '1.0.0',
  api: {
    baseUrl: 'https://api.yourdomain.com/jbh-api',  // Replace with your production API URL
    timeout: 30000,
    retryAttempts: 3
  },
  features: {
    enableLogging: false,
    enableDebugMode: false
  }
};
