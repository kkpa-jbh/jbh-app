export const environment = {
  production: true,
  environmentName: 'production',
  appVersion: '1.0.0',
  api: {
    // Relative: the app and the API share one host (https://jbh.usemagus.cloud). Nginx sends /jbh-api to jbh-gateway.
    baseUrl: '/jbh-api',
    timeout: 30000,
    retryAttempts: 3
  },
  features: {
    enableLogging: false,
    enableDebugMode: false
  }
};
