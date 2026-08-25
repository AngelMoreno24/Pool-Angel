import { PrismaClient } from '@prisma/client';
import { adminSupabase } from '../src/lib/supabase.js';
import { geocodeAddress } from '../src/lib/geocode.js';
 
const prisma = new PrismaClient();
 
async function findSupabaseUserByEmail(email) {
  if (!adminSupabase) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to the server .env file.');
  }
 
  const { data, error } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
 
  if (error) {
    throw error;
  }
 
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}
 
async function ensureSupabaseUser({ email, password, firstName, lastName, role }) {
  if (!adminSupabase) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to the server .env file.');
  }
 
  const existing = await findSupabaseUserByEmail(email);
  if (existing) {
    console.log(`↩️ Existing Supabase user found: ${email}`);
    return existing;
  }
 
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firstName, lastName, role },
    app_metadata: { role },
  });
 
  if (error || !data?.user) {
    throw new Error(error?.message || `Failed to create Supabase auth user for ${email}`);
  }
 
  console.log(`✓ Supabase auth user created: ${email}`);
  return data.user;
}
 
// Geocodes an address and returns { latitude, longitude }, or nulls if
// geocoding fails - mirrors propertyController.js's behavior so seeded
// properties actually show up on the Route page map, same as
// properties created through the real app do.
async function geocodeOrNull(address, city, state, zip) {
  const coords = await geocodeAddress(address, city, state, zip);
  return {
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  };
}
 
