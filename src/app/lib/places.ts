import type { Restroom } from '../components/MapView';

export async function searchNearbyRestrooms(
  center: { lat: number; lng: number },
  radius = 1500
): Promise<Restroom[]> {
  // @ts-ignore - importLibrary is part of the new Maps JS API loader
  const placesLib: any = await google.maps.importLibrary('places');
  const { Place, SearchNearbyRankPreference } = placesLib;

  const request = {
    fields: [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'accessibilityOptions',
      'regularOpeningHours',
    ],
    locationRestriction: { center, radius },
    includedTypes: ['public_bathroom'],
    maxResultCount: 20,
    rankPreference: SearchNearbyRankPreference.DISTANCE,
  };

  try {
    const { places } = await Place.searchNearby(request);
    if (!places) return [];

    return places.map((p: any): Restroom => {
      const loc = p.location;
      const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
      const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;

      const periods = p.regularOpeningHours?.periods;
      const is24Hours =
        Array.isArray(periods) &&
        periods.length > 0 &&
        periods.every((pd: any) => pd?.open && !pd?.close);

      return {
        id: p.id,
        name: p.displayName ?? '공중화장실',
        address: p.formattedAddress ?? '',
        lat,
        lng,
        isAccessible: !!p.accessibilityOptions?.wheelchairAccessibleEntrance,
        is24Hours,
        hasChangingTable: false,
      };
    });
  } catch (err) {
    console.error('Places searchNearby error:', err);
    return [];
  }
}

export interface AutocompleteSuggestion {
  text: string;
  placeId?: string;
}

let _sessionToken: any = null;
async function getSessionToken() {
  // @ts-ignore
  const placesLib: any = await google.maps.importLibrary('places');
  if (!_sessionToken) {
    _sessionToken = new placesLib.AutocompleteSessionToken();
  }
  return { placesLib, token: _sessionToken };
}

export async function fetchAddressSuggestions(
  input: string,
  limit = 3
): Promise<AutocompleteSuggestion[]> {
  const q = input.trim();
  if (!q) return [];
  try {
    const { placesLib, token } = await getSessionToken();
    const { AutocompleteSuggestion } = placesLib;
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: q,
      sessionToken: token,
      language: 'ko',
      region: 'kr',
    });
    if (!suggestions) return [];
    return suggestions.slice(0, limit).map((s: any): AutocompleteSuggestion => {
      const pred = s.placePrediction;
      return {
        text: pred?.text?.text ?? pred?.text?.toString?.() ?? '',
        placeId: pred?.placeId,
      };
    });
  } catch (err) {
    console.error('Autocomplete error:', err);
    return [];
  }
}

export function resetAutocompleteSession() {
  _sessionToken = null;
}

export async function geocodeAddress(
  address: string
): Promise<{ result: { lat: number; lng: number } | null; error?: string }> {
  try {
    // @ts-ignore
    const geocodingLib: any = await google.maps.importLibrary('geocoding');
    const geocoder = new geocodingLib.Geocoder();
    const { results } = await geocoder.geocode({ address });
    if (results && results.length > 0) {
      const loc = results[0].geometry.location;
      return { result: { lat: loc.lat(), lng: loc.lng() } };
    }
    return { result: null, error: '검색 결과가 없습니다' };
  } catch (err: any) {
    console.error('Geocoding error:', err);
    const msg = String(err?.message ?? err);
    if (msg.includes('REQUEST_DENIED') || msg.includes('Billing')) {
      return {
        result: null,
        error: 'Geocoding API가 비활성화되어 있거나 Google Cloud 결제가 설정되지 않았습니다.',
      };
    }
    return { result: null, error: '주소 검색 중 오류가 발생했습니다' };
  }
}
