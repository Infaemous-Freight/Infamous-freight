#!/usr/bin/env node
/**
 * Dynamic Sitemap Generator for infamousfreight.com
 * Scans pages directory and generates sitemap.xml
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://infamousfreight.com';
const PAGES_DIR = path.join(__dirname, '../apps/web/pages');
const OUTPUT_PATH = path.join(__dirname, '../apps/web/public/sitemap.xml');

// Pages to exclude from sitemap
const EXCLUDE_PAGES = [
    '_app.tsx',
    '_document.tsx',
    '_error.tsx',
    '404.tsx',
    '500.tsx',
    'api',
    '[...slug]', // Dynamic catch-all routes
];

// Priority mapping based on page importance
const PAGE_PRIORITY = {
    'index': { priority: 1.0, changefreq: 'weekly' },
    'dashboard': { priority: 0.9, changefreq: 'daily' },
    'shipments': { priority: 0.9, changefreq: 'daily' },
    'about': { priority: 0.8, changefreq: 'monthly' },
    'pricing': { priority: 0.8, changefreq: 'weekly' },
    'contact': { priority: 0.7, changefreq: 'monthly' },
    'login': { priority: 0.6, changefreq: 'monthly' },
    'signup': { priority: 0.6, changefreq: 'monthly' },
    'default': { priority: 0.5, changefreq: 'monthly' },
};

function getAllPages(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !EXCLUDE_PAGES.includes(file)) {
            getAllPages(filePath, fileList);
        } else if (
            stat.isFile() &&
            (file.endsWith('.tsx') || file.endsWith('.ts')) &&
            !EXCLUDE_PAGES.some((exclude) => file.includes(exclude))
        ) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function getPageURL(filePath) {
    const relativePath = path.relative(PAGES_DIR, filePath);
    const urlPath = relativePath
        .replace(/\.(tsx|ts)$/, '') // Remove extension
        .replace(/\/index$/, '') // Remove /index
        .replace(/\\/g, '/'); // Normalize slashes

    return urlPath === 'index' ? '/' : `/${urlPath}`;
}

function getPageConfig(url) {
    const pageName = url === '/' ? 'index' : url.replace(/^\//, '').split('/')[0];
    return PAGE_PRIORITY[pageName] || PAGE_PRIORITY.default;
}

function generateSitemap() {
    console.log('🗺️  Generating sitemap.xml...\n');

    const pages = getAllPages(PAGES_DIR);
    const today = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    const urls = pages.map((page) => {
        const url = getPageURL(page);
        const config = getPageConfig(url);
        const fullUrl = `${DOMAIN}${url}`;

        console.log(`  ✓ ${fullUrl}`);

        return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>
`;
    });

    sitemap += urls.join('');
    sitemap += `</urlset>
`;

    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');

    console.log(`\n✅ Sitemap generated successfully!`);
    console.log(`   📍 Location: ${OUTPUT_PATH}`);
    console.log(`   📊 Total URLs: ${urls.length}`);
    console.log(`\n🔍 Validate at: https://www.xml-sitemaps.com/validate-xml-sitemap.html`);
    console.log(`📤 Submit to:`);
    console.log(`   - Google Search Console: https://search.google.com/search-console`);
    console.log(`   - Bing Webmaster: https://www.bing.com/webmasters`);
}

// Run the generator
try {
    generateSitemap();
} catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    process.exit(1);
}
