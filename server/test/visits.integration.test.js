import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const { prismaMock, supabaseMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    customer: { findMany: vi.fn(), findFirst: vi.fn() },
    job: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    property: { findFirst: vi.fn(), findMany: vi.fn() },
    pool: { findFirst: vi.fn() },
    note: { findMany: vi.fn() },
    visit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
  },
  supabaseMock: {
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('../src/lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../src/lib/supabase.js', () => ({
  default: supabaseMock,
  adminSupabase: null,
}));

const { default: app } = await import('../src/app.js');

const owner = {
  id: 'owner-db-id',
  authId: 'owner-auth-id',
  email: 'owner@example.com',
  role: 'OWNER',
  companyId: 'company-a',
};

const techA = {
  id: 'tech-a',
  authId: 'tech-a-auth',
  email: 'tech-a@example.com',
  role: 'TECH',
  companyId: 'company-a',
};

const techB = {
  id: 'tech-b',
  authId: 'tech-b-auth',
  email: 'tech-b@example.com',
  role: 'TECH',
  companyId: 'company-a',
};

const authenticateAs = (user) => {
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: { id: user.authId } },
    error: null,
  });
  prismaMock.user.findUnique.mockImplementation(({ where }) => {
    if (where?.authId) return Promise.resolve(user);
    if (where?.id === techA.id) return Promise.resolve(techA);
    if (where?.id === techB.id) return Promise.resolve(techB);
    return Promise.resolve(null);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  authenticateAs(owner);
});

describe('company and technician authorization', () => {
  it('owner can access only their company customer data', async () => {
    prismaMock.customer.findMany.mockResolvedValue([
      { id: 'customer-a', companyId: owner.companyId, firstName: 'A' },
    ]);

    const response = await request(app)
      .get('/customers/getAll')
      .set('Authorization', 'Bearer owner-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith({
      where: { companyId: owner.companyId },
    });
  });

  it('technician sees only visits assigned to that technician', async () => {
    authenticateAs(techA);
    prismaMock.visit.findMany.mockResolvedValue([
      { id: 'visit-a', assignedTechId: techA.id, companyId: techA.companyId },
    ]);

    const response = await request(app)
      .get('/visits/getAll')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(prismaMock.visit.findMany).toHaveBeenCalledWith({
      where: { companyId: techA.companyId, assignedTechId: techA.id },
      orderBy: { scheduledDate: 'asc' },
    });
  });

  it('technician sees only customers connected to their assigned jobs or visits', async () => {
    authenticateAs(techA);
    prismaMock.customer.findMany.mockResolvedValue([
      { id: 'customer-a', companyId: techA.companyId, firstName: 'A' },
    ]);

    const response = await request(app)
      .get('/customers/getAll')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith({
      where: {
        companyId: techA.companyId,
        jobs: {
          some: {
            OR: [
              { defaultTechId: techA.id },
              { visits: { some: { assignedTechId: techA.id } } },
            ],
          },
        },
      },
    });
  });

  it('technician can open only an assigned customer profile', async () => {
    authenticateAs(techA);
    prismaMock.customer.findFirst.mockResolvedValue({
      id: 'customer-a',
      companyId: techA.companyId,
      firstName: 'A',
    });

    const response = await request(app)
      .get('/customers/customer-a')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(prismaMock.customer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'customer-a',
        companyId: techA.companyId,
        jobs: {
          some: {
            OR: [
              { defaultTechId: techA.id },
              { visits: { some: { assignedTechId: techA.id } } },
            ],
          },
        },
      },
    });
  });

  it('technician can read property details for assigned work only', async () => {
    authenticateAs(techA);
    prismaMock.property.findFirst.mockResolvedValue({
      id: 'property-a',
      companyId: techA.companyId,
      address: '123 Main St',
    });

    const response = await request(app)
      .get('/properties/property-a')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(prismaMock.property.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'property-a',
        companyId: techA.companyId,
        jobs: {
          some: {
            OR: [
              { defaultTechId: techA.id },
              { visits: { some: { assignedTechId: techA.id } } },
            ],
          },
        },
      },
    });
  });

  it('technician can read pool details only for assigned properties', async () => {
    authenticateAs(techA);
    prismaMock.pool.findFirst.mockResolvedValue({
      id: 'pool-a',
      propertyId: 'property-a',
      companyId: techA.companyId,
    });

    const response = await request(app)
      .get('/pools/property/property-a')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(prismaMock.pool.findFirst).toHaveBeenCalledWith({
      where: {
        propertyId: 'property-a',
        companyId: techA.companyId,
        property: {
          is: {
            jobs: {
              some: {
                OR: [
                  { defaultTechId: techA.id },
                  { visits: { some: { assignedTechId: techA.id } } },
                ],
              },
            },
          },
        },
      },
      include: { property: true },
    });
  });

  it('technician notes are limited to assigned work and exclude owner-only notes', async () => {
    authenticateAs(techA);
    prismaMock.customer.findMany.mockResolvedValue([{ id: 'customer-a' }]);
    prismaMock.property.findMany.mockResolvedValue([{ id: 'property-a' }]);
    prismaMock.visit.findMany.mockResolvedValue([{ id: 'visit-a' }]);
    prismaMock.note.findMany.mockResolvedValue([{ id: 'note-a', ownerOnly: false }]);

    const response = await request(app)
      .get('/notes/getAll')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(prismaMock.note.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        companyId: techA.companyId,
        ownerOnly: false,
        OR: [
          { customerId: { in: ['customer-a'] } },
          { propertyId: { in: ['property-a'] } },
          { visitId: { in: ['visit-a'] } },
        ],
      },
    }));
    expect(prismaMock.visit.findMany).toHaveBeenCalledWith({
      where: {
        companyId: techA.companyId,
        OR: [
          { assignedTechId: techA.id },
          { job: { is: { defaultTechId: techA.id } } },
        ],
      },
      select: { id: true },
    });
  });

  it('technician cannot access another technician visit', async () => {
    authenticateAs(techA);
    prismaMock.visit.findUnique.mockResolvedValue({
      id: 'visit-b',
      companyId: techA.companyId,
      assignedTechId: techB.id,
    });

    const response = await request(app)
      .get('/visits/visit-b')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Visit not found');
  });
});

