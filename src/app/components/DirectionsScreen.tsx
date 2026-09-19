import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Footprints,
  Info,
  MapPin,
  Navigation,
  RotateCcw,
} from 'lucide-react';
import MapView, { Restroom } from './MapView';
import { fetchWalkingRoute, type LatLng, type WalkingRoute } from '../lib/directions';

interface DirectionsScreenProps {
  origin: LatLng;
  destination: Restroom;
  onClose: () => void;
}

/**
 * TMAP turnType을 화살표 아이콘으로 옮긴다.
 * 안내 문구 자체는 TMAP이 한국어로 주므로, 아이콘은 훑어보기 용도다.
 */
/**
 * TMAP 안내문은 "보행자도로 을 따라 133m 이동"처럼 거리를 이미 품고 있는 경우가 많다.
 * 그럴 때 아래에 거리를 또 적으면 같은 말이 두 번 나오므로 숨긴다.
 */
function instructionHasDistance(instruction: string): boolean {
  return /\d+(\.\d+)?\s*k?m/i.test(instruction);
}

function turnIcon(turnType: number | null) {
  switch (turnType) {
    case 12: // 좌회전
    case 16: // 8시 방향 좌회전
    case 17: // 10시 방향 좌회전
    case 212: // 좌측 횡단보도
    case 214:
    case 215:
      return ArrowLeft;
    case 13: // 우회전
    case 18: // 2시 방향 우회전
    case 19: // 4시 방향 우회전
    case 213: // 우측 횡단보도
    case 216:
    case 217:
      return ArrowRight;
    case 14: // 유턴
      return RotateCcw;
    case 218: // 엘리베이터
      return ArrowUpDown;
    case 200: // 출발
      return Footprints;
    default: // 11 직진, 211 횡단보도, 그 외
      return ArrowUp;
  }
}

export default function DirectionsScreen({
  origin,
  destination,
  onClose,
}: DirectionsScreenProps) {
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setRoute(null);
    setFallbackReason(null);

    fetchWalkingRoute(
      origin,
      { lat: destination.lat, lng: destination.lng },
      destination.name,
      controller.signal
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setRoute(result.route);
        setFallbackReason(result.fallbackReason);
        setIsLoading(false);
      })
      .catch(() => {
        // AbortError만 여기로 온다. 화면이 이미 닫혔으므로 그대로 둔다.
      });

    return () => controller.abort();
  }, [origin, destination.lat, destination.lng, destination.name]);

  const isEstimate = route?.source === 'straight-line';

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-default)', zIndex: 50 }}
    >
      {/* Top bar */}
      <div
        className="flex items-center"
        style={{
          gap: 12,
          padding: '16px 20px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="뒤로"
          style={{
            width: 48,
            height: 48,
            marginLeft: -12,
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-main)',
          }}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-h2" style={{ color: 'var(--color-text-main)' }}>
            {destination.name}
          </div>
          <div
            className="font-caption flex items-center"
            style={{ gap: 4, color: 'var(--color-text-sub)', marginTop: 2 }}
          >
            <MapPin className="w-3 h-3" strokeWidth={1.6} />
            <span className="truncate">{destination.address}</span>
          </div>
        </div>
      </div>

      {/* Summary chip */}
      <div
        className="flex items-center"
        style={{
          gap: 12,
          padding: '12px 20px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(44, 94, 67, 0.12)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Footprints className="w-4 h-4" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <div className="font-body-lg" style={{ color: 'var(--color-text-main)' }}>
            {route ? `도보 ${route.durationText}` : '경로를 찾는 중…'}
          </div>
          {route && (
            <div className="font-caption" style={{ color: 'var(--color-text-sub)', marginTop: 2 }}>
              총 거리 {route.distanceText}
              {isEstimate ? ' (직선 추정)' : ''}
            </div>
          )}
        </div>
      </div>

      {/* 직선 추정으로 물러난 경우에만 이유를 밝힌다 */}
      {fallbackReason && (
        <div
          className="flex items-start"
          style={{
            gap: 8,
            padding: '10px 20px',
            backgroundColor: 'rgba(208, 74, 60, 0.06)',
            borderBottom: '1px solid rgba(208, 74, 60, 0.2)',
            color: 'var(--color-text-sub)',
          }}
        >
          <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} style={{ marginTop: 2 }} />
          <div className="font-caption">
            실제 보행 경로를 불러오지 못해 직선 거리로 표시합니다. ({fallbackReason})
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ height: '45%', position: 'relative' }}>
        <MapView
          restrooms={[destination]}
          center={origin}
          selectedRestroom={null}
          favorites={new Set()}
          onSelectRestroom={() => {}}
          directionsOrigin={origin}
          routePath={route?.path ?? null}
          routeIsEstimate={isEstimate}
        />
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
        <div className="font-h2" style={{ color: 'var(--color-text-main)', marginBottom: 12 }}>
          경로 안내
        </div>
        {route && route.steps.length > 0 ? (
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {route.steps.map((step, idx) => {
              const TurnIcon = turnIcon(step.turnType);
              return (
                <li
                  key={idx}
                  className="flex items-start"
                  style={{
                    gap: 12,
                    padding: 12,
                    borderRadius: 'var(--radius-12)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--elevation-low)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TurnIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-body-md" style={{ color: 'var(--color-text-main)' }}>
                      {step.instruction}
                    </div>
                    {step.distanceText && !instructionHasDistance(step.instruction) && (
                      <div
                        className="font-caption"
                        style={{ color: 'var(--color-text-sub)', marginTop: 2 }}
                      >
                        {step.distanceText}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            <li
              className="flex items-center"
              style={{
                gap: 12,
                padding: 12,
                borderRadius: 'var(--radius-12)',
                backgroundColor: 'rgba(208, 74, 60, 0.06)',
                border: '1px solid rgba(208, 74, 60, 0.2)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Navigation className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div className="font-body-md" style={{ color: 'var(--color-text-main)' }}>
                {destination.name}에 도착
              </div>
            </li>
          </ol>
        ) : (
          <div
            className="font-body-md text-center"
            style={{ color: 'var(--color-text-sub)', padding: '32px 20px' }}
          >
            {isLoading ? '경로를 계산하고 있어요' : '단계별 안내를 불러오지 못했어요'}
          </div>
        )}

        {route?.source === 'tmap' && (
          <div
            className="font-caption text-center"
            style={{ color: 'var(--color-text-sub)', marginTop: 16 }}
          >
            보행자 경로 제공: TMAP
          </div>
        )}
      </div>
    </div>
  );
}
