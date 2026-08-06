import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback, useEffect, useRef } from 'react';

export interface Restroom {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isAccessible: boolean;
  is24Hours: boolean;
  hasChangingTable: boolean;
  distance?: string;
}

interface MapViewProps {
  restrooms: Restroom[];
  center: { lat: number; lng: number };
  selectedRestroom: Restroom | null;
  favorites: Set<string>;
  onSelectRestroom: (restroom: Restroom | null) => void;
  onIdle?: (center: { lat: number; lng: number }) => void;
  directionsOrigin?: { lat: number; lng: number } | null;
  directionsDestination?: Restroom | null;
  onDirectionsResult?: (info: {
    distanceText: string;
    durationText: string;
    steps: { instruction: string; distanceText: string }[];
  } | null) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// A mapId is required to render AdvancedMarkerElement.
// DEMO_MAP_ID is provided by Google for development/testing.
const MAP_ID = 'DEMO_MAP_ID';

// 대나무 숲 초록 핀 - 디폴트 (미니멀, 둥근 마감)
const DEFAULT_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none">
  <path d="M16 2C8.27 2 2 8.27 2 16c0 9.5 14 22 14 22s14-12.5 14-22C30 8.27 23.73 2 16 2z"
        fill="#2C5E43" stroke="#F7F4EB" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="16" cy="15" r="4.5" fill="#F7F4EB"/>
</svg>`;

// 홍단 단풍색 핀 - 즐겨찾기
const FAVORITE_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44" fill="none">
  <path d="M18 2C9.72 2 3 8.72 3 17c0 10 15 23 15 23s15-13 15-23C33 8.72 26.28 2 18 2z"
        fill="#D04A3C" stroke="#F7F4EB" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M18 10.5l1.6 3.4 3.7.5-2.7 2.6.6 3.7L18 19l-3.2 1.7.6-3.7-2.7-2.6 3.7-.5L18 10.5z"
        fill="#F7F4EB" stroke="#F7F4EB" stroke-width="0.6" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;

function createPinContent(isFavorite: boolean, isSelected: boolean): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = isFavorite ? FAVORITE_PIN_SVG : DEFAULT_PIN_SVG;
  wrapper.style.cursor = 'pointer';
  wrapper.style.lineHeight = '0';
  wrapper.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
  wrapper.style.transformOrigin = 'center bottom';
  wrapper.style.transition = 'transform 0.18s ease';
  wrapper.style.filter = isSelected
    ? 'drop-shadow(0px 8px 24px rgba(34, 37, 35, 0.18))'
    : 'drop-shadow(0px 4px 12px rgba(44, 94, 67, 0.22))';
  return wrapper;
}

export default function MapView({
  restrooms,
  center,
  selectedRestroom,
  favorites,
  onSelectRestroom,
  onIdle,
  directionsOrigin,
  directionsDestination,
  onDirectionsResult,
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const directionsRendererRef = useRef<any>(null);

  const onLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleIdle = useCallback(() => {
    if (!map || !onIdle) return;
    const c = map.getCenter();
    if (!c) return;
    onIdle({ lat: c.lat(), lng: c.lng() });
  }, [map, onIdle]);

  // Render AdvancedMarkerElement markers imperatively
  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    (async () => {
      // @ts-ignore - importLibrary is part of the new Maps JS API loader
      const markerLib: any = await google.maps.importLibrary('marker');
      if (cancelled) return;
      const AdvancedMarkerElement = markerLib?.AdvancedMarkerElement;
      if (!AdvancedMarkerElement) {
        console.warn('[MapView] AdvancedMarkerElement not available after import', markerLib);
        return;
      }

      console.log(`[MapView] Rendering ${restrooms.length} markers`);
      const existing = markersRef.current;
      const nextIds = new Set(restrooms.map((r) => r.id));

      for (const [id, marker] of existing) {
        if (!nextIds.has(id)) {
          marker.map = null;
          existing.delete(id);
        }
      }

      for (const restroom of restrooms) {
        const isSelected = selectedRestroom?.id === restroom.id;
        const isFavorite = favorites.has(restroom.id);
        const content = createPinContent(isFavorite, isSelected);
        let marker = existing.get(restroom.id);

        if (!marker) {
          marker = new AdvancedMarkerElement({
            map,
            position: { lat: restroom.lat, lng: restroom.lng },
            content,
            gmpClickable: true,
          });
          marker.addListener('gmp-click', () => onSelectRestroom(restroom));
          existing.set(restroom.id, marker);
        } else {
          marker.position = { lat: restroom.lat, lng: restroom.lng };
          marker.content = content;
          marker.map = map;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [map, restrooms, selectedRestroom, favorites, onSelectRestroom]);

  // Render directions polyline when origin + destination are set
  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    const clearRenderer = () => {
      if (directionsRendererRef.current) {
        if (typeof directionsRendererRef.current.setMap === 'function') {
          directionsRendererRef.current.setMap(null);
        }
        directionsRendererRef.current = null;
      }
    };

    if (!directionsOrigin || !directionsDestination) {
      clearRenderer();
      onDirectionsResult?.(null);
      return;
    }

    (async () => {
      try {
        // @ts-ignore - routes lib hosts Route.computeRoutes
        const routesLib: any = await google.maps.importLibrary('routes');
        // @ts-ignore - geometry lib for polyline decoding
        const geometryLib: any = await google.maps.importLibrary('geometry');
        // @ts-ignore - core lib for LatLng
        const coreLib: any = await google.maps.importLibrary('core');
        if (cancelled) return;

        const Route = routesLib?.Route;
        if (!Route?.computeRoutes) {
          throw new Error('Route.computeRoutes not available');
        }

        const originLatLng = new coreLib.LatLng(directionsOrigin.lat, directionsOrigin.lng);
        const destLatLng = new coreLib.LatLng(directionsDestination.lat, directionsDestination.lng);
        const travelMode =
          routesLib?.RouteTravelMode?.WALKING ??
          routesLib?.RouteTravelMode?.WALK ??
          'WALKING';

        const { routes } = await Route.computeRoutes({
          origin: originLatLng,
          destination: destLatLng,
          travelMode,
          fields: ['*'],
        });
        if (cancelled) return;

        const route = routes?.[0];
        if (!route) {
          onDirectionsResult?.(null);
          return;
        }

        const encoded =
          route.polyline?.encodedPolyline ??
          route.polyline?.encoded_polyline ??
          route.encodedPolyline;
        const path: any[] =
          encoded && geometryLib?.encoding?.decodePath
            ? geometryLib.encoding.decodePath(encoded)
            : [
                new coreLib.LatLng(directionsOrigin.lat, directionsOrigin.lng),
                new coreLib.LatLng(directionsDestination.lat, directionsDestination.lng),
              ];

        clearRenderer();
        // @ts-ignore
        const polyline = new google.maps.Polyline({
          map,
          path,
          strokeColor: '#2C5E43',
          strokeOpacity: 0.9,
          strokeWeight: 5,
        });
        directionsRendererRef.current = polyline;

        // @ts-ignore
        const bounds = new google.maps.LatLngBounds();
        for (const point of path) bounds.extend(point);
        map.fitBounds(bounds, 80);

        const distanceMeters: number = route.distanceMeters ?? 0;
        const durationMillis: number =
          typeof route.durationMillis === 'number'
            ? route.durationMillis
            : typeof route.duration === 'string'
              ? parseInt(route.duration, 10) * 1000
              : 0;

        const distanceText =
          distanceMeters >= 1000
            ? `${(distanceMeters / 1000).toFixed(1)}km`
            : `${Math.round(distanceMeters)}m`;
        const minutes = Math.max(1, Math.round(durationMillis / 60000));
        const durationText =
          minutes >= 60
            ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
            : `${minutes}분`;

        const stepsRaw: any[] =
          route.legs?.flatMap((leg: any) => leg.steps ?? []) ?? [];
        const steps = stepsRaw.map((s: any) => {
          const rawInstr: string =
            s.navigationInstruction?.instructions ??
            s.instructions ??
            s.maneuver ??
            '';
          const instruction = rawInstr
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
          const stepMeters: number = s.distanceMeters ?? 0;
          const stepDistText =
            stepMeters >= 1000
              ? `${(stepMeters / 1000).toFixed(1)}km`
              : `${Math.round(stepMeters)}m`;
          return { instruction: instruction || '경로를 따라 이동', distanceText: stepDistText };
        });

        onDirectionsResult?.({ distanceText, durationText, steps });
      } catch (err) {
        console.error('Directions error:', err);
        onDirectionsResult?.(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [map, directionsOrigin, directionsDestination, onDirectionsResult]);

  // Clean up all markers on unmount
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) {
        marker.map = null;
      }
      markersRef.current.clear();
      if (directionsRendererRef.current) {
        if (typeof directionsRendererRef.current.setMap === 'function') {
          directionsRendererRef.current.setMap(null);
        }
        directionsRendererRef.current = null;
      }
    };
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onIdle={handleIdle}
      onClick={() => onSelectRestroom(null)}
      mapContainerClassName=""
      options={{
        mapId: MAP_ID,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {selectedRestroom && (
        <InfoWindow
          position={{ lat: selectedRestroom.lat, lng: selectedRestroom.lng }}
          onCloseClick={() => onSelectRestroom(null)}
        >
          <div style={{ padding: 4, maxWidth: 240, fontFamily: 'Pretendard, sans-serif' }}>
            <div style={{ fontFamily: 'Diphylleia, serif', fontSize: 16, color: '#222523', marginBottom: 4 }}>
              {selectedRestroom.name}
            </div>
            <div style={{ fontSize: 12, color: '#6C726E', marginBottom: 8, lineHeight: 1.4 }}>
              {selectedRestroom.address}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selectedRestroom.is24Hours && (
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: '#F7F4EB', color: '#2C5E43', border: '1px solid #E5E0D3' }}>24시간</span>
              )}
              {selectedRestroom.isAccessible && (
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: '#F7F4EB', color: '#2C5E43', border: '1px solid #E5E0D3' }}>장애인 이용</span>
              )}
              {selectedRestroom.hasChangingTable && (
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: '#F7F4EB', color: '#2C5E43', border: '1px solid #E5E0D3' }}>기저귀 교환대</span>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
