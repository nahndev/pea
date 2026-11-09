import { useQuery } from '@tanstack/react-query';
import { addOnsService } from '../services/add-ons.service';

export const useAddOns = () => useQuery({ queryKey: ['add-ons'], queryFn: () => addOnsService.list(), staleTime: Infinity });
