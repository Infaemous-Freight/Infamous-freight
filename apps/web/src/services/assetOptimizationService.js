// Asset Optimization Pipeline
// Optimizes images, CSS, JS bundles for performance

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class AssetOptimizationService {
    constructor(config = {}) {
        this.outputDir = config.outputDir || './public/optimized';
        this.imageQuality = config.imageQuality || 80;
        this.enableWebP = config.enableWebP !== false;
        this.enableBrotli = config.enableBrotli !== false;
        this.maxBundleSize = config.maxBundleSize || 150 * 1024; // 150KB
        this.targetMetrics = {
            jsBundle: 150 * 1024,
            cssBundle: 50 * 1024,
            imageSize: 100 * 1024,
            lcp: 2500, // ms
            fid: 100, // ms
            cls: 0.1,
        };
    }

    /**
     * Optimize image for multiple formats and sizes
     */
    async optimizeImage(inputPath, _outputPrefix) {
        try {
            const originalBuffer = await fs.readFile(inputPath);
            const originalSize = originalBuffer.length;

            const optimized = {};

            // Original optimized
            const optimizedBuffer = await sharp(inputPath)
                .resize(1920, 1080, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .withMetadata()
                .toBuffer({ resolveWithObject: true });

            optimized.original = {
                size: optimizedBuffer.data.length,
                quality: this.imageQuality,
            };

            // WebP format
            if (this.enableWebP) {
                const webpBuffer = await sharp(inputPath)
                    .resize(1920, 1080, {
                        fit: 'inside',
                        withoutEnlargement: true,
                    })
                    .webp({ quality: this.imageQuality })
                    .toBuffer();

                optimized.webp = {
                    size: webpBuffer.length,
                    quality: this.imageQuality,
                    savings: ((1 - webpBuffer.length / optimizedBuffer.data.length) * 100).toFixed(2),
                };
            }

            // Responsive sizes
            const sizes = [480, 768, 1024, 1920];
            optimized.responsive = {};

            for (const size of sizes) {
                const resized = await sharp(inputPath)
                    .resize(size, Math.round((size / 1920) * 1080), {
                        fit: 'inside',
                        withoutEnlargement: true,
                    })
                    .withMetadata()
                    .toBuffer();

                optimized.responsive[`${size}w`] = {
                    size: resized.length,
                    reduction: ((1 - resized.length / originalSize) * 100).toFixed(2),
                };
            }

            logger.info('Image optimized successfully', {
                input: inputPath,
                originalSize,
                webpSize: optimized.webp?.size,
                savings: optimized.webp?.savings || 'N/A',
            });

            return optimized;
        } catch (error) {
            logger.error('Image optimization failed', {
                file: inputPath,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Analyze JavaScript bundle
     */
    async analyzeJSBundle(bundlePath) {
        try {
            const stats = await fs.stat(bundlePath);
            const bundleSize = stats.size;

            const analysis = {
                file: bundlePath,
                size: bundleSize,
                sizeKB: (bundleSize / 1024).toFixed(2),
                maxSize: this.targetMetrics.jsBundle,
                maxSizeKB: (this.targetMetrics.jsBundle / 1024).toFixed(2),
                exceeds: bundleSize > this.targetMetrics.jsBundle,
                reductionNeeded: bundleSize > this.targetMetrics.jsBundle
                    ? (((bundleSize - this.targetMetrics.jsBundle) / bundleSize) * 100).toFixed(2)
                    : 0,
            };

            logger.info('JS bundle analyzed', {
                file: path.basename(bundlePath),
                size: analysis.sizeKB,
                exceeds: analysis.exceeds,
            });

            return analysis;
        } catch (error) {
            logger.error('Failed to analyze JS bundle', {
                file: bundlePath,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate code splitting recommendations
     */
    generateCodeSplittingRecommendations(bundleAnalysis) {
        const recommendations = [];

        if (bundleAnalysis.exceeds) {
            recommendations.push({
                priority: 'high',
                action: 'Code Splitting by Route',
                description: 'Implement dynamic imports for route-based code splitting',
                example: `import dynamic from 'next/dynamic';
const Dashboard = dynamic(() => import('./Dashboard'), { loading: () => <div>Loading...</div> });`,
                estimatedSavings: `${bundleAnalysis.reductionNeeded}%`,
            });

            recommendations.push({
                priority: 'high',
                action: 'Extract Heavy Dependencies',
                description: 'Move large libraries to dynamic imports or CDN',
                examples: ['moment.js', 'lodash', 'date-fns'],
                estimatedSavings: '15-25%',
            });

            recommendations.push({
                priority: 'medium',
                action: 'Tree Shaking',
                description: 'Ensure proper ES modules and remove unused exports',
                commands: ['npx webpack-bundle-analyzer', 'npm run analyze'],
            });
        }

        return recommendations;
    }

    /**
     * Get optimization metrics
     */
    async getOptimizationMetrics() {
        return {
            targets: this.targetMetrics,
            recommendations: [
                {
                    metric: 'LCP (Largest Contentful Paint)',
                    target: '< 2.5s',
                    optimizations: [
                        'Preload critical resources',
                        'Optimize images',
                        'Defer non-critical CSS',
                        'Implement server-side rendering',
                    ],
                },
                {
                    metric: 'FID (First Input Delay)',
                    target: '< 100ms',
                    optimizations: [
                        'Break up long tasks',
                        'Use Web Workers',
                        'Optimize third-party scripts',
                        'Implement code splitting',
                    ],
                },
                {
                    metric: 'CLS (Cumulative Layout Shift)',
                    target: '< 0.1',
                    optimizations: [
                        'Set size attributes',
                        'Avoid inserting content above viewport',
                        'Use CSS transitions for animations',
                        'Optimize font loading',
                    ],
                },
            ],
        };
    }

    /**
     * Generate HTML report
     */
    async generateReport(analysis) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Asset Optimization Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 20px 0; padding: 10px; border-left: 4px solid #007bff; }
    .pass { border-left-color: #28a745; }
    .fail { border-left-color: #dc3545; }
    .warning { border-left-color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Asset Optimization Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <div class="metric ${analysis.jsBundle?.exceeds ? 'fail' : 'pass'}">
    <h2>JavaScript Bundle</h2>
    <p>Size: ${analysis.jsBundle?.sizeKB} KB / ${analysis.jsBundle?.maxSizeKB} KB</p>
    <p>Status: ${analysis.jsBundle?.exceeds ? '❌ EXCEEDS' : '✅ PASS'}</p>
  </div>
  
  <h2>Recommendations</h2>
  <ul>
    ${analysis.recommendations?.map(r => `<li>${r.description}</li>`).join('') || ''}
  </ul>
</body>
</html>
    `;

        return html;
    }
}

module.exports = new AssetOptimizationService();
