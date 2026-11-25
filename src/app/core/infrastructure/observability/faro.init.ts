import {
  InternalLoggerLevel,
  getWebInstrumentations,
  initializeFaro
} from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { LoggerService } from '../logging/logger.service';
import { scrubTransportItem } from './faro-privacy';
import { observabilityConfig } from './runtime-config';

// Set by "ng build --define". Missing in local builds, so it is read with typeof.
declare const JBH_GIT_SHA: string | undefined;

/**
 * Starts Faro once, before bootstrapApplication, so the first HTTP call is traced. Does nothing when disabled.
 * Runtime values from runtime-config.js win over environment.ts.
 */
export function initFaro(): void {
  const { enabled, collectorUrl, appName, environment: envName } = observabilityConfig();
  if (!enabled) {
    return;
  }
  try {
    initializeFaro({
      url: collectorUrl,
      app: {
        name: appName,
        namespace: 'jbh',
        environment: envName,
        version: typeof JBH_GIT_SHA === 'string' ? JBH_GIT_SHA : 'dev'
      },
      instrumentations: [
        ...getWebInstrumentations({ captureConsole: false }),
        // An empty list: the trace header goes to the app's own origin only.
        new TracingInstrumentation({ instrumentationOptions: { propagateTraceHeaderCorsUrls: [] } })
      ],
      beforeSend: scrubTransportItem,
      internalLoggerLevel: InternalLoggerLevel.OFF,
      // A longer interval means fewer failed requests when the collector is down.
      batching: { enabled: true, sendTimeout: 5000, itemLimit: 50 }
    });
  } catch (error) {
    new LoggerService().error('Faro init failed', 'initFaro', error);
  }
}
