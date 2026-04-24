const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const mobilePwaIndex = path.join(rootDir, 'apps', 'web', 'dist', 'driver-pwa', 'index.html');

if (!fs.existsSync(mobilePwaIndex)) {
  console.error(
    'Mobile PWA build artifact missing: expected apps/web/dist/driver-pwa/index.html after web build.',
  );
  process.exit(1);
}

console.log('Mobile PWA artifact verified:', mobilePwaIndex);
