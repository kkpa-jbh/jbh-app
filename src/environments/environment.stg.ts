export const environment = {
  production: false,
  environmentName: 'staging',
  api: {
    baseUrl: 'https://stg-api.yourdomain.com/jbh-api',
    timeout: 30000,
    retryAttempts: 3
  },
  features: {
    enableLogging: true,
    enableDebugMode: true
  }
};
