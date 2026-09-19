import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { LatLng } from '../lib/directions';

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
  /** 길안내 출발지. 있으면 출발 마커를 찍고 경로에 맞춰 화면을 맞춘다. */
  directionsOrigin?: LatLng | null;
  /** 그릴 경로 좌표열. TMAP 응답이면 실제 보행로, 직선 추정이면 두 점. */
  routePath?: LatLng[] | null;
  /** 직선 추정 경로인지. 점선으로 그려 실제 경로와 구분한다. */
  routeIsEstimate?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// AdvancedMarkerElement를 쓰려면 mapId가 반드시 필요하다.
// 콘솔에서 발급한 Map ID를 .env에 넣으면 그 지도 스타일(색상)이 적용되고,
// 없으면 구글이 제공하는 개발용 DEMO_MAP_ID(기본 스타일)로 뜬다.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

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

// 출발지(현재 위치) 표시용 점
const ORIGIN_DOT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
  <circle cx="11" cy="11" r="9" fill="#2C5E43" fill-opacity="0.18"/>
  <circle cx="11" cy="11" r="5" fill="#2C5E43" stroke="#F7F4EB" stroke-width="2"/>
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

function createOriginContent(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = ORIGIN_DOT_SVG;
  wrapper.style.lineHeight = '0';
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
  routePath,
  routeIsEstimate,
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const routeLineRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);

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

  // 출발지 마커. 길안내 화면에서만 보인다.
  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    const clear = () => {
      if (originMarkerRef.current) {
        originMarkerRef.current.map = null;
        originMarkerRef.current = null;
      }
    };

    if (!directionsOrigin) {
      clear();
      return;
    }

    (async () => {
      // @ts-ignore
      const markerLib: any = await google.maps.importLibrary('marker');
      if (cancelled) return;
      const AdvancedMarkerElement = markerLib?.AdvancedMarkerElement;
      if (!AdvancedMarkerElement) return;

      if (!originMarkerRef.current) {
        originMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: directionsOrigin,
          content: createOriginContent(),
        });
      } else {
        originMarkerRef.current.position = directionsOrigin;
        originMarkerRef.current.map = map;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [map, directionsOrigin]);

  // 경로 폴리라인. 좌표열은 부모(DirectionsScreen)가 TMAP에서 받아 내려준다.
  useEffect(() => {
    if (!map) return;

    const clearLine = () => {
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
        routeLineRef.current = null;
      }
    };

    clearLine();
    if (!routePath || routePath.length < 2) return;

    // 실제 보행로는 실선, 직선 추정은 점선으로 그려 한눈에 구분되게 한다.
    // @ts-ignore
    const line = new google.maps.Polyline({
      map,
      path: routePath,
      strokeColor: '#2C5E43',
      strokeOpacity: routeIsEstimate ? 0 : 0.9,
      strokeWeight: 5,
      icons: routeIsEstimate
        ? [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
              offset: '0',
              repeat: '12px',
            },
          ]
        : undefined,
    });
    routeLineRef.current = line;

    // @ts-ignore
    const bounds = new google.maps.LatLngBounds();
    for (const point of routePath) bounds.extend(point);
    map.fitBounds(bounds, 80);

    return clearLine;
  }, [map, routePath, routeIsEstimate]);

  // Clean up all markers on unmount
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) {
        marker.map = null;
      }
      markersRef.current.clear();
      if (originMarkerRef.current) {
        originMarkerRef.current.map = null;
        originMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
        routeLineRef.current = null;
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
