/**
 * Express API Server Entry Point
 *
 * Initializes configuration and starts the server
 */

// Load and validate environment configuration FIRST
const config = require("./config/loadenv");

// Log startup info
console.log(`🚀 [${config.NODE_ENV}] Infamous Freight API starting...`);
console.log(`📍 Port: ${config.API_PORT}`);
console.log(`🗄️  Database: ${config.DATABASE_URL ? "configured" : "MISSING"}`);

// Start server
const app = require("./server");
const PORT = config.API_PORT || 4000;

const httpServer = app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    console.log(`💓 Health check at http://localhost:${PORT}/api/health`);
});

// Handle server errors
httpServer.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    }
    throw error;
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled Rejection:", reason);
    process.exit(1);
});
