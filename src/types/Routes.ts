export type RouteStatus = 'ACTIVE' | 'INACTIVE';

export interface RouteItem {
  id: number;
  name: string;
  description?: string | null;
  distanceKm?: number | null;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  status: RouteStatus;
  categoryId?: number | null;
  categoryName?: string | null;
}

export interface RoutePage {
  records: RouteItem[];
  total: number;
  page: number;
  size: number;
}

export interface RouteCreate {
  name: string;
  description?: string;
  distanceKm?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  status?: RouteStatus;
  categoryId?: number;
}

export type RouteUpdate = Partial<RouteCreate>;

export interface RoutePoiLink {
  id: number;         // id del vínculo (routeInterestPointId)
  interestPointId: number;
  interestPointName: string;
  position: number;   // orden en la ruta
}

export interface RouteLodgingLink {
  id: number;         // id del vínculo routeLodgingId (si existe)
  lodgingId: number;
  lodgingName: string;
}