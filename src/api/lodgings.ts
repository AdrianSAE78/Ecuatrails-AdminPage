import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LodgingCreate, LodgingDetail, LodgingPage, LodgingQuery, LodgingUpdate } from '../types/Lodgings';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export async function listLodgings(params: LodgingQuery = {}): Promise<LodgingPage> {
  const { page = 0, size = 10, q, status, minPrice, maxPrice } = params;
  const { data } = await api.get('/api/admin/lodgings', { // GET con paginación + filtros
    params: { page, size, q, status, minPrice, maxPrice },
  });
  return data;
}

export async function createLodging(body: LodgingCreate): Promise<LodgingDetail> {
  const { data } = await api.post('/api/admin/lodgings', body); // POST crear
  return data;
}

export async function updateLodging(id: number, body: LodgingUpdate): Promise<LodgingDetail> {
  const { data } = await api.put(`/api/admin/lodgings/${id}`, body); // PUT parcial
  return data;
}

export async function deleteLodging(id: number): Promise<void> {
  await api.delete(`/api/admin/lodgings/${id}`); // DELETE (409 si está en uso por rutas)
}

export function useLodgings(query: LodgingQuery) {
  return useQuery({
    queryKey: ['lodgings', query],
    queryFn: () => listLodgings(query),
    keepPreviousData: true,
  });
}

export function useCreateLodging() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LodgingCreate) => createLodging(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lodgings'] }),
  });
}

export function useUpdateLodging() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: LodgingUpdate }) => updateLodging(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lodgings'] }),
  });
}

export function useDeleteLodging() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLodging(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lodgings'] }),
  });
}
