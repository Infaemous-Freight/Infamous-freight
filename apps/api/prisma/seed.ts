/**
 * Infamous Freight — Database Seed Script
 * Creates sample data for first carrier onboarding
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  await prisma.$transaction(async (tx) => {
    // Create first carrier (demo data)
    const carrier = await tx.carrier.upsert({
      where: { email: 'demo@infamousfreight.com' },
      update: {},
      create: {
        email: 'demo@infamousfreight.com',
        name: 'Acme Trucking LLC',
        mcNumber: 'MC-123456',
        dotNumber: '1234567',
        phone: '(214) 555-0100',
        address: '123 Main St, Dallas, TX 75201',
        status: 'active',
        subscriptionTier: 'growth',
        stripeCustomerId: 'cus_demo',
      },
    });

    console.log(`✅ Carrier created: ${carrier.name}`);

    // Create sample drivers
    const driver1 = await tx.driver.upsert({
      where: { id: 'driver_1' },
      update: {},
      create: {
        id: 'driver_1',
        carrierId: carrier.id,
        name: 'Marcus T.',
        phone: '214-555-0101',
        licenseNumber: 'CDL-123456',
        licenseState: 'TX',
        equipmentType: 'Dry Van',
        status: 'available',
        currentLat: 32.7767,
        currentLng: -96.7970,
        hosStatus: 'on_duty',
        hoursRemaining: 8.5,
      },
    });
    const driver2 = await tx.driver.upsert({
      where: { id: 'driver_2' },
      update: {},
      create: {
        id: 'driver_2',
        carrierId: carrier.id,
        name: 'James R.',
        phone: '404-555-0102',
        licenseNumber: 'CDL-234567',
        licenseState: 'GA',
        equipmentType: 'Reefer',
        status: 'driving',
        currentLat: 33.7490,
        currentLng: -84.3880,
        hosStatus: 'driving',
        hoursRemaining: 4.2,
      },
    });
    const driver3 = await tx.driver.upsert({
      where: { id: 'driver_3' },
      update: {},
      create: {
        id: 'driver_3',
        carrierId: carrier.id,
        name: 'David K.',
        phone: '713-555-0103',
        licenseNumber: 'CDL-345678',
        licenseState: 'TX',
        equipmentType: 'Flatbed',
        status: 'available',
        currentLat: 29.7604,
        currentLng: -95.3698,
        hosStatus: 'off_duty',
        hoursRemaining: 11.0,
      },
    });
    const drivers = [driver1, driver2, driver3];

    console.log(`✅ ${drivers.length} drivers created`);

    // Create sample loads
    const load1 = await tx.load.upsert({
      where: { id: 'load_1' },
      update: {},
      create: {
        id: 'load_1',
        carrierId: carrier.id,
        driverId: 'driver_1',
        brokerName: 'RXO',
        brokerMc: 'MC-693616',
        originCity: 'Chicago',
        originState: 'IL',
        originLat: 41.8781,
        originLng: -87.6298,
        destCity: 'Dallas',
        destState: 'TX',
        destLat: 32.7767,
        destLng: -96.7970,
        distance: 925,
        rate: 3200,
        ratePerMile: 3.46,
        equipmentType: 'Dry Van',
        weight: 32000,
        status: 'in_transit',
        pickupDate: new Date(),
        deliveryDate: new Date(Date.now() + 86400000),
      },
    });
    const load2 = await tx.load.upsert({
      where: { id: 'load_2' },
      update: {},
      create: {
        id: 'load_2',
        carrierId: carrier.id,
        brokerName: 'TQL',
        brokerMc: 'MC-472321',
        originCity: 'Atlanta',
        originState: 'GA',
        originLat: 33.7490,
        originLng: -84.3880,
        destCity: 'Charlotte',
        destState: 'NC',
        destLat: 35.2271,
        destLng: -80.8431,
        distance: 245,
        rate: 1850,
        ratePerMile: 2.71,
        equipmentType: 'Dry Van',
        weight: 28000,
        status: 'available',
        pickupDate: new Date(Date.now() + 86400000),
        deliveryDate: new Date(Date.now() + 172800000),
      },
    });
    const loads = [load1, load2];

    console.log(`✅ ${loads.length} loads created`);

    // Create sample invoice
    await tx.invoice.upsert({
      where: { invoiceNumber: 'INV-240421-001' },
      update: {},
      create: {
        id: 'inv_1',
        loadId: 'load_1',
        carrierId: carrier.id,
        invoiceNumber: 'INV-240421-001',
        brokerName: 'RXO',
        brokerEmail: 'ap@rxo.com',
        amount: 3200,
        status: 'sent',
        dueDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    console.log('✅ Invoice created');

    console.log('\n🎉 Seed complete! Login with:');
    console.log('   Email: demo@infamousfreight.com');
    console.log('   Password: (set via Supabase auth)');
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