async function seedDemo() {
  try {
    console.log('🌱 Starting demo data seeding...\n');
 
    const ownerAuth = await ensureSupabaseUser({
      email: 'demo@poolangel.com',
      password: 'DemoPass123!',
      firstName: 'Demo',
      lastName: 'Owner',
      role: 'OWNER',
    });
 
    // ─────────────────────────────────────
    // 1. Create Demo Owner/User
    // ─────────────────────────────────────
    console.log('📝 Creating demo owner in Prisma...');
    const demoOwner = await prisma.user.upsert({
      where: { authId: ownerAuth.id },
      update: {
        email: ownerAuth.email,
        firstName: 'Demo',
        lastName: 'Owner',
        role: 'OWNER',
      },
      create: {
        authId: ownerAuth.id,
        email: ownerAuth.email || 'demo@poolangel.com',
        firstName: 'Demo',
        lastName: 'Owner',
        role: 'OWNER',
      },
    });
    console.log(`✓ Owner synced: ${demoOwner.email}\n`);
 
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
 
    const ownerCompanyUpdate = await prisma.user.update({
      where: { id: demoOwner.id },
      data: { companyId: demoCompany.id },
    });
    console.log(`✓ Owner company linked: ${ownerCompanyUpdate.email}\n`);
 
    // ─────────────────────────────────────
    // 3. Create Demo Technician
    // ─────────────────────────────────────
    console.log('👨‍🔧 Creating demo technician...');
    const techAuth = await ensureSupabaseUser({
      email: 'tech@poolangel.com',
      password: 'TechPass123!',
      firstName: 'John',
      lastName: 'Technician',
      role: 'TECH',
    });
 
    const demoTech = await prisma.user.upsert({
      where: { authId: techAuth.id },
      update: {
        email: techAuth.email,
        firstName: 'John',
        lastName: 'Technician',
        role: 'TECH',
        companyId: demoCompany.id,
      },
      create: {
        authId: techAuth.id,
        email: techAuth.email || 'tech@poolangel.com',
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
 
    // Additional customers
    const customer3 = await prisma.customer.upsert({
      where: { companyId_email: { companyId: demoCompany.id, email: 'michael.chen@email.com' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@email.com',
        phone: '(555) 234-5678',
      },
    });
 
    const customer4 = await prisma.customer.upsert({
      where: { companyId_email: { companyId: demoCompany.id, email: 'emily.rodriguez@email.com' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@email.com',
        phone: '(555) 345-6789',
      },
    });
 
    const customer5 = await prisma.customer.upsert({
      where: { companyId_email: { companyId: demoCompany.id, email: 'david.kim@email.com' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@email.com',
        phone: '(555) 456-7890',
      },
    });
 
    const customer6 = await prisma.customer.upsert({
      where: { companyId_email: { companyId: demoCompany.id, email: 'amanda.taylor@email.com' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        firstName: 'Amanda',
        lastName: 'Taylor',
        email: 'amanda.taylor@email.com',
        phone: '(555) 567-8901',
      },
    });
 
    console.log(`✓ Customer 1 created: ${customer1.firstName} ${customer1.lastName}`);
    console.log(`✓ Customer 2 created: ${customer2.firstName} ${customer2.lastName}`);
    console.log(`✓ Customer 3 created: ${customer3.firstName} ${customer3.lastName}`);
    console.log(`✓ Customer 4 created: ${customer4.firstName} ${customer4.lastName}`);
    console.log(`✓ Customer 5 created: ${customer5.firstName} ${customer5.lastName}`);
    console.log(`✓ Customer 6 created: ${customer6.firstName} ${customer6.lastName}\n`);
 
    // ─────────────────────────────────────
    // 5. Create Demo Properties
    // ─────────────────────────────────────
    // Real Phoenix-metro streets (Phoenix, Scottsdale, Tempe, Mesa, Glendale)
    // with plausible house numbers, geocoded so they actually appear on the
    // Route page map - same as properties created through the real app.
    console.log('🏠 Creating demo properties...');
 
    const property1Coords = await geocodeOrNull('123 Desert Ave', 'Phoenix', 'AZ', '85001');
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
        ...property1Coords,
      },
    });
 
    const property2Coords = await geocodeOrNull('456 Sunset Blvd', 'Scottsdale', 'AZ', '85251');
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
        ...property2Coords,
      },
    });
 
    const property3Coords = await geocodeOrNull('789 Ocean Drive', 'Tempe', 'AZ', '85281');
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
        ...property3Coords,
      },
    });
 
    const property4Coords = await geocodeOrNull('2150 E Camelback Rd', 'Phoenix', 'AZ', '85016');
    const property4 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '2150 E Camelback Rd' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer3.id,
        address: '2150 E Camelback Rd',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85016',
        ...property4Coords,
      },
    });
 
    const property5Coords = await geocodeOrNull('4815 N 16th St', 'Phoenix', 'AZ', '85016');
    const property5 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '4815 N 16th St' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer3.id,
        address: '4815 N 16th St',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85016',
        ...property5Coords,
      },
    });
 
    const property6Coords = await geocodeOrNull('875 N Scottsdale Rd', 'Scottsdale', 'AZ', '85257');
    const property6 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '875 N Scottsdale Rd' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer4.id,
        address: '875 N Scottsdale Rd',
        city: 'Scottsdale',
        state: 'AZ',
        zip: '85257',
        ...property6Coords,
      },
    });
 
    const property7Coords = await geocodeOrNull('620 S Mill Ave', 'Tempe', 'AZ', '85281');
    const property7 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '620 S Mill Ave' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer5.id,
        address: '620 S Mill Ave',
        city: 'Tempe',
        state: 'AZ',
        zip: '85281',
        ...property7Coords,
      },
    });
 
    const property8Coords = await geocodeOrNull('1980 W Southern Ave', 'Mesa', 'AZ', '85202');
    const property8 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '1980 W Southern Ave' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer5.id,
        address: '1980 W Southern Ave',
        city: 'Mesa',
        state: 'AZ',
        zip: '85202',
        ...property8Coords,
      },
    });
 
    const property9Coords = await geocodeOrNull('15200 N 59th Ave', 'Glendale', 'AZ', '85306');
    const property9 = await prisma.property.upsert({
      where: { companyId_address: { companyId: demoCompany.id, address: '15200 N 59th Ave' } },
      update: {},
      create: {
        companyId: demoCompany.id,
        customerId: customer6.id,
        address: '15200 N 59th Ave',
        city: 'Glendale',
        state: 'AZ',
        zip: '85306',
        ...property9Coords,
      },
    });
 
    const allProperties = [property1, property2, property3, property4, property5, property6, property7, property8, property9];
    allProperties.forEach((p, i) => console.log(`✓ Property ${i + 1} created: ${p.address}, ${p.city}`));
    console.log('');
 
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
 
    const pool4 = await prisma.pool.upsert({
      where: { propertyId: property4.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property4.id,
        type: 'In-ground',
        size: '18000 gallons',
        notes: 'Gunite pool with attached spa',
      },
    });
 
    const pool5 = await prisma.pool.upsert({
      where: { propertyId: property5.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property5.id,
        type: 'In-ground',
        size: '12000 gallons',
        notes: 'Vinyl liner, replaced 2022',
      },
    });
 
    const pool6 = await prisma.pool.upsert({
      where: { propertyId: property6.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property6.id,
        type: 'In-ground',
        size: '22000 gallons',
        notes: 'Saltwater system, heated year-round',
      },
    });
 
    const pool7 = await prisma.pool.upsert({
      where: { propertyId: property7.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property7.id,
        type: 'In-ground',
        size: '16000 gallons',
        notes: 'Fiberglass pool, low maintenance',
      },
    });
 
    const pool8 = await prisma.pool.upsert({
      where: { propertyId: property8.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property8.id,
        type: 'Above-ground',
        size: '7000 gallons',
        notes: 'Chlorine pool, older pump needs monitoring',
      },
    });
 
    const pool9 = await prisma.pool.upsert({
      where: { propertyId: property9.id },
      update: {},
      create: {
        companyId: demoCompany.id,
        propertyId: property9.id,
        type: 'In-ground',
        size: '19000 gallons',
        notes: 'Freeform design with waterfall feature',
      },
    });
 
    const allPools = [pool1, pool2, pool3, pool4, pool5, pool6, pool7, pool8, pool9];
    allPools.forEach((p, i) => console.log(`✓ Pool ${i + 1} created: ${p.type} (${p.size})`));
    console.log('');
 
    // ─────────────────────────────────────
    // 7. Create Demo Jobs
    // ─────────────────────────────────────
    console.log('📋 Creating demo jobs...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow
 
    // dayOfWeek/routeOrder use JS Date.getDay() convention (1=Mon...5=Fri),
    // matching the Route page - set on demoTech's recurring jobs so the
    // per-day routes actually have stops to show when testing that page.
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
        dayOfWeek: 1, // Monday
        routeOrder: 0,
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
        dayOfWeek: 2, // Tuesday
        routeOrder: 0,
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
        // No defaultTechId - stays unassigned, demonstrates that state on
        // the Jobs list. Won't show on any tech's personal Route page.
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
        // No dayOfWeek - one-time repairs aren't part of the recurring
        // weekly route, only recurring cleaning jobs are.
      },
    });
 
    // Additional jobs for the new customers/properties
    const job5 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer3.id,
        propertyId: property4.id,
        poolId: pool4.id,
        title: 'Weekly Pool Cleaning',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '109.99',
        notes: 'Standard weekly cleaning, spa included',
        dayOfWeek: 1, // Monday
        routeOrder: 1,
      },
    });
 
    const job6 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer3.id,
        propertyId: property5.id,
        poolId: pool5.id,
        title: 'Weekly Pool Cleaning',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '94.99',
        notes: 'Vinyl liner - avoid abrasive brushes',
        dayOfWeek: 1, // Monday
        routeOrder: 2,
      },
    });
 
    const job7 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer4.id,
        propertyId: property6.id,
        poolId: pool6.id,
        title: 'Bi-weekly Cleaning & Salt Check',
        jobType: 'RECURRING_CLEANING',
        frequency: 'BIWEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '119.99',
        notes: 'Saltwater system, check cell for scale buildup',
        dayOfWeek: 2, // Tuesday
        routeOrder: 1,
      },
    });
 
    const job8 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer5.id,
        propertyId: property7.id,
        poolId: pool7.id,
        title: 'Weekly Pool Cleaning',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '99.99',
        notes: 'Fiberglass surface, gentle brushing only',
        dayOfWeek: 3, // Wednesday
        routeOrder: 0,
      },
    });
 
    const job9 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer5.id,
        propertyId: property8.id,
        poolId: pool8.id,
        title: 'Chemical Balance Check',
        jobType: 'CHEMICAL_BALANCE',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '69.99',
        notes: 'Older pump - monitor pressure each visit',
        dayOfWeek: 3, // Wednesday
        routeOrder: 1,
      },
    });
 
    const job10 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer6.id,
        propertyId: property9.id,
        poolId: pool9.id,
        title: 'Weekly Pool Cleaning',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        price: '104.99',
        notes: 'Waterfall feature needs periodic descaling',
        dayOfWeek: 5, // Friday
        // No defaultTechId - stays unassigned, so this one intentionally
        // won't appear on demoTech's Friday route until assigned.
      },
    });
 
    const job11 = await prisma.job.create({
      data: {
        companyId: demoCompany.id,
        customerId: customer2.id,
        propertyId: property3.id,
        poolId: pool3.id,
        title: 'Weekly Skimming & Chemical Check',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: startDate,
        defaultTechId: demoTech.id,
        price: '59.99',
        notes: 'Light weekly touch-up between the monthly deep clean',
        dayOfWeek: 5, // Friday
        routeOrder: 0,
      },
    });
 
    const allJobs = [job1, job2, job3, job4, job5, job6, job7, job8, job9, job10, job11];
    allJobs.forEach((j, i) => console.log(`✓ Job ${i + 1} created: ${j.title} (${j.frequency || 'One-time'})`));
    console.log('');
    console.log('   Thursday is intentionally left empty on the demo route -');
    console.log('   useful for testing the "no jobs scheduled" empty state.\n');
 
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
    // 9. Summary
    // ─────────────────────────────────────
    console.log('✨ Demo data seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   • 1 Demo Company: "${demoCompany.name}"`);
    console.log(`   • 1 Owner: ${demoOwner.email}`);
    console.log(`   • 1 Technician: ${demoTech.email}`);
    console.log(`   • 6 Customers`);
    console.log(`   • 9 Properties (geocoded for the route map)`);
    console.log(`   • 9 Pools`);
    console.log(`   • 11 Jobs`);
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
 
