import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemo() {
  try {
    console.log('🌱 Starting demo data seeding...\n');

    // ─────────────────────────────────────
    // 1. Create Demo Owner/User
    // ─────────────────────────────────────
    console.log('📝 Creating demo owner...');
    const demoOwner = await prisma.user.upsert({
      where: { email: 'demo@poolangel.com' },
      update: {},
      create: {
        authId: 'demo-owner-auth-123',
        email: 'demo@poolangel.com',
        firstName: 'Demo',
        lastName: 'Owner',
        role: 'OWNER',
      },
    });
    console.log(`✓ Owner created: ${demoOwner.email}\n`);

    // ─────────────────────────────────────
    // 2. Create Demo Company
    // ─────────────────────────────────────
    console.log('🏢 Creating demo company...');
    const demoCompany = await prisma.company.upsert({
      where: { ownerId: demoOwner.id },
      update: {},
      create: {
        name: 'Demo Pool Angel Company',
        ownerId: demoOwner.id,
      },
    });
    console.log(`✓ Company created: ${demoCompany.name}\n`);

    // ─────────────────────────────────────
    // 3. Create Demo Technician
    // ─────────────────────────────────────
    console.log('👨‍🔧 Creating demo technician...');
    const demoTech = await prisma.user.upsert({
      where: { email: 'tech@poolangel.com' },
      update: {},
      create: {
        authId: 'demo-tech-auth-456',
        email: 'tech@poolangel.com',
        firstName: 'John',
        lastName: 'Technician',
        role: 'TECH',
        companyId: demoCompany.id,
      },
    });
    console.log(`✓ Technician created: ${demoTech.firstName} ${demoTech.lastName}\n`);

    // ─────────────────────────────────────
    // 4. Create Demo Customers
    // ─────────────────────────────────────
    console.log('👥 Creating demo customers...');
    const customer1 = await prisma.customer.upsert({
      where: { companyId_email: { companyId: demoCompany.id, email: 'john.smith@email.com' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
      },
    });

    const customer2 = await prisma.customer.upsert({
      where: { companyId_email: { companyId: demoCompany.id, email: 'sarah.jones@email.com' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        firstName: 'Sarah',
        lastName: 'Jones',
        email: 'sarah.jones@email.com',
        phone: '(555) 987-6543',
      },
    });
    console.log(`✓ Customer 1 created: ${customer1.firstName} ${customer1.lastName}`);
    console.log(`✓ Customer 2 created: ${customer2.firstName} ${customer2.lastName}\n`);

    // ─────────────────────────────────────
    // 5. Create Demo Properties
    // ─────────────────────────────────────
    console.log('🏠 Creating demo properties...');
    const property1 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '123 Desert Ave' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer1.id,
        address: '123 Desert Ave',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85001',
      },
    });

    const property2 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '456 Sunset Blvd' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer1.id,
        address: '456 Sunset Blvd',
        city: 'Scottsdale',
        state: 'AZ',
        zip: '85251',
      },
    });

    const property3 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '789 Ocean Drive' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer2.id,
        address: '789 Ocean Drive',
        city: 'Tempe',
        state: 'AZ',
        zip: '85281',
      },
    });
    console.log(`✓ Property 1 created: ${property1.address}, ${property1.city}`);
    console.log(`✓ Property 2 created: ${property2.address}, ${property2.city}`);
    console.log(`✓ Property 3 created: ${property3.address}, ${property3.city}\n`);

    // ─────────────────────────────────────
    // 6. Create Demo Pools
    // ─────────────────────────────────────
    console.log('🏊 Creating demo pools...');
    const pool1 = await prisma.pool.upsert({
      where: { propertyId: property1.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property1.id,
        type: 'In-ground',
        size: '20000 gallons',
        notes: 'Chlorine pool, built in 2015',
      },
    });

    const pool2 = await prisma.pool.upsert({
      where: { propertyId: property2.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property2.id,
        type: 'Above-ground',
        size: '5000 gallons',
        notes: 'Salt water pool, needs filter maintenance',
      },
    });

    const pool3 = await prisma.pool.upsert({
      where: { propertyId: property3.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property3.id,
        type: 'In-ground',
        size: '15000 gallons',
        notes: 'Recently renovated pool',
      },
    });
    console.log(`✓ Pool 1 created: ${pool1.type} (${pool1.size})`);
    console.log(`✓ Pool 2 created: ${pool2.type} (${pool2.size})`);
    console.log(`✓ Pool 3 created: ${pool3.type} (${pool3.size})\n`);

    // ─────────────────────────────────────
    // 7. Create Demo Jobs
    // ─────────────────────────────────────
    console.log('📋 Creating demo jobs...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow

    const job1 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer1.id,
        propertyId: property1.id,
        poolId: pool1.id,
        title: 'Weekly Pool Cleaning',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '99.99',
        notes: 'Standard weekly maintenance and chemical balance',
      },
    });

    const job2 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer1.id,
        propertyId: property2.id,
        poolId: pool2.id,
        title: 'Bi-weekly Filter Inspection',
        jobType: 'RECURRING_CLEANING',
        frequency: 'BIWEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '79.99',
        notes: 'Filter cleaning and salt level check',
      },
    });

    const job3 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer2.id,
        propertyId: property3.id,
        poolId: pool3.id,
        title: 'Monthly Deep Clean',
        jobType: 'RECURRING_CLEANING',
        frequency: 'MONTHLY',
        status: 'ACTIVE',
        startDate: startDate,
        price: '149.99',
        notes: 'Full deep cleaning, tile scrub, and equipment inspection',
      },
    });

    const job4 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer1.id,
        propertyId: property1.id,
        poolId: pool1.id,
        title: 'Pump Repair',
        jobType: 'REPAIR',
        frequency: null,
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '299.99',
        notes: 'Repair circulation pump noise issue',
      },
    });

    console.log(`✓ Job 1 created: ${job1.title} (${job1.frequency})`);
    console.log(`✓ Job 2 created: ${job2.title} (${job2.frequency})`);
    console.log(`✓ Job 3 created: ${job3.title} (${job3.frequency})`);
    console.log(`✓ Job 4 created: ${job4.title} (One-time)\n`);

    // ─────────────────────────────────────
    // 8. Create Demo Visits
    // ─────────────────────────────────────
    console.log('📅 Creating demo visits...');
    
    // Create visits for the next 3 weeks
    for (let week = 0; week < 3; week++) {
      const visitDate = new Date(startDate);
      visitDate.setDate(visitDate.getDate() + week * 7);

      const visit1 = await prisma.visit.create({
        data: {
          companyId: demoCompany.id,
          jobId: job1.id,
          assignedTechId: demoTech.id,
          scheduledDate: visitDate,
          scheduledTime: '9:00 AM - 10:30 AM',
          status: 'SCHEDULED',
          notes: `Weekly cleaning visit for week ${week + 1}`,
        },
      });

      const visit2 = await prisma.visit.create({
        data: {
          companyId: demoCompany.id,
          jobId: job2.id,
          assignedTechId: demoTech.id,
          scheduledDate: new Date(visitDate.getTime() + 86400000), // Next day
          scheduledTime: '2:00 PM - 3:00 PM',
          status: 'SCHEDULED',
          notes: `Bi-weekly filter inspection for week ${week + 1}`,
        },
      });

      if (week === 0) {
        console.log(`✓ Visit created for ${visit1.scheduledDate.toLocaleDateString()}: ${job1.title}`);
        console.log(`✓ Visit created for ${visit2.scheduledDate.toLocaleDateString()}: ${job2.title}`);
      }
    }

    // Create monthly visit
    const monthlyVisitDate = new Date(startDate);
    monthlyVisitDate.setDate(1); // First of the month
    const visit3 = await prisma.visit.create({
      data: {
        companyId: demoCompany.id,
        jobId: job3.id,
        scheduledDate: monthlyVisitDate,
        scheduledTime: '8:00 AM - 12:00 PM',
        status: 'SCHEDULED',
        notes: 'Monthly deep clean appointment',
      },
    });
    console.log(`✓ Visit created for ${visit3.scheduledDate.toLocaleDateString()}: ${job3.title}`);

    // Create repair visit (one-time)
    const repairVisitDate = new Date(startDate);
    repairVisitDate.setDate(repairVisitDate.getDate() + 2);
    const visit4 = await prisma.visit.create({
      data: {
        companyId: demoCompany.id,
        jobId: job4.id,
        assignedTechId: demoTech.id,
        scheduledDate: repairVisitDate,
        scheduledTime: '10:00 AM - 2:00 PM',
        status: 'SCHEDULED',
        notes: 'Pump repair appointment',
      },
    });
    console.log(`✓ Visit created for ${visit4.scheduledDate.toLocaleDateString()}: ${job4.title}\n`);

    // ─────────────────────────────────────
    // 8. Summary
    // ─────────────────────────────────────
    console.log('✨ Demo data seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   • 1 Demo Company: "${demoCompany.name}"`);
    console.log(`   • 1 Owner: ${demoOwner.email}`);
    console.log(`   • 1 Technician: ${demoTech.email}`);
    console.log(`   • 2 Customers`);
    console.log(`   • 3 Properties`);
    console.log(`   • 3 Pools`);
    console.log(`   • 4 Jobs`);
    console.log(`   • 8+ Visits scheduled\n`);
    console.log('💡 Demo credentials:');
    console.log(`   Email: ${demoOwner.email}`);
    console.log(`   (You can log in with any Supabase account)\n`);
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemo();
