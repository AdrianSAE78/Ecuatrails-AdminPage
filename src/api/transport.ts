/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './axios';
import type {
  TransportCreate, TransportItem, TransportItemPOI, TransportPage, TransportQuery, TransportUpdate,
} from '../types/Transport';

export async function listTransport(params: TransportQuery = {}): Promise<TransportPage> {
  const { page = 0, size = 10, q, type, status } = params;
  const { data } = await api.get('/api/admin/transport', {
    params: {
      page, size,
      q: q || undefined,
      type: type && type !== 'ALL' ? type : undefined,
      status: status && status !== 'ALL' ? status : undefined,
    },
  });

  // Normalización defensiva
  if (Array.isArray(data)) return { records: data, total: data.length, page, size };
  if (data?.records) return data as TransportPage;
  if (data?.content) {
    return { records: data.content, total: data.totalElements, page: data.page, size: data.size };
  }
  return { records: [], total: 0, page, size };
}

export async function createTransport(body: TransportCreate): Promise<TransportItem> {
  const { data } = await api.post('/api/admin/transport', body);
  return data;
}

export async function updateTransport(id: number, body: TransportUpdate): Promise<TransportItem> {
  const { data } = await api.put(`/api/admin/transport/${id}`, body);
  return data;
}

export async function deleteTransport(id: number): Promise<void> {
  await api.delete(`/api/admin/transport/${id}`);
}

/** Vincular este transporte a un POI (el endpoint vive bajo /interest-points) */
export async function linkTransportToPoi(poiId: number, payload: {
  transportId: number;
  walkingDistanceMeters?: number | null;
  walkingTimeMinutes?: number | null;
  accessibilityNotes?: string | null;
}): Promise<void> {
  // El vínculo suele crearse con POST /api/admin/interest-points/{poiId}/transport
  await api.post(`/api/admin/interest-points/${poiId}/transport`, payload);
}

export async function searchTransports(params: { q?: string; type?: string; status?: boolean | null; size?: number }) {
  const { q, type, status, size = 10 } = params;
  const { data } = await api.get('/api/admin/transport', {
    params: { page: 0, size, q, type, status },
  });
  const rows: TransportItemPOI[] = Array.isArray(data?.content)
    ? data.content.map((r: any) => ({
        id: r.id ?? r.transportId ?? r.transport_id,
        name: r.name,
        type: r.type,
        route: r.route ?? r.busLine ?? r.bus_line,
        status: r.status,
      }))
    : [];
  return rows;
}
