import api from './axios';

export interface Category {
  id: number | string;
  code: string;
  name: string;
}

export interface ListParams { page?: number; size?: number; q?: string }
export interface ListResult { rows: Category[]; total: number }

// Normaliza diferentes formatos de respuesta del backend (lista simple o paginada)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeListResponse(data: any): ListResult {
  if (Array.isArray(data)) {
    return { rows: data, total: data.length };
  }
  if (data && Array.isArray(data.records)) {
    return { rows: data.records, total: data.total ?? data.records.length };
  }
  if (data && Array.isArray(data.items)) {
    return { rows: data.items, total: data.total ?? data.items.length };
  }
  return { rows: [], total: 0 };
}

export async function listCategories(params: ListParams = {}): Promise<ListResult> {
  const { data } = await api.get('/api/admin/categories', { params });
  return normalizeListResponse(data);
}

export async function createCategory(payload: { code: string; name: string }): Promise<Category> {
  const { data } = await api.post('/api/admin/categories', payload);
  return data;
}

export async function updateCategory(id: number | string, payload: { code: string; name: string }): Promise<Category> {
  const { data } = await api.put(`/api/admin/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: number | string): Promise<void> {
  await api.delete(`/api/admin/categories/${id}`);
}

export async function listAllCategories(): Promise<{ id: number; code: string; name: string }[]> {
  const { data } = await api.get('/api/admin/categories', { params: { size: 1000 } });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.items)) return data.items;
  return [];
}