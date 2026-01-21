/**
 * Route scope registry and validator.
 * Ensures every protected route declares its required scopes.
 * Use for documentation and automated testing.
 */

const routeScopeRegistry = {
    // Shipments
    'GET /api/shipments': ['shipments:read'],
    'GET /api/shipments/:id': ['shipments:read'],
    'POST /api/shipments': ['shipments:write'],
    'PATCH /api/shipments/:id': ['shipments:write'],
    'DELETE /api/shipments/:id': ['shipments:write'],
    'GET /api/shipments/export/:format': ['shipments:read'],

    // Billing
    'POST /api/billing/create-payment-intent': ['billing:write'],
    'POST /api/billing/create-subscription': ['billing:write'],
    'GET /api/billing/subscriptions': ['billing:read'],
    'POST /api/billing/cancel-subscription/:id': ['billing:write'],
    'GET /api/billing/revenue': ['billing:read'],

    // AI Commands
    'POST /api/ai/commands': ['ai:command'],

    // Voice
    'POST /api/voice/ingest': ['voice:ingest'],
    'POST /api/voice/command': ['voice:command'],

    // Users
    'GET /api/users/:id': ['user:read'],
    'PATCH /api/users/:id': ['user:write'],

    // Analytics
    'GET /api/analytics/dashboard': ['analytics:read'],
    'GET /api/analytics/export': ['analytics:read'],

    // Metrics
    'GET /api/metrics/revenue/live': ['metrics:read'],
    'POST /api/metrics/revenue/clear-cache': ['admin'],
    'GET /api/metrics/revenue/export': ['metrics:export'],
};

/**
 * Get scopes for a route
 */
function getScopesForRoute(method, path) {
    const key = `${method} ${path}`;
    return routeScopeRegistry[key] || [];
}

/**
 * List all registered routes with their scopes
 */
function listAllRoutes() {
    return Object.entries(routeScopeRegistry).map(([route, scopes]) => {
        const [method, path] = route.split(' ');
        return { method, path, scopes };
    });
}

/**
 * Validate that a token has required scopes
 */
function validateScopes(tokenScopes, requiredScopes) {
    const tokenScopesSet = new Set(tokenScopes || []);
    return requiredScopes.every(s => tokenScopesSet.has(s));
}

module.exports = {
    routeScopeRegistry,
    getScopesForRoute,
    listAllRoutes,
    validateScopes,
};
