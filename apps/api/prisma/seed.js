const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data (careful in production!)
    console.log("🗑️  Clearing existing data...");
    await prisma.shipment.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    console.log("👥 Creating users...");
    const adminPassword = await bcrypt.hash("password123", 10);
    const userPassword = await bcrypt.hash("password456", 10);

    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin User",
        password: adminPassword,
        role: "admin",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: "user@example.com",
        name: "Regular User",
        password: userPassword,
        role: "user",
      },
    });

    console.log("✅ Created users:", { admin: admin.email, user: user.email });

    // Create drivers
    console.log("🚚 Creating drivers...");
    const driver1 = await prisma.driver.create({
      data: {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0101",
        status: "available",
      },
    });

    const driver2 = await prisma.driver.create({
      data: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1-555-0102",
        status: "available",
      },
    });

    const driver3 = await prisma.driver.create({
      data: {
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        phone: "+1-555-0103",
        status: "on_break",
      },
    });

    console.log("✅ Created 3 drivers");

    // Create shipments
    console.log("📦 Creating shipments...");
    const shipments = await prisma.shipment.createMany({
      data: [
        {
          trackingId: "IFE-2026-001",
          origin: "Los Angeles, CA",
          destination: "New York, NY",
          status: "in_transit",
          driverId: driver1.id,
        },
        {
          trackingId: "IFE-2026-002",
          origin: "Chicago, IL",
          destination: "Miami, FL",
          status: "delivered",
          driverId: driver2.id,
        },
        {
          trackingId: "IFE-2026-003",
          origin: "Seattle, WA",
          destination: "Boston, MA",
          status: "pending",
          driverId: null,
        },
        {
          trackingId: "IFE-2026-004",
          origin: "Denver, CO",
          destination: "Atlanta, GA",
          status: "in_transit",
          driverId: driver3.id,
        },
        {
          trackingId: "IFE-2026-005",
          origin: "Phoenix, AZ",
          destination: "Philadelphia, PA",
          status: "pending",
          driverId: null,
        },
        {
          trackingId: "IFE-2026-006",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          status: "delivered",
          driverId: driver1.id,
        },
        {
          trackingId: "IFE-2026-007",
          origin: "San Francisco, CA",
          destination: "Las Vegas, NV",
          status: "in_transit",
          driverId: driver2.id,
        },
        {
          trackingId: "IFE-2026-008",
          origin: "Portland, OR",
          destination: "Salt Lake City, UT",
          status: "pending",
          driverId: null,
        },
      ],
    });

    console.log("✅ Created", shipments.count, "shipments");

    console.log("\n✨ Database seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   • 2 users created");
    console.log("   • 3 drivers created");
    console.log("   •", shipments.count, "shipments created");
    console.log("\n🔐 Test credentials:");
    console.log("   • Email: admin@example.com | Password: password123");
    console.log("   • Email: user@example.com  | Password: password456");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
