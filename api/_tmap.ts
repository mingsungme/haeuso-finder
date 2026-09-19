/**
 * TMAP 보행자 경로안내 API 래퍼 (서버 전용).
 *
 * appKey를 브라우저에 노출하지 않기 위해, 클라이언트는 이 모듈을 직접 부르지 않고
 * `/api/route`(배포: Vercel 서버리스 함수 / 로컬: vite dev 미들웨어)를 거친다.
 * 두 진입점 모두 아래 handleRouteRequest() 하나만 호출한다.
 *
 * 응답 형태는 src/app/lib/directions.ts의 WalkingRoute와 맞춰져 있다.
 */
import type { WalkingRoute, RouteStep } from '../src/app/lib/directions';

const TMAP_ENDPOINT =
  'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';

export interface RouteRequestBody {
  origin?: { lat?: number; lng?: number };
  destination?: { lat?: number; lng?: number };
  originName?: string;
  destinationName?: string;
}

interface HandlerResult {
  status: number;
  body: WalkingRoute | { error: string; code?: string };
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

function isFiniteCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * TMAP은 GeoJSON FeatureCollection을 준다.
 * - Point   : 회전 지점. properties.description이 한국어 안내 문구.
 * - LineString: 그 다음 구간의 실제 좌표열과 거리.
 * 그래서 "Point의 안내문 + 바로 뒤 LineString의 거리"를 한 스텝으로 묶는다.
 */
function normalize(data: any): WalkingRoute {
  const features: any[] = Array.isArray(data?.features) ? data.features : [];
  const steps: RouteStep[] = [];
  const path: { lat: number; lng: number }[] = [];
  let distanceMeters = 0;
  let durationSeconds = 0;

  features.forEach((feature, i) => {
    const props = feature?.properties ?? {};
    const geometry = feature?.geometry;

    if (geometry?.type === 'LineString') {
      for (const coord of geometry.coordinates ?? []) {
        // GeoJSON은 [경도, 위도] 순서다. 뒤집어 넣으면 지도에 태평양이 찍힌다.
        if (!isFiniteCoord(coord?.[0]) || !isFiniteCoord(coord?.[1])) continue;
        // 구간과 구간은 끝점을 공유하므로 이어 붙이면 같은 좌표가 두 번 들어간다.
        const last = path[path.length - 1];
        if (last && last.lat === coord[1] && last.lng === coord[0]) continue;
        path.push({ lat: coord[1], lng: coord[0] });
      }
      return;
    }

    if (geometry?.type !== 'Point') return;

    // 총 거리/시간은 출발 지점 feature에만 실려 온다.
    if (isFiniteCoord(props.totalDistance) && props.totalDistance > 0) {
      distanceMeters = props.totalDistance;
    }
    if (isFiniteCoord(props.totalTime) && props.totalTime > 0) {
      durationSeconds = props.totalTime;
    }

    const turnType = isFiniteCoord(props.turnType) ? props.turnType : null;
    // 201 = 도착. 화면 하단에 도착 항목을 따로 그리므로 여기서는 뺀다.
    if (turnType === 201) return;

    const instruction = String(props.description ?? '').trim();
    if (!instruction) return;

    const next = features[i + 1];
    const legMeters =
      next?.geometry?.type === 'LineString' ? Number(next.properties?.distance ?? 0) : 0;

    steps.push({
      instruction,
      distanceMeters: Number.isFinite(legMeters) ? legMeters : 0,
      distanceText: formatDistance(legMeters),
      turnType,
    });
  });

  return {
    source: 'tmap',
    distanceMeters,
    durationSeconds,
    distanceText: formatDistance(distanceMeters),
    durationText: formatDuration(durationSeconds),
    steps,
    path,
  };
}

/**
 * 두 진입점(Vercel 함수 / vite dev 미들웨어)이 공유하는 본체.
 * HTTP 프레임워크에 의존하지 않도록 status와 body만 돌려준다.
 */
export async function handleRouteRequest(
  body: RouteRequestBody,
  appKey: string | undefined
): Promise<HandlerResult> {
  if (!appKey) {
    return {
      status: 503,
      body: {
        error: 'TMAP_APP_KEY 환경변수가 설정되지 않았습니다. SETUP.md를 참고하세요.',
        code: 'NO_APP_KEY',
      },
    };
  }

  const { origin, destination } = body ?? {};
  if (
    !isFiniteCoord(origin?.lat) ||
    !isFiniteCoord(origin?.lng) ||
    !isFiniteCoord(destination?.lat) ||
    !isFiniteCoord(destination?.lng)
  ) {
    return {
      status: 400,
      body: { error: 'origin/destination 좌표가 올바르지 않습니다.', code: 'BAD_REQUEST' },
    };
  }

  // TMAP은 출발/도착 명칭을 URL 인코딩된 문자열로 받는다. 한글을 그대로 넣으면 400이 난다.
  const payload = {
    startX: origin!.lng,
    startY: origin!.lat,
    endX: destination!.lng,
    endY: destination!.lat,
    startName: encodeURIComponent(body.originName || '현재 위치'),
    endName: encodeURIComponent(body.destinationName || '목적지'),
    reqCoordType: 'WGS84GEO',
    resCoordType: 'WGS84GEO',
    searchOption: '0',
    sort: 'index',
  };

  let response: Response;
  try {
    response = await fetch(TMAP_ENDPOINT, {
      method: 'POST',
      headers: {
        appKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return {
      status: 502,
      body: { error: `TMAP 서버에 연결하지 못했습니다: ${(e as Error).message}`, code: 'FETCH_FAILED' },
    };
  }

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      status: 502,
      body: { error: 'TMAP 응답을 해석하지 못했습니다.', code: 'BAD_RESPONSE' },
    };
  }

  if (!response.ok || data?.error) {
    const message =
      data?.error?.message || data?.error?.msg || `TMAP 오류 (HTTP ${response.status})`;
    return {
      status: response.status === 401 || response.status === 403 ? 401 : 502,
      body: { error: message, code: data?.error?.id ?? 'TMAP_ERROR' },
    };
  }

  const route = normalize(data);
  if (route.path.length === 0) {
    return {
      status: 404,
      body: { error: '보행자 경로를 찾지 못했습니다.', code: 'NO_ROUTE' },
    };
  }

  return { status: 200, body: route };
}
