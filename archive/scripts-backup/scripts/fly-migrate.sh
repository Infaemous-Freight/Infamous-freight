#!/bin/bash
# Run database migrations after Fly.io deployment

set -e

APP_NAME="${1:-infamous-freight-api}"

echo "🗄️  Running database migrations for $APP_NAME..."

# SSH into the app and run migrations
flyctl ssh console -a "$APP_NAME" -C "cd /app && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Testing database connection...');
    await prisma.\$connect();
    console.log('✅ Database connected');
    
    // Run migrations
    console.log('Running migrations...');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const { stdout, stderr } = await execPromise('npx prisma migrate deploy');
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

migrate();
\""

echo "✅ Migrations completed successfully"
