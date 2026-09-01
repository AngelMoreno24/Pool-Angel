import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTechs, createTech } from '../services/techService';
 
// Any component that calls useTechs() shares the same cached result - if
// Job.jsx and Route.jsx both mount around the same time, only ONE network
// request fires, not two. This is the actual "reduce requests" part.
export const useTechs = () => {
  return useQuery({
    queryKey: ['techs'],
    queryFn: async () => {
      const response = await getTechs();
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.techs)
            ? response.techs
            : [];
    },
  });
};
 
export const useCreateTech = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTech,
    onSuccess: () => {
      // Marks the 'techs' query as stale - every component using useTechs()
      // refetches and re-renders with the new tech, automatically. This is
      // the piece that's genuinely hard to hand-roll correctly with plain
      // Context - here it's one line.
      queryClient.invalidateQueries({ queryKey: ['techs'] });
    },
  });
};
 