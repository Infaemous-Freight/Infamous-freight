#!/usr/bin/env node

/**
 * Automatically add React.ReactElement return types to component functions
 * to fix TS2742 type portability errors caused by React 19/18 version conflicts
 */

const fs = require('fs');
const path = require('path');

// Files and function names to fix (extracted from TypeScript errors)
const fixes = [
    { file: 'components/AvatarSelector.tsx', func: 'AvatarSelector', isExport: true },
    { file: 'components/FeedbackWidget.tsx', func: 'FeedbackWidget', isDefault: true },
    { file: 'components/Loading.tsx', func: 'LoadingSpinner', isDefault: true },
    { file: 'components/Loading.tsx', func: 'LoadingScreen', isExport: true },
    { file: 'components/Loading.tsx', func: 'PageLoader', isExport: true },
    { file: 'components/OptimizedImage.tsx', func: 'OptimizedImage', isDefault: true },
    { file: 'components/SEOHead.tsx', func: 'SEOHead', isDefault: true },
    { file: 'lib/image-optimization.tsx', func: 'OptimizedImage', isExport: true },
    { file: 'lib/image-optimization.tsx', func: 'AvatarImage', isExport: true },
    { file: 'lib/image-optimization.tsx', func: 'HeroImage', isExport: true },
    { file: 'lib/image-optimization.tsx', func: 'ThumbnailImage', isExport: true },
    { file: 'lib/structured-data.tsx', func: 'StructuredData', isExport: true },
    { file: 'pages/404.tsx', func: 'Custom404', isDefault: true },
    { file: 'pages/500.tsx', func: 'Custom500', isDefault: true },
    { file: 'pages/_app.tsx', func: 'App', isDefault: true },
    { file: 'pages/_document.tsx', func: 'Document', isDefault: true },
    { file: 'pages/_error.tsx', func: 'CustomErrorPage' },
    { file: 'pages/admin/analytics.tsx', func: 'AnalyticsDashboard', isDefault: true },
    { file: 'pages/admin/signoff-dashboard.tsx', func: 'SignOffDashboard', isDefault: true },
    { file: 'pages/admin/validation-dashboard.tsx', func: 'ValidationDashboard', isDefault: true },
    { file: 'pages/auth/callback.tsx', func: 'AuthCallbackPage', isDefault: true },
    { file: 'pages/auth/reset-password.tsx', func: 'ResetPasswordPage', isDefault: true },
    { file: 'pages/auth/sign-in.tsx', func: 'SignInPage', isDefault: true },
    { file: 'pages/auth/sign-up.tsx', func: 'SignUpPage', isDefault: true },
    { file: 'pages/connect/index.tsx', func: 'ConnectPage', isDefault: true },
    { file: 'pages/connect/refresh.tsx', func: 'ConnectRefresh', isDefault: true },
    { file: 'pages/connect/return.tsx', func: 'ConnectReturn', isDefault: true },
    { file: 'pages/dashboard.tsx', func: 'DashboardPage', isDefault: true },
    { file: 'pages/docs.tsx', func: 'DocsPage', isDefault: true },
    { file: 'pages/driver.tsx', func: 'DriverDashboard', isDefault: true },
    { file: 'pages/genesis.tsx', func: 'GenesisPage', isDefault: true },
    { file: 'pages/index-modern.tsx', func: 'Home', isDefault: true },
    { file: 'pages/index.tsx', func: 'Home', isDefault: true },
    { file: 'pages/insurance/carriers/[carrierId].tsx', func: 'CarrierInsuranceDetail', isDefault: true },
    { file: 'pages/insurance/index.tsx', func: 'InsuranceDashboard', isDefault: true },
    { file: 'pages/insurance/requirements.tsx', func: 'InsuranceRequirements', isDefault: true },
    { file: 'pages/legal/privacy-policy.tsx', func: 'PrivacyPolicy', isDefault: true },
    { file: 'pages/legal/terms-of-service.tsx', func: 'TermsOfService', isDefault: true },
    { file: 'pages/loads/active.tsx', func: 'ActiveLoadPage', isDefault: true },
    { file: 'pages/loads/index.tsx', func: 'LoadsPage', isDefault: true },
    { file: 'pages/login.tsx', func: 'LoginPage', isDefault: true },
    { file: 'pages/offline.tsx', func: 'OfflinePage', isDefault: true },
];

const webDir = path.join(__dirname, 'apps', 'web');
let successCount = 0;
let failCount = 0;

for (const { file, func, isDefault, isExport } of fixes) {
    const filePath = path.join(webDir, file);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${file}`);
        failCount++;
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Handle different export patterns
    const patterns = [
        // export default function Name() {
        new RegExp(`(export default function ${func}\\([^)]*\\))\\s*{`, 'g'),
        // export function Name() {
        new RegExp(`(export function ${func}\\([^)]*\\))\\s*{`, 'g'),
        // function Name() {  (non-exported, for _error.tsx)
        new RegExp(`(function ${func}\\([^)]*\\))\\s*{`, 'g'),
    ];

    let matched = false;
    for (const pattern of patterns) {
        const newContent = content.replace(pattern, '$1: React.ReactElement {');
        if (newContent !== content) {
            content = newContent;
            matched = true;
            break;
        }
    }

    if (matched) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed ${file} - ${func}`);
        successCount++;
    } else {
        console.log(`⚠️  Pattern not found in ${file} for ${func}`);
        failCount++;
    }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total: ${fixes.length}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

process.exit(failCount > 0 ? 1 : 0);
