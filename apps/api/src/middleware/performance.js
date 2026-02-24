/**
 * Performance Middleware - Phase 6 Tier 1.3
 * 
 * Enhanced compression configuration for optimal performance
 * Expected Impact: 30% bandwidth reduction, 10-15% latency improvement on mobile
 */

const compression = require("compression");

/**
 * Compression middleware with Phase 6 optimizations
 * - Only compress responses >1KB (threshold)
 * - Level 6 compression (balanced speed/size)
 * - Skip compression for already-compressed content
 */
const compressionMiddleware = compression({
  threshold: 1024,    // Only compress responses >1KB (1024 bytes)
  level: 6,           // Compression level 1-9 (6 = balanced, default)
  filter: (req, res) => {
    // Skip compression if explicitly disabled
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Skip compression for already compressed content
    const contentType = res.getHeader('Content-Type');
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/zip')
    )) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },
  // Add cache control for compressed responses
  memLevel: 8  // Memory level (1-9, higher = more memory, better compression)
});

module.exports = {
  compressionMiddleware,
};

