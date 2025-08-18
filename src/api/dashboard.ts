/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './axios';

// helpers: retornar totalElements de páginas (o 0 si cambió el formato)
const getTotal = (data: any) => {
  if (data?.totalElements != null) return data.totalElements;
  if (data?.total != null) return data.total;
  if (Array.isArray(data?.content)) return data.content.length;
  if (Array.isArray(data)) return data.length;
  return 0;
};

export async function getPoiTotals() {
  const [all, active, inactive] = await Promise.all([
    api.get('/api/admin/interest-points', { params: { page: 0, size: 1 } }),
    api.get('/api/admin/interest-points', { params: { page: 0, size: 1, status: true } }),
    api.get('/api/admin/interest-points', { params: { page: 0, size: 1, status: false } }),
  ]);
  return { total: getTotal(all.data), active: getTotal(active.data), inactive: getTotal(inactive.data) };
}

export async function getLodgingTotals() {
  const [all, active, inactive] = await Promise.all([
    api.get('/api/admin/lodgings', { params: { page: 0, size: 1 } }),
    api.get('/api/admin/lodgings', { params: { page: 0, size: 1, status: true } }),
    api.get('/api/admin/lodgings', { params: { page: 0, size: 1, status: false } }),
  ]);
  return { total: getTotal(all.data), active: getTotal(active.data), inactive: getTotal(inactive.data) };
}

export async function getRouteTotals() {
  const [all, active, inactive] = await Promise.all([
    api.get('/api/admin/routes', { params: { page: 0, size: 1 } }),
    api.get('/api/admin/routes', { params: { page: 0, size: 1, status: true } }),
    api.get('/api/admin/routes', { params: { page: 0, size: 1, status: false } }),
  ]);
  return { total: getTotal(all.data), active: getTotal(active.data), inactive: getTotal(inactive.data) };
}

export async function getTransportTotals() {
  const [all, active, inactive] = await Promise.all([
    api.get('/api/admin/transport', { params: { page: 0, size: 1 } }),
    api.get('/api/admin/transport', { params: { page: 0, size: 1, status: true } }),
    api.get('/api/admin/transport', { params: { page: 0, size: 1, status: false } }),
  ]);
  return { total: getTotal(all.data), active: getTotal(active.data), inactive: getTotal(inactive.data) };
}

export async function getCategoryCount() {
  const { data } = await api.get('/api/admin/categories');
  return Array.isArray(data) ? data.length : (Array.isArray(data?.records) ? data.records.length : 0);
}
