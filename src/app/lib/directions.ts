/**
 * 도보 길안내 데이터.
 *
 * 한국에서는 Google Directions/Routes가 WALKING 경로를 돌려주지 않는다(정밀 지도
 * 국외 반출 규제). 그래서 실제 경로는 TMAP 보행자 경로안내 API로 받아오고,
 * 키가 없거나 API가 실패할 때만 직선 추정으로 물러난다.
 *
 * 브라우저는 TMAP을 직접 부르지 않는다. appKey를 감추기 위해 서버의 /api/route를
 * 거치며, 그쪽 구현은 api/_tmap.ts에 있다.
 */

export interface RouteStep {
  /** 한국어 안내 문구. TMAP의 description을 그대로 쓴다. */
  instruction: string;
  /** 이 안내 이후 이동해야 하는 거리. 0이면 빈 문자열. */
  distanceText: string;
  distanceMeters: number;
  /** TMAP turnType. 아이콘 선택에만 쓴다. 직선 추정일 때는 null. */
  turnType: number | null;
}

export interface WalkingRoute {
  source: 'tmap' | 'straight-line';
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  steps: RouteStep[];
  /** 지도에 그릴 좌표열. 직선 추정이면 [출발, 도착] 두 점뿐이다. */
  path: { lat: number; lng: number }[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 평균 보행 속도 75m/분 기준 직선 추정. TMAP이 실패했을 때만 쓴다. */
export function straightLineRoute(
  origin: LatLng,
  destination: LatLng,
  destinationName: string
): WalkingRoute {
  const distanceMeters = haversineDistanceMeters(origin, destination);
  const durationSeconds = Math.max(60, (distanceMeters / 75) * 60);
  const distanceText = formatDistance(distanceMeters);

  return {
    source: 'straight-line',
    distanceMeters,
    durationSeconds,
    distanceText,
    durationText: formatDuration(durationSeconds),
    steps: [
      {
        instruction: `${destinationName} 방향으로 직선 이동`,
        distanceText,
        distanceMeters,
        turnType: null,
      },
    ],
    path: [origin, destination],
  };
}

export interface RouteResult {
  route: WalkingRoute;
  /** 직선 추정으로 물러난 이유. TMAP 경로를 받았으면 null. */
  fallbackReason: string | null;
}

export async function fetchWalkingRoute(
  origin: LatLng,
  destination: LatLng,
  destinationName: string,
  signal?: AbortSignal
): Promise<RouteResult> {
  const fallback = (reason: string): RouteResult => ({
    route: straightLineRoute(origin, destination, destinationName),
    fallbackReason: reason,
  });

  try {
    const response = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        originName: '현재 위치',
        destinationName,
      }),
      signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || data.error) {
      return fallback(data?.error || `경로 서버 오류 (HTTP ${response.status})`);
    }
    if (!Array.isArray(data.path) || data.path.length === 0) {
      return fallback('경로 좌표를 받지 못했습니다.');
    }

    return { route: data as WalkingRoute, fallbackReason: null };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return fallback(`경로를 불러오지 못했습니다: ${(e as Error).message}`);
  }
}