describe('visit lifecycle', () => {
  it('check-in records checkInAt and moves the visit in progress', async () => {
    const visit = {
      id: 'visit-a',
      companyId: owner.companyId,
      assignedTechId: techA.id,
      status: 'SCHEDULED',
      checkInAt: null,
    };
    const updated = { ...visit, status: 'IN_PROGRESS', checkInAt: '2026-09-05T09:00:00.000Z' };
    authenticateAs(techA);
    prismaMock.visit.findUnique.mockResolvedValue(visit);
    prismaMock.visit.update.mockResolvedValue(updated);

    const response = await request(app)
      .post('/visits/visit-a/check-in')
      .set('Authorization', 'Bearer tech-token');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
    expect(prismaMock.visit.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: visit.id },
      data: expect.objectContaining({ status: 'IN_PROGRESS', checkInAt: expect.any(Date) }),
    }));
  });

  it('completion records checkOutAt and readings', async () => {
    const visit = {
      id: 'visit-a',
      companyId: owner.companyId,
      assignedTechId: techA.id,
      status: 'IN_PROGRESS',
      checkInAt: new Date('2026-09-05T09:00:00.000Z'),
      serviceData: {},
    };
    const updated = { ...visit, status: 'COMPLETED', checkOutAt: new Date() };
    authenticateAs(techA);
    prismaMock.visit.findUnique.mockResolvedValue(visit);
    prismaMock.visit.update.mockResolvedValue(updated);

    const response = await request(app)
      .post('/visits/visit-a/complete')
      .set('Authorization', 'Bearer tech-token')
      .send({ notes: 'Balanced water', readings: { ph: 7.4, chlorine: 2.5 } });

    expect(response.status).toBe(200);
    expect(prismaMock.visit.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'COMPLETED',
        checkOutAt: expect.any(Date),
        serviceData: expect.objectContaining({ readings: { ph: 7.4, chlorine: 2.5 } }),
      }),
    }));
  });

  it('skipping requires a reason', async () => {
    authenticateAs(techA);

    const response = await request(app)
      .post('/visits/visit-a/skip')
      .set('Authorization', 'Bearer tech-token')
      .send({});

    expect(response.status).toBe(400);
    expect(prismaMock.visit.findUnique).not.toHaveBeenCalled();
  });

  it('owner rescheduling resets a skipped visit to scheduled', async () => {
    const visit = {
      id: 'visit-a',
      companyId: owner.companyId,
      assignedTechId: techA.id,
      status: 'SKIPPED',
      checkInAt: new Date(),
      checkOutAt: null,
    };
    const updated = { ...visit, status: 'SCHEDULED', checkInAt: null };
    prismaMock.visit.findFirst.mockResolvedValue(visit);
    prismaMock.visit.update.mockResolvedValue(updated);

    const response = await request(app)
      .post('/visits/visit-a/reschedule')
      .set('Authorization', 'Bearer owner-token')
      .send({ scheduledDate: '2026-09-08' });

    expect(response.status).toBe(200);
    expect(prismaMock.visit.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'SCHEDULED',
        scheduledDateKey: '2026-09-08',
        checkInAt: null,
        checkOutAt: null,
      }),
    }));
  });

  it('rejects duplicate visits for the same job and date', async () => {
    prismaMock.job.findUnique.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      companyId: owner.companyId,
      defaultTechId: techA.id,
    });
    prismaMock.visit.create.mockRejectedValue({ code: 'P2002' });

    const response = await request(app)
      .post('/visits/create')
      .set('Authorization', 'Bearer owner-token')
      .send({ jobId: '00000000-0000-4000-8000-000000000001', scheduledDate: '2026-09-08' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('A visit already exists for this job on that date');
  });
});
