import api from './axios';

export type Status = true | false;

export interface InterestPoint {
  id: number | string;
  name: string;
  city?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: Status;
}

export interface ListParams {
  page?: number;
  size?: number;
  q?: string;
  status?: Status | null;
  city?: string;
}

export interface ListResult { rows: InterestPoint[]; total: number }

export async function listInterestPoints(params: {
  page: number; size: number; q?: string; status?: boolean | null;
}) {
  const { data } = await api.get('/api/admin/interest-points', { params });
  return {
    rows: Array.isArray(data?.content) ? data.content : (data?.rows ?? []),
    total: typeof data?.totalElements === 'number' ? data.totalElements : (data?.total ?? 0),
    page: data?.number ?? params.page,
    size: data?.size ?? params.size,
    totalPages: data?.totalPages ?? 1,
  };
}
export async function createInterestPoint(payload: Partial<InterestPoint> & { name: string }): Promise<InterestPoint> {
  const { data } = await api.post('/api/admin/interest-points', payload);
  return data;
}

export async function updateInterestPoint(id: number | string, payload: Partial<InterestPoint>): Promise<InterestPoint> {
  const { data } = await api.put(`/api/admin/interest-points/${id}`, payload);
  return data;
}

export async function deleteInterestPoint(id: number | string): Promise<void> {
  await api.delete(`/api/admin/interest-points/${id}`);
}

export async function geocodeInterestPoint(id: number | string): Promise<InterestPoint> {
  const { data } = await api.post(`/api/admin/interest-points/${id}/geocode`);
  return data;
}

export async function updateInterestPointStatus(id: number | string, status: Status): Promise<void> {
  try {
    await api.put(`/api/admin/interest-points/${id}/status`, { status });
  } catch {
    await updateInterestPoint(id, { status });
  }
}

export interface PoiTransportLink {
  id: number; // id del vínculo (InterestPointTransportId)
  transportId: number;
  transportName?: string | null;
  walkingDistanceMeters?: number | null;
  estimatedWalkingTime?: number | null;
  accessibilityNotes?: string | null;
  status: boolean;
}

export async function getPoiTransports(poiId: number): Promise<PoiTransportLink[]> {
  const { data } = await api.get(`/api/admin/interest-points/${poiId}/transports`);
  return data ?? [];
}

export async function addPoiTransport(
  poiId: number,
  payload: { transportId: number; walkingDistanceMeters?: number; estimatedWalkingTime?: number; accessibilityNotes?: string; status?: boolean }
): Promise<PoiTransportLink> {
  const { data } = await api.post(`/api/admin/interest-points/${poiId}/transports`, payload);
  return data;
}

export async function updatePoiTransport(
  poiId: number,
  linkId: number,
  payload: { walkingDistanceMeters?: number; estimatedWalkingTime?: number; accessibilityNotes?: string; status?: boolean }
): Promise<PoiTransportLink> {
  const { data } = await api.put(`/api/admin/interest-points/${poiId}/transports/${linkId}`, payload);
  return data;
}

export async function removePoiTransport(poiId: number, linkId: number): Promise<void> {
  await api.delete(`/api/admin/interest-points/${poiId}/transports/${linkId}`);
}