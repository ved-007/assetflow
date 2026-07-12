import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useApiQuery<TData = any, TError = Error>(
  key: any[],
  url: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: async () => {
      const data = await api.get(url, { params });
      return data as TData;
    },
    ...options,
  });
}

export function useApiMutation<TData = any, TVariables = any, TError = Error>(
  method: 'post' | 'patch' | 'put' | 'delete',
  urlOrFn: string | ((vars: TVariables) => string),
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const url = typeof urlOrFn === 'function' ? urlOrFn(variables) : urlOrFn;
      if (method === 'delete') {
        const data = await api.delete(url, { data: variables });
        return data as TData;
      }
      const data = await api[method](url, variables);
      return data as TData;
    },
    ...options,
  });
}
