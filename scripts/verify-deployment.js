#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Validates all 4 framework components before production deployment
 * 
 * Usage: node scripts/verify-deployment.js
 */

const fs = require('fs');
const path = require('path');

const CHECKS = {
    files: [],
    imports: [],
    routes: [],
    env: [],
    database: [],
    results: []
};

function log(level, message) {
    const colors = {
        '✓': '\x1b[32m',    // Green
        '✗': '\x1b[31m',    // Red
        '⚠': '\x1b[33m',    // Yellow
        '→': '\x1b[36m',    // Cyan
        'RESET': '\x1b[0m'
    };

    const symbol = message.startsWith('✓') ? '✓' :
        message.startsWith('✗') ? '✗' :
            message.startsWith('⚠') ? '⚠' : '→';

    const color = colors[symbol] || colors['→'];
    console.log(`${color}${message}${colors.RESET}`);
}

function checkFile(filePath, description) {
    const fullPath = path.resolve(__dirname, '..', filePath);
    const exists = fs.existsSync(fullPath);

    if (exists) {
        log('✓', `${description}`);
        CHECKS.results.push({ check: description, status: 'pass' });
    } else {
        log('✗', `MISSING: ${description} (${filePath})`);
        CHECKS.results.push({ check: description, status: 'fail', path: filePath });
    }

    return exists;
}

