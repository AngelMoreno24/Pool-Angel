import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomers } from '../services/customerService';
import { createjob, deletejob, getjob, getjobById, getjobByTech, updatejob } from '../services/jobService';
import { getPropertiesByCustomer, getPropertyById, updateProperty, deleteProperty } from '../services/propertyService';
import { getTechs } from '../services/techService';
import {
  checkInVisit,
  completeVisit,
  createVisit,
  getVisits,
  getVisitsByProperty,
  rescheduleVisit,
  skipVisit,
} from '../services/visitService';

export const asList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.properties)) return response.properties;
  if (Array.isArray(response?.techs)) return response.techs;
  return [];
};

export const useCustomers = (enabled = true) => useQuery({
  queryKey: ['customers'],
  queryFn: async () => asList(await getCustomers()),
  enabled,
});

export const useTechsQuery = () => useQuery({
  queryKey: ['techs'],
  queryFn: async () => asList(await getTechs()),
});

export const useJobs = ({ technicianId } = {}) => useQuery({
  queryKey: technicianId ? ['jobs', 'tech', technicianId] : ['jobs'],
  queryFn: async () => asList(await (technicianId ? getjobByTech(technicianId) : getjob())),
});

export const useJob = (id) => useQuery({
  queryKey: ['job', id],
  queryFn: () => getjobById(id),
  enabled: Boolean(id),
});

export const useCustomerProperties = (customerId) => useQuery({
  queryKey: ['properties', customerId],
  queryFn: async () => asList(await getPropertiesByCustomer(customerId)),
  enabled: Boolean(customerId),
});

export const useAllCustomerProperties = (customers) => useQuery({
  queryKey: ['properties', 'all', customers.map((customer) => customer.id)],
  queryFn: async () => {
    const responses = await Promise.all(customers.map((customer) => getPropertiesByCustomer(customer.id)));
    return responses.flatMap(asList);
  },
  enabled: customers.length > 0,
});

export const useProperty = (id) => useQuery({
  queryKey: ['property', id],
  queryFn: () => getPropertyById(id),
  enabled: Boolean(id),
});

export const useVisits = () => useQuery({
  queryKey: ['visits'],
  queryFn: async () => asList(await getVisits()),
});

export const usePropertyVisits = (propertyId) => useQuery({
  queryKey: ['propertyVisits', propertyId],
  queryFn: async () => asList(await getVisitsByProperty(propertyId)),
  enabled: Boolean(propertyId),
});

const invalidateOperationalData = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['jobs'] });
  queryClient.invalidateQueries({ queryKey: ['job'] });
  queryClient.invalidateQueries({ queryKey: ['visits'], refetchType: 'none' });
  queryClient.invalidateQueries({ queryKey: ['propertyVisits'] });
};

const cacheVisit = (queryClient, visit) => {
  if (!visit) return;
  queryClient.setQueryData(['visits'], (current = []) => {
    const exists = current.some((item) => item.id === visit.id);
    return exists ? current.map((item) => item.id === visit.id ? visit : item) : [...current, visit];
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createjob,
    onSuccess: () => invalidateOperationalData(queryClient),
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatejob(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
      invalidateOperationalData(queryClient);
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletejob,
    onSuccess: () => invalidateOperationalData(queryClient),
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProperty(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (data) => createVisit(data), onSuccess: (visit) => { cacheVisit(queryClient, visit); invalidateOperationalData(queryClient); } });
};

export const useCheckInVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id) => checkInVisit(id), onSuccess: (visit) => { cacheVisit(queryClient, visit); invalidateOperationalData(queryClient); } });
};

export const useCompleteVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => completeVisit(id, data), onSuccess: (visit) => { cacheVisit(queryClient, visit); invalidateOperationalData(queryClient); } });
};

export const useSkipVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }) => skipVisit(id, reason), onSuccess: (visit) => { cacheVisit(queryClient, visit); invalidateOperationalData(queryClient); } });
};

export const useRescheduleVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => rescheduleVisit(id, data), onSuccess: () => invalidateOperationalData(queryClient) });
};