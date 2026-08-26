export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  city: string;
  district?: string;
  province?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isAutoDetected: boolean;
  displayName: string;
}

export interface CitySearchResult {
  id: string;
  name: string;
  adminName?: string; // Province / State
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}
