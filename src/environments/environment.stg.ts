export const environment = {
  production: false,
  environmentName: 'staging',
  appVersion: '1.0.0',
  api: {
    baseUrl: 'https://stg-api.yourdomain.com/jbh-api',
    timeout: 30000,
    retryAttempts: 3
  },
  google: {
    // Public OAuth Web client ID (not a secret). Empty hides the Google button.
    clientId: '191326239101-d9dlh362qavadjid6cbi5prqv679npku.apps.googleusercontent.com'
  },
  features: {
    enableLogging: true,
    enableDebugMode: true
  }
};