function checkFileContains(filePath, searchStr, description) {
    const fullPath = path.resolve(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
        log('✗', `File not found: ${filePath}`);
        CHECKS.results.push({ check: description, status: 'fail', reason: 'file_not_found' });
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const found = content.includes(searchStr);

    if (found) {
        log('✓', `${description}`);
        CHECKS.results.push({ check: description, status: 'pass' });
    } else {
        log('✗', `NOT FOUND in ${filePath}: "${searchStr}"`);
        CHECKS.results.push({ check: description, status: 'fail', reason: 'content_not_found' });
    }

    return found;
}

function main() {
    console.log('\n📋 FRAMEWORK DEPLOYMENT VERIFICATION\n');

    // ==================== COMPONENT 1: RBAC ====================
    log('→', '=== Component 1: RBAC + Auth ===\n');

    checkFile('packages/shared/src/rbac.ts', 'RBAC types exist (rbac.ts)');
    checkFileContains('packages/shared/src/rbac.ts', 'UserRole', 'UserRole enum defined');
    checkFileContains('packages/shared/src/rbac.ts', 'Permission', 'Permission enum defined');
    checkFileContains('packages/shared/src/rbac.ts', 'ROLE_PERMISSIONS', 'ROLE_PERMISSIONS map defined');

    checkFile('apps/api/src/middleware/rbac.js', 'RBAC middleware exists (rbac.js)');
    checkFileContains('apps/api/src/middleware/rbac.js', 'requirePermission', 'requirePermission exported');
    checkFileContains('apps/api/src/middleware/rbac.js', 'requireRole', 'requireRole exported');
    checkFileContains('apps/api/src/middleware/rbac.js', 'requireMinimumRole', 'requireMinimumRole exported');

    checkFile('apps/api/src/middleware/authRBAC.js', 'Enhanced auth exists (authRBAC.js)');
    checkFileContains('apps/api/src/middleware/authRBAC.js', 'authenticateWithRBAC', 'authenticateWithRBAC exported');
    checkFileContains('apps/api/src/middleware/authRBAC.js', 'createToken', 'createToken exported');

    console.log('');

    // ==================== COMPONENT 2: DISPATCH ====================
    log('→', '=== Component 2: Dispatch Module ===\n');

    checkFile('apps/api/src/routes/dispatch.js', 'Dispatch routes exist (dispatch.js)');
    checkFileContains('apps/api/src/routes/dispatch.js', '/drivers', 'Drivers endpoints defined');
    checkFileContains('apps/api/src/routes/dispatch.js', '/assignments', 'Assignments endpoints defined');
    checkFileContains('apps/api/src/routes/dispatch.js', '/optimize', 'Optimization endpoint defined');
    checkFileContains('apps/api/src/routes/dispatch.js', 'requirePermission', 'Permission checks included');

    console.log('');

    // ==================== COMPONENT 3: AGENTS ====================
    log('→', '=== Component 3: Agent Queueing ===\n');

    checkFile('apps/api/src/queue/agents.js', 'Agent workers exist (agents.js)');
    checkFileContains('apps/api/src/queue/agents.js', 'dispatchWorker', 'Dispatch worker defined');
    checkFileContains('apps/api/src/queue/agents.js', 'invoiceAuditWorker', 'Invoice audit worker defined');
    checkFileContains('apps/api/src/queue/agents.js', 'etaPredictionWorker', 'ETA prediction worker defined');
    checkFileContains('apps/api/src/queue/agents.js', 'analyticsWorker', 'Analytics worker defined');
    checkFileContains('apps/api/src/queue/agents.js', 'concurrency', 'Concurrency controls set');

    console.log('');

    // ==================== COMPONENT 4: DEPLOYMENT ====================
    log('→', '=== Component 4: Deployment Configs ===\n');

    checkFile('fly.toml', 'Fly.io config exists');
    checkFileContains('fly.toml', 'app = ', 'Fly app name configured');
    checkFileContains('fly.toml', 'internal_port = 3001', 'Correct API port configured');
    checkFileContains('fly.toml', 'PostgreSQL', 'Database service configured (in comment or config)');

    checkFile('apps/web/vercel.json', 'Vercel config exists');
    checkFileContains('apps/web/vercel.json', 'nextjs', 'Next.js framework configured');
    checkFileContains('apps/web/vercel.json', 'buildCommand', 'Build command configured');

    checkFile('apps/api/Dockerfile', 'Docker image configured');
    checkFileContains('apps/api/Dockerfile', 'node:20', 'Node 20 runtime used');
    checkFileContains('apps/api/Dockerfile', 'openssl', 'OpenSSL dependencies included');
    checkFileContains('apps/api/Dockerfile', 'pnpm install', 'pnpm dependency installation');

    checkFile('.github/workflows/deploy.yml', 'CI/CD pipeline configured');
    checkFileContains('.github/workflows/deploy.yml', 'vercel/action', 'Vercel deployment step');
    checkFileContains('.github/workflows/deploy.yml', 'flyctl deploy', 'Fly.io deployment step');

    console.log('');

    // ==================== INTEGRATION ====================
    log('→', '=== Integration Checks ===\n');

    checkFileContains('apps/api/src/app.js', 'rbac', 'RBAC middleware registered (check app.js)');
    checkFileContains('apps/api/src/app.js', 'dispatch', 'Dispatch routes registered (check app.js)');

    console.log('');

    // ==================== ENVIRONMENT ====================
    log('→', '=== Environment Configuration ===\n');

    const envExists = fs.existsSync(path.resolve(__dirname, '..', '.env.local'));
    if (envExists) {
        log('✓', '.env.local exists');
        CHECKS.results.push({ check: '.env.local exists', status: 'pass' });
    } else {
        log('⚠', 'RECOMMENDED: Create .env.local from .env.example');
        CHECKS.results.push({ check: '.env.local exists', status: 'warn' });
    }

    checkFile('.env.example', 'Environment template exists (.env.example)');
    checkFileContains('.env.example', 'JWT_SECRET', 'JWT_SECRET documented');
    checkFileContains('.env.example', 'DATABASE_URL', 'DATABASE_URL documented');
    checkFileContains('.env.example', 'REDIS_URL', 'REDIS_URL documented');

    console.log('');

    // ==================== DOCUMENTATION ====================
    log('→', '=== Documentation ===\n');

    checkFile('FRAMEWORK_INTEGRATION_GUIDE.md', 'Integration guide exists');
    checkFile('FRAMEWORK_SETUP_GUIDE.md', 'Setup guide exists');
    checkFile('README.md', 'README exists');

    console.log('');

    // ==================== SUMMARY ====================
    const passed = CHECKS.results.filter(r => r.status === 'pass').length;
    const failed = CHECKS.results.filter(r => r.status === 'fail').length;
    const warned = CHECKS.results.filter(r => r.status === 'warn').length;
    const total = CHECKS.results.length;

    console.log('='.repeat(50));
    console.log(`\n📊 RESULTS: ${passed}/${total} checks passed\n`);

    if (failed > 0) {
        log('✗', `${failed} CRITICAL check(s) failed - Fix before deployment`);
    } else if (warned > 0) {
        log('⚠', `${warned} recommendation(s) - Consider addressing`);
    } else {
        log('✓', 'All critical checks passed! ✨');
    }

    if (failed === 0 && warned === 0) {
        console.log('\n✅ Framework is ready for deployment!\n');
        console.log('Next steps:');
        console.log('  1. pnpm dev                    # Test locally');
        console.log('  2. pnpm test                   # Run test suite');
        console.log('  3. git push origin main        # Trigger CI/CD');
        console.log('  4. Check GitHub Actions logs   # Monitor deployment');
        console.log('  5. curl https://api.fly.dev/api/health  # Verify production');
        console.log('');
        process.exit(0);
    } else if (failed === 0) {
        console.log('\n⚠️ Framework ready (with recommendations)\n');
        process.exit(0);
    } else {
        console.log('\n❌ Fix failures before deploying\n');
        process.exit(1);
    }
}

main();
