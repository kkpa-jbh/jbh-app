import { environment } from '@environments/environment';

/** The Faro values a server can set at serve time, in runtime-config.js (window.__JBH_RUNTIME__.observability). */
export interface RuntimeObservability {
  enabled?: boolean;
  collectorUrl?: string;
  environment?: string;
}

type ObservabilityConfig = typeof environment.observability;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** Reads the runtime values. Keeps only fields of the right type. Never throws: anything wrong gives {}. */
export function readRuntimeObservability(): RuntimeObservability {
  try {
    const runtime = (globalThis as { __JBH_RUNTIME__?: unknown }).__JBH_RUNTIME__;
    const observability = isRecord(runtime) ? runtime['observability'] : undefined;
    if (!isRecord(observability)) {
      return {};
    }
    const result: RuntimeObservability = {};
    if (typeof observability['enabled'] === 'boolean') {
      result.enabled = observability['enabled'];
    }
    const collectorUrl = nonEmptyString(observability['collectorUrl']);
    if (collectorUrl) {
      result.collectorUrl = collectorUrl;
    }
    const envName = nonEmptyString(observability['environment']);
    if (envName) {
      result.environment = envName;
    }
    return result;
  } catch {
    return {};
  }
}

/** The Faro config to use: runtime values win over environment.ts. Every Faro caller reads this, so they agree. */
export function observabilityConfig(): ObservabilityConfig {
  return { ...environment.observability, ...readRuntimeObservability() };
}
