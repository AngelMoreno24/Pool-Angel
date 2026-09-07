import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TechRoute from './TechRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const serviceMocks = vi.hoisted(() => ({
  getjobByTech: vi.fn(),
  getVisits: vi.fn(),
  createVisit: vi.fn(),
  checkInVisit: vi.fn(),
  completeVisit: vi.fn(),
  getPropertiesByCustomer: vi.fn(),
  getCustomers: vi.fn(),
  skipVisit: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  UserAuth: () => ({ session: { user: { id: 'tech-a-auth' } } }),
}));

vi.mock('../services/jobService', () => ({ getjobByTech: serviceMocks.getjobByTech }));
vi.mock('../services/visitService', () => ({
  getVisits: serviceMocks.getVisits,
  createVisit: serviceMocks.createVisit,
  checkInVisit: serviceMocks.checkInVisit,
  completeVisit: serviceMocks.completeVisit,
  skipVisit: serviceMocks.skipVisit,
}));
vi.mock('../services/propertyService', () => ({ getPropertiesByCustomer: serviceMocks.getPropertiesByCustomer }));
vi.mock('../services/customerService', () => ({ getCustomers: serviceMocks.getCustomers }));

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: { prototype: {}, mergeOptions: vi.fn() },
    },
    divIcon: vi.fn(() => ({})),
  },
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  Polyline: () => null,
}));

describe('Technician visit workflow', () => {
  let createdVisitDate;

  beforeEach(() => {
    vi.clearAllMocks();
    createdVisitDate = null;
    serviceMocks.getjobByTech.mockResolvedValue([{
      id: 'job-a',
      title: 'Weekly cleaning',
      customerId: 'customer-a',
      propertyId: 'property-a',
      defaultTechId: 'tech-a',
      dayOfWeek: 1,
      routeOrder: 1,
      notes: 'Check equipment',
    }]);
    serviceMocks.getVisits.mockResolvedValue([]);
    serviceMocks.getCustomers.mockResolvedValue([{ id: 'customer-a', firstName: 'Alex', lastName: 'Rivera' }]);
    serviceMocks.getPropertiesByCustomer.mockResolvedValue([{
      id: 'property-a',
      address: '123 Main St',
      latitude: 33.4,
      longitude: -112.0,
    }]);
    serviceMocks.createVisit.mockImplementation(async (data) => ({
      id: 'visit-a',
      jobId: 'job-a',
      assignedTechId: 'tech-a',
      scheduledDate: (createdVisitDate = data.scheduledDate.toISOString()),
      status: 'SCHEDULED',
      notes: 'Check equipment',
    }));
    serviceMocks.checkInVisit.mockImplementation(async () => ({
      id: 'visit-a',
      jobId: 'job-a',
      assignedTechId: 'tech-a',
      scheduledDate: createdVisitDate,
      status: 'IN_PROGRESS',
      checkInAt: '2026-09-07T09:00:00.000Z',
      notes: 'Check equipment',
    }));
    serviceMocks.completeVisit.mockImplementation(async () => ({
      id: 'visit-a',
      jobId: 'job-a',
      assignedTechId: 'tech-a',
      scheduledDate: createdVisitDate,
      status: 'COMPLETED',
      serviceData: { readings: { ph: 7.4 } },
    }));
  });

  it('creates and checks in a missing visit, then completes it with readings', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <TechRoute />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Weekly cleaning')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check in' }));

    await waitFor(() => expect(serviceMocks.checkInVisit).toHaveBeenCalledWith('visit-a'));
    expect(serviceMocks.createVisit).toHaveBeenCalledWith(expect.objectContaining({
      jobId: 'job-a',
      status: 'SCHEDULED',
    }));

    fireEvent.change(screen.getByLabelText('pH'), { target: { value: '7.4' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Complete visit' }));

    await waitFor(() => expect(serviceMocks.completeVisit).toHaveBeenCalledWith('visit-a', expect.objectContaining({
      readings: { ph: '7.4' },
    })));
  });
});
