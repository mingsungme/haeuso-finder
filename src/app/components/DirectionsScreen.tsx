import { ArrowLeft, Navigation, MapPin, Footprints } from 'lucide-react';
import MapView, { Restroom } from './MapView';

interface DirectionsScreenProps {
  origin: { lat: number; lng: number };
  destination: Restroom;
  info: {
    distanceText: string;
    durationText: string;
    steps: { instruction: string; distanceText: string }[];
  } | null;
  onResult: (info: {
    distanceText: string;
    durationText: string;
    steps: { instruction: string; distanceText: string }[];
  } | null) => void;
  onClose: () => void;
}

export default function DirectionsScreen({
  origin,
  destination,
  info,
  onResult,
  onClose,
}: DirectionsScreenProps) {
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
            {info ? `도보 ${info.durationText}` : '경로를 찾는 중…'}
          </div>
          {info && (
            <div className="font-caption" style={{ color: 'var(--color-text-sub)', marginTop: 2 }}>
              총 거리 {info.distanceText}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '45%', position: 'relative' }}>
        <MapView
          restrooms={[destination]}
          center={origin}
          selectedRestroom={null}
          favorites={new Set()}
          onSelectRestroom={() => {}}
          directionsOrigin={origin}
          directionsDestination={destination}
          onDirectionsResult={onResult}
        />
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
        <div className="font-h2" style={{ color: 'var(--color-text-main)', marginBottom: 12 }}>
          경로 안내
        </div>
        {info && info.steps.length > 0 ? (
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {info.steps.map((step, idx) => (
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
                  className="font-caption"
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body-md" style={{ color: 'var(--color-text-main)' }}>
                    {step.instruction}
                  </div>
                  <div className="font-caption" style={{ color: 'var(--color-text-sub)', marginTop: 2 }}>
                    {step.distanceText}
                  </div>
                </div>
              </li>
            ))}
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
            {info ? '단계별 안내를 불러오는 중…' : '경로를 계산하고 있어요'}
          </div>
        )}
      </div>
    </div>
  );
}
