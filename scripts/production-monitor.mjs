#!/usr/bin/env node

import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULT_ENDPOINTS = [
  { name: 'web-health', url: 'https://www.infamousfreight.com/health', severity: 'P2', expectedStatus: [200], timeoutMs: 8000 },
  { name: 'web-api-health', url: 'https://www.infamousfreight.com/api/health', severity: 'P1', expectedStatus: [200, 503], timeoutMs: 8000 },
  { name: 'web-api-ready', url: 'https://www.infamousfreight.com/api/health/ready', severity: 'P1', expectedStatus: [200, 503], timeoutMs: 8000 },
  { name: 'fly-api-live', url: 'https://infamous-freight-api.fly.dev/api/health/live', severity: 'P1', expectedStatus: [200], timeoutMs: 8000 },
  { name: 'fly-api-health', url: 'https://infamous-freight-api.fly.dev/api/health', severity: 'P1', expectedStatus: [200, 503], timeoutMs: 8000 },
  { name: 'fly-api-metrics', url: 'https://infamous-freight-api.fly.dev/api/metrics', severity: 'P3', expectedStatus: [200, 204, 401, 403, 404], timeoutMs: 8000 },
  { name: 'fly-api-database', url: 'https://infamous-freight-api.fly.dev/api/health/database', severity: 'P1', expectedStatus: [200, 204, 401, 403, 404, 503], timeoutMs: 8000 },
  { name: 'fly-api-performance', url: 'https://infamous-freight-api.fly.dev/api/health/performance', severity: 'P3', expectedStatus: [200, 204, 401, 403, 404], timeoutMs: 8000 },
];

const DEFAULT_THRESHOLDS = {
  intervalMs: 5 * 60 * 1000,
  maxConsecutiveFailures: 2,
  p95LatencyMs: 1000,
  errorRatePercent: 2,
  webhookFailureRatePercent: 5,
  memoryUsagePercent: 90,
  diskUsagePercent: 85,
};

const env = process.env;
const nowIso = () => new Date().toISOString();
const boolEnv = (name, fallback = false) => env[name] ? ['1', 'true', 'yes', 'on'].includes(env[name].toLowerCase()) : fallback;
const numberEnv = (name, fallback) => {
  const value = Number(env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const config = {
  once: process.argv.includes('--once') || boolEnv('MONITOR_ONCE'),
  dryRun: process.argv.includes('--dry-run') || boolEnv('MONITOR_DRY_RUN'),
  intervalMs: numberEnv('MONITOR_INTERVAL_MS', DEFAULT_THRESHOLDS.intervalMs),
  maxConsecutiveFailures: numberEnv('MONITOR_MAX_CONSECUTIVE_FAILURES', DEFAULT_THRESHOLDS.maxConsecutiveFailures),
  p95LatencyMs: numberEnv('MONITOR_P95_LATENCY_MS', DEFAULT_THRESHOLDS.p95LatencyMs),
  slackWebhookUrl: env.SLACK_WEBHOOK_URL || '',
  pagerDutyRoutingKey: env.PAGERDUTY_ROUTING_KEY || '',
  sentryDsn: env.SENTRY_DSN || '',
  manusWebhookUrl: env.MANUS_WEBHOOK_URL || '',
  endpoints: loadEndpoints(),
};

const state = new Map();

function loadEndpoints() {
  if (!env.MONITOR_ENDPOINTS_JSON) {
    return DEFAULT_ENDPOINTS;
  }

  try {
    const parsed = JSON.parse(env.MONITOR_ENDPOINTS_JSON);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('MONITOR_ENDPOINTS_JSON must be a non-empty array');
    }

    return parsed.map((endpoint, index) => ({
      name: String(endpoint.name || `endpoint-${index + 1}`),
      url: String(endpoint.url),
      severity: String(endpoint.severity || 'P3'),
      expectedStatus: Array.isArray(endpoint.expectedStatus) ? endpoint.expectedStatus.map(Number) : [200],
      timeoutMs: Number(endpoint.timeoutMs || 8000),
    }));
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', at: nowIso(), message: 'Invalid MONITOR_ENDPOINTS_JSON', error: error.message }));
    process.exit(2);
  }
}

async function checkEndpoint(endpoint) {
  const controller = new AbortController();
  const started = performance.now();
  const timeout = setTimeout(() => controller.abort(), endpoint.timeoutMs);

  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: { 'user-agent': 'InfamousFreightProductionMonitor/1.0' },
      signal: controller.signal,
    });

    const latencyMs = Math.round(performance.now() - started);
    const okStatus = endpoint.expectedStatus.includes(response.status);
    const okLatency = latencyMs <= config.p95LatencyMs || endpoint.severity === 'P3';

    return {
      name: endpoint.name,
      url: endpoint.url,
      severity: endpoint.severity,
      status: response.status,
      latencyMs,
      ok: okStatus && okLatency,
      reason: okStatus ? (okLatency ? 'ok' : `latency>${config.p95LatencyMs}ms`) : `unexpected_status:${response.status}`,
    };
  } catch (error) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      severity: endpoint.severity,
      status: 0,
      latencyMs: Math.round(performance.now() - started),
      ok: false,
      reason: error.name === 'AbortError' ? 'timeout' : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function updateState(result) {
  const current = state.get(result.name) || { consecutiveFailures: 0, lastAlertedAt: null };
  if (result.ok) {
    current.consecutiveFailures = 0;
  } else {
    current.consecutiveFailures += 1;
  }
  state.set(result.name, current);
  return current;
}

