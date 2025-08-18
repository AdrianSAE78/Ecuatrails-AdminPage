export type LodgingListItem = {
  id: number;
  name: string;
  description?: string | null;
  approximatePrice?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: boolean;
};

export type LodgingDetail = LodgingListItem;

export type LodgingPage = {
  content: LodgingListItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
};

export type LodgingCreate = {
  name: string;
  description?: string;
  approximatePrice?: number;
  latitude?: number;
  longitude?: number;
  status?: boolean;
};

export type LodgingUpdate = Partial<LodgingCreate>;

export type LodgingQuery = {
  page?: number;
  size?: number;
  q?: string;
  status?: boolean | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};