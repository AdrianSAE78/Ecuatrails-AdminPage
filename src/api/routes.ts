/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/routes.ts
import api from './axios';
import type {
  RouteItem, RoutePage, RouteCreate, RouteUpdate,
  RoutePoiLink, RouteLodgingLink
} from '../types/Routes';

export async function listRoutes(params: {
  page?: number; size?: number; q?: string; status?: RouteItem['status'] | 'ALL'; categoryId?: number | '';
} = {}): Promise<RoutePage> {
  const { page = 0, size = 10, q, status, categoryId } = params;
  const { data } = await api.get('/api/admin/routes', {
    params: {
      page, size,
      q,
      status: status && status !== 'ALL' ? status : undefined,
      categoryId: categoryId || undefined,
    },
  });
  // Normaliza en caso de formato distinto
  if (Array.isArray(data)) return { records: data, total: data.length, page, size };
  if (data?.records) return data;
  if (data?.content) return { records: data.content, total: data.totalElements, page: data.page, size: data.size };
  return { records: [], total: 0, page, size };
}

export async function createRoute(body: RouteCreate): Promise<RouteItem> {
  const { data } = await api.post('/api/admin/routes', body);
  return data;
}

export async function updateRoute(id: number, body: RouteUpdate): Promise<RouteItem> {
  const { data } = await api.put(`/api/admin/routes/${id}`, body);
  return data;
}

export async function deleteRoute(id: number): Promise<void> {
  await api.delete(`/api/admin/routes/${id}`);
}

// helpers
const normPoiLink = (x: any): RoutePoiLink => ({
  id: x.routeInterestPointId ?? x.id,
  interestPointId: x.interestPointId,
  interestPointName: x.interestPointName,
  position: x.position ?? 0,
});

const normLodgingLink = (x: any): RouteLodgingLink => ({
  id: x.routeLodgingId ?? x.id,
  lodgingId: x.lodgingId,
  lodgingName: x.lodgingName,
});

// --- POIs de la ruta ---
export async function getRoutePois(routeId: number): Promise<RoutePoiLink[]> {
  const { data } = await api.get(`/api/admin/routes/${routeId}/interest-points`);
  return Array.isArray(data) ? data.map(normPoiLink) : [];
}

export async function addRoutePoi(
  routeId: number,
  payload: { interestPointId: number; position?: number }
): Promise<RoutePoiLink> {
  const { data } = await api.post(`/api/admin/routes/${routeId}/interest-points`, payload);
  return normPoiLink(data); // el back devuelve 1 objeto
}

export async function removeRoutePoi(routeId: number, routeInterestPointId: number): Promise<void> {
  await api.delete(`/api/admin/routes/${routeId}/interest-points/${routeInterestPointId}`);
}

export async function reorderRoutePois(routeId: number, orderedIds: number[]): Promise<RoutePoiLink[]> {
  const { data } = await api.put(`/api/admin/routes/${routeId}/interest-points/reorder`, { orderedIds });
  return Array.isArray(data) ? data.map(normPoiLink) : [];
}

// --- Alojamientos de la ruta ---
export async function getRouteLodgings(routeId: number): Promise<RouteLodgingLink[]> {
  const { data } = await api.get(`/api/admin/routes/${routeId}/lodgings`);
  return Array.isArray(data) ? data.map(normLodgingLink) : [];
}

export async function addRouteLodging(
  routeId: number,
  payload: { lodgingId: number }
): Promise<RouteLodgingLink> {
  const { data } = await api.post(`/api/admin/routes/${routeId}/lodgings`, payload);
  return normLodgingLink(data); // el back devuelve 1 objeto
}

export async function removeRouteLodging(routeId: number, routeLodgingId: number): Promise<void> {
  await api.delete(`/api/admin/routes/${routeId}/lodgings/${routeLodgingId}`);
}