async function emitAlert(result, endpointState) {
  if (result.ok || endpointState.consecutiveFailures < config.maxConsecutiveFailures) {
    return;
  }

  const event = {
    service: 'infamous-freight',
    monitor: 'production-monitor',
    at: nowIso(),
    severity: result.severity,
    endpoint: result.name,
    url: result.url,
    status: result.status,
    latencyMs: result.latencyMs,
    reason: result.reason,
    consecutiveFailures: endpointState.consecutiveFailures,
  };

  console.error(JSON.stringify({ level: 'alert', ...event }));

  if (config.dryRun) {
    return;
  }

  await Promise.allSettled([
    notifySlack(event),
    notifyPagerDuty(event),
    notifySentry(event),
    notifyManus(event),
  ]);
}

async function notifySlack(event) {
  if (!config.slackWebhookUrl || event.severity === 'P3') return;
  await postJson(config.slackWebhookUrl, {
    text: `🚨 ${event.severity} Infæmous Freight monitor alert: ${event.endpoint} ${event.reason}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*${event.severity} Infæmous Freight monitor alert*\nEndpoint: \`${event.endpoint}\`\nReason: \`${event.reason}\`\nURL: ${event.url}` } },
    ],
  });
}

async function notifyPagerDuty(event) {
  if (!config.pagerDutyRoutingKey || event.severity === 'P3') return;
  await postJson('https://events.pagerduty.com/v2/enqueue', {
    routing_key: config.pagerDutyRoutingKey,
    event_action: 'trigger',
    dedup_key: `infamous-freight-${event.endpoint}`,
    payload: {
      summary: `${event.severity} Infæmous Freight monitor alert: ${event.endpoint}`,
      source: 'production-monitor',
      severity: event.severity === 'P1' ? 'critical' : 'error',
      component: event.endpoint,
      group: 'production',
      custom_details: event,
    },
  });
}

async function notifySentry(event) {
  if (!config.sentryDsn) return;
  // Keep Sentry dependency-free in the monitor VM. Operators can run Sentry uptime/error alerts separately.
  console.error(JSON.stringify({ level: 'sentry-alert-placeholder', dsnConfigured: true, event }));
}

async function notifyManus(event) {
  if (!config.manusWebhookUrl || event.severity === 'P3') return;
  await postJson(config.manusWebhookUrl, {
    title: `${event.severity} production incident: ${event.endpoint}`,
    instructions: 'Investigate Infæmous Freight production health, summarize likely cause, recommend rollback/escalation steps, and produce an operator incident report.',
    metadata: event,
  });
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(JSON.stringify({ level: 'warn', at: nowIso(), message: 'Alert delivery failed', url, status: response.status }));
  }
}

async function runCycle() {
  const startedAt = nowIso();
  const results = await Promise.all(config.endpoints.map(checkEndpoint));

  for (const result of results) {
    const endpointState = updateState(result);
    console.log(JSON.stringify({ level: result.ok ? 'info' : 'warn', at: nowIso(), cycleStartedAt: startedAt, ...result, consecutiveFailures: endpointState.consecutiveFailures }));
    await emitAlert(result, endpointState);
  }

  const failed = results.filter((result) => !result.ok).length;
  return failed === 0;
}

async function main() {
  console.log(JSON.stringify({ level: 'info', at: nowIso(), message: 'Starting Infæmous Freight production monitor', once: config.once, intervalMs: config.intervalMs, dryRun: config.dryRun, endpoints: config.endpoints.map((endpoint) => endpoint.name) }));

  do {
    await runCycle();
    if (config.once) break;
    await sleep(config.intervalMs);
  } while (true);
}

main().catch((error) => {
  console.error(JSON.stringify({ level: 'fatal', at: nowIso(), message: error.message, stack: error.stack }));
  process.exit(1);
});
