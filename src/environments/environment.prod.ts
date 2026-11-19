export const environment = {
  production: true,
  environmentName: 'production',
  appVersion: '1.0.0',
  api: {
    // Relative: the app and the API share one host (https://jbh.usemagus.cloud). Magus's Caddy sends /jbh-api to jbh-gateway.
    baseUrl: '/jbh-api',
    timeout: 30000,
    retryAttempts: 3
  },
  google: {
    // Public OAuth Web client ID (not a secret). Empty hides the Google button.
    clientId: '191326239101-d9dlh362qavadjid6cbi5prqv679npku.apps.googleusercontent.com'
  },
  features: {
    enableLogging: false,
    enableDebugMode: false
  },
  observability: {
    enabled: false,
    collectorUrl: 'https://faro-collector-prod-sa-east-1.grafana.net/collect/8f35433c4b772e526d0ec81d2532faf3',
    appName: 'jbh-web',
    environment: 'prod'
  }
};
