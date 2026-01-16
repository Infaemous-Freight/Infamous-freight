/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Database Seed Script for Marketplace
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedMarketplace() {
    console.log("🌱 Seeding marketplace data...");

    // Create shipper users
    const shipper1 = await prisma.user.upsert({
        where: { email: "shipper1@example.com" },
        update: {},
        create: {
            email: "shipper1@example.com",
            name: "Alice Shipper",
            role: "SHIPPER",
            planTier: "FREE",
            planStatus: "NONE",
        },
    });

    const shipper2 = await prisma.user.upsert({
        where: { email: "shipper2@example.com" },
        update: {},
        create: {
            email: "shipper2@example.com",
            name: "Bob Business",
            role: "SHIPPER",
            planTier: "PRO",
            planStatus: "ACTIVE",
        },
    });

    // Create driver users
    const driver1 = await prisma.user.upsert({
        where: { email: "driver1@example.com" },
        update: {},
        create: {
            email: "driver1@example.com",
            name: "Charlie Driver",
            role: "DRIVER",
        },
    });

    const driver2 = await prisma.user.upsert({
        where: { email: "driver2@example.com" },
        update: {},
        create: {
            email: "driver2@example.com",
            name: "Diana Trucker",
            role: "DRIVER",
        },
    });

    // Create driver profiles
    const profile1 = await prisma.driverProfile.upsert({
        where: { userId: driver1.id },
        update: {},
        create: {
            userId: driver1.id,
            isActive: true,
            lastLat: 34.0522, // Los Angeles
            lastLng: -118.2437,
            lastLocationAt: new Date(),
        },
    });

    const profile2 = await prisma.driverProfile.upsert({
        where: { userId: driver2.id },
        update: {},
        create: {
            userId: driver2.id,
            isActive: true,
            lastLat: 40.7128, // New York
            lastLng: -74.006,
            lastLocationAt: new Date(),
        },
    });

    // Add vehicles
    await prisma.vehicle.upsert({
        where: { id: "vehicle-1" },
        update: {},
        create: {
            id: "vehicle-1",
            driverId: profile1.id,
            type: "VAN",
            nickname: "White Van",
            maxWeightLbs: 3000,
            maxVolumeCuFt: 300,
        },
    });

    await prisma.vehicle.upsert({
        where: { id: "vehicle-2" },
        update: {},
        create: {
            id: "vehicle-2",
            driverId: profile2.id,
            type: "BOX_TRUCK",
            nickname: "Big Blue",
            maxWeightLbs: 10000,
            maxVolumeCuFt: 800,
        },
    });

    // Create sample job
    const sampleJob = await prisma.job.create({
        data: {
            shipperId: shipper1.id,
            status: "DRAFT",
            pickupAddress: "123 Main St, Los Angeles, CA",
            pickupLat: 34.0522,
            pickupLng: -118.2437,
            dropoffAddress: "456 Broadway, Los Angeles, CA",
            dropoffLat: 34.0589,
            dropoffLng: -118.2359,
            requiredVehicle: "VAN",
            weightLbs: 500,
            volumeCuFt: 50,
            notes: "Handle with care",
            estimatedMiles: 5.2,
            estimatedMinutes: 25,
            priceUsd: 16.99,
        },
    });

    console.log("✅ Marketplace seed complete!");
    console.log(`   Shippers: ${shipper1.email}, ${shipper2.email}`);
    console.log(`   Drivers: ${driver1.email}, ${driver2.email}`);
    console.log(`   Sample Job: ${sampleJob.id}`);
}

async function main() {
    try {
        await seedMarketplace();
    } catch (e) {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = { seedMarketplace };
