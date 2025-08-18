export type TransportStatus = true | false;
export type TransportType = 'BUS' | 'TAXI' | 'METRO' | 'CABLECAR' | 'BIKE' | string;

export interface TransportItem {
  id: number;
  type: TransportType;
  name: string;
  route?: string | null;       // p.ej. "Línea A", "R2"
  schedule?: string | null;    // p.ej. "06:00-22:00"
  baseFare?: number | null;    // tarifa base
  accessibility?: string | null; // notas de accesibilidad
  status: TransportStatus;
}

export interface TransportItemPOI {
  id: number;
  name: string;
  type?: string | null;
  route?: string | null;
  status?: boolean;
}

export interface TransportPage {
  records: TransportItem[];
  total: number;
  page: number;   // 0-based
  size: number;
}

export type TransportCreate = {
  type: TransportType;
  name: string;
  route?: string | null;
  schedule?: string | null;
  baseFare?: number | null;
  accessibility?: boolean;
  status?: TransportStatus;
};

export type TransportUpdate = Partial<TransportCreate>;

export type TransportQuery = {
  page?: number;
  size?: number;
  q?: string;
  type?: TransportType | 'ALL';
  status?: TransportStatus | 'ALL';
};
