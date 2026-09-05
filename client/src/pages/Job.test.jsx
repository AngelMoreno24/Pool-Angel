import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Job from './Job';

const serviceMocks = vi.hoisted(() => ({
  getjob: vi.fn(),
  createjob: vi.fn(),
  getCustomers: vi.fn(),
  getPropertiesByCustomer: vi.fn(),
  getTechs: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  UserAuth: () => ({ session: { user: { email: 'owner@example.com' } }, signOut: vi.fn() }),
}));

vi.mock('../services/jobService', () => serviceMocks);
vi.mock('../services/customerService', () => ({ getCustomers: serviceMocks.getCustomers }));
vi.mock('../services/propertyService', () => ({ getPropertiesByCustomer: serviceMocks.getPropertiesByCustomer }));
vi.mock('../services/techService', () => ({ getTechs: serviceMocks.getTechs }));

describe('Jobs page filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getjob.mockResolvedValue([
      {
        id: 'weekly-job',
        title: 'Weekly cleaning',
        jobType: 'RECURRING_CLEANING',
        frequency: 'WEEKLY',
        status: 'ACTIVE',
        startDate: '2026-09-07T00:00:00.000Z',
        customerId: 'customer-a',
        propertyId: 'property-a',
      },
      {
        id: 'repair-job',
        title: 'Pump repair',
        jobType: 'REPAIR',
        frequency: 'ONE_TIME',
        status: 'COMPLETED',
        startDate: '2026-09-08T00:00:00.000Z',
        customerId: 'customer-a',
        propertyId: 'property-a',
      },
    ]);
    serviceMocks.getCustomers.mockResolvedValue([{ id: 'customer-a', firstName: 'Alex', lastName: 'Rivera' }]);
    serviceMocks.getPropertiesByCustomer.mockResolvedValue([{ id: 'property-a', address: '123 Main St' }]);
    serviceMocks.getTechs.mockResolvedValue([]);
  });

  it('filters jobs by type and frequency while preserving the matching row', async () => {
    render(<MemoryRouter><Job /></MemoryRouter>);

    expect(await screen.findByText('Weekly cleaning')).toBeInTheDocument();
    expect(screen.getByText('Pump repair')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /repair/i })[0]);
    expect(screen.queryByText('Weekly cleaning')).not.toBeInTheDocument();
    expect(screen.getByText('Pump repair')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^all/i })[0]);
    fireEvent.change(screen.getByDisplayValue('Any frequency'), { target: { value: 'WEEKLY' } });
    await waitFor(() => expect(screen.getByText('Weekly cleaning')).toBeInTheDocument());
    expect(screen.queryByText('Pump repair')).not.toBeInTheDocument();
  });
});
