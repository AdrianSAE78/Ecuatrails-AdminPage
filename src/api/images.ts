import api from './axios';

export type EntityKind = 'poi' | 'lodging' | 'route';

export interface ImageItem {
  id: number | string;
  url: string;
  title?: string | null;
  alt?: string | null;
  cover?: boolean;
  position?: number; // orden
}

const basePath = (entity: EntityKind, id: number | string) => {
  switch (entity) {
    case 'poi': return `/api/admin/interest-points/${id}/images`;
    case 'lodging': return `/api/admin/lodgings/${id}/images`;
    case 'route': return `/api/admin/routes/${id}/images`;
  }
};

export async function listImages(entity: EntityKind, id: number | string): Promise<ImageItem[]> {
  const { data } = await api.get(basePath(entity, id));
  // Normaliza formatos (array directo o {records/items})
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export async function uploadImages(entity: EntityKind, id: number | string, files: File[]): Promise<void> {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  await api.post(basePath(entity, id), form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function reorderImages(entity: EntityKind, id: number | string, orderedIds: (number|string)[]): Promise<void> {
  await api.put(`${basePath(entity, id)}/reorder`, { orderedIds });
}

export async function updateImageMeta(entity: EntityKind, id: number | string, imageId: number | string, meta: { title?: string; alt?: string; cover?: boolean }): Promise<void> {
  await api.put(`${basePath(entity, id)}/${imageId}`, meta);
}

export async function deleteImage(entity: EntityKind, id: number | string, imageId: number | string): Promise<void> {
  await api.delete(`${basePath(entity, id)}/${imageId}`);
}