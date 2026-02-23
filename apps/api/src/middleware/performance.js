const compression = require("compression");

const compressionMiddleware = compression({
  threshold: 1024, // Only compress responses >1KB
  level: 6, // Compression level (1-9, 6 is balanced)
});

module.exports = {
  compressionMiddleware,
};
