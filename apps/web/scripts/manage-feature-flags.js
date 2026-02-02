#!/usr/bin/env node
/**
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Feature Flags Management Utility
 * 
 * Manage Edge Config feature flags via CLI
 */


const { URL } = require('url');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  // eslint-disable-next-line no-console
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const EDGE_CONFIG = process.env.EDGE_CONFIG;

if (!EDGE_CONFIG) {
  log('❌ EDGE_CONFIG environment variable not set', 'red');
  log('Run: ./scripts/setup-vercel-edge.sh', 'yellow');
  process.exit(1);
}

// Parse Edge Config URL
// Format: https://edge-config.vercel.com/{id}?token={token}
const edgeConfigUrl = new URL(EDGE_CONFIG);
const configId = edgeConfigUrl.pathname.split('/')[1];
const token = edgeConfigUrl.searchParams.get('token');

if (!configId || !token) {
  log('❌ Invalid EDGE_CONFIG format', 'red');
  process.exit(1);
}

// Commands
const commands = {
  list: async () => {
    log('📋 Current Feature Flags', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const { getAll } = await import('@vercel/edge-config');
      const flags = await getAll();

      if (!flags || Object.keys(flags).length === 0) {
        log('No feature flags configured', 'yellow');
        return;
      }

      Object.entries(flags).forEach(([key, value]) => {
        const status = value === true ? '✅' : value === false ? '❌' : '📝';
        const color = value === true ? 'green' : value === false ? 'red' : 'yellow';
        log(`  ${status} ${key}: ${JSON.stringify(value)}`, color);
      });
    } catch (error) {
      log(`❌ Error fetching flags: ${error.message}`, 'red');
      log('Make sure @vercel/edge-config is installed', 'yellow');
    }
  },

  get: async (key) => {
    if (!key) {
      log('❌ Usage: node manage-feature-flags.js get <key>', 'red');
      return;
    }

    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get(key);

      if (value === undefined) {
        log(`❌ Flag '${key}' not found`, 'red');
      } else {
        log(`✅ ${key}: ${JSON.stringify(value)}`, 'green');
      }
    } catch (error) {
      log(`❌ Error: ${error.message}`, 'red');
    }
  },

  help: () => {
    log('🚀 Feature Flags Management', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('');
    log('Commands:', 'blue');
    log('  list              List all feature flags');
    log('  get <key>         Get a specific flag value');
    log('  help              Show this help message');
    log('');
    log('Available Flags:', 'blue');
    log('  enableWebSockets           WebSocket support');
    log('  enableRealTimeNotifications Real-time updates');
    log('  enableAdvancedAnalytics    Advanced analytics');
    log('  enablePayPal               PayPal payments');
    log('  enableStripe               Stripe payments');
    log('  enableCrypto               Crypto payments');
    log('  enableDarkMode             Dark mode UI');
    log('  enableBetaFeatures         Beta features');
    log('  enableA11yMode             Accessibility mode');
    log('  enableCDN                  CDN usage');
    log('  enableImageOptimization    Image optimization');
    log('  enablePrefetching          Link prefetching');
    log('  enabledRegions             Enabled regions array');
    log('  maintenanceMode            Maintenance mode');
    log('  experiments                A/B test experiments');
    log('');
    log('Examples:', 'blue');
    log('  node manage-feature-flags.js list');
    log('  node manage-feature-flags.js get enablePayPal');
    log('');
    log('To update flags:', 'yellow');
    log('  1. Go to Vercel Dashboard → Storage → Edge Config');
    log('  2. Select your config');
    log('  3. Edit JSON values');
    log('  4. Changes take effect immediately (no redeploy!)');
  },
};

// Main
const [, , command, ...args] = process.argv;

if (!command || !commands[command]) {
  commands.help();
  process.exit(0);
}

commands[command](...args).catch(error => {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
