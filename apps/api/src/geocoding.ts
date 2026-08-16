export type LocationMatch = {
  id: number;
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export interface GeocodingProvider {
  search(query: string): Promise<LocationMatch[]>;
}

type OpenMeteoResponse = { results?: Array<{ id: number; name: string; latitude: number; longitude: number; timezone: string; country?: string; admin1?: string }> };

export class OpenMeteoGeocodingProvider implements GeocodingProvider {
  async search(query: string): Promise<LocationMatch[]> {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "8");
    url.searchParams.set("language", "es");
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error("El servicio de geocodificación no está disponible");
    const payload = await response.json() as OpenMeteoResponse;
    return (payload.results ?? []).map((location) => ({
      id: location.id,
      name: location.name,
      label: [location.name, location.admin1, location.country].filter(Boolean).join(", "),
      latitude: location.latitude,
      longitude: location.longitude,
      timeZone: location.timezone
    }));
  }
}
