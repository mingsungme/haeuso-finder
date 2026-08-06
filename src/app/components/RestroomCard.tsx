import { MapPin, Clock, Accessibility, Baby, Navigation, Pin, PinOff, Star } from 'lucide-react';
import type { Restroom } from './MapView';

interface RestroomCardProps {
  restroom: Restroom;
  isSelected: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  origin?: { lat: number; lng: number };
  onClick: () => void;
  onToggleFavorite?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onGetDirections?: (restroom: Restroom) => void;
}

export default function RestroomCard({
  restroom,
  isSelected,
  isFavorite,
  isPinned,
  origin,
  onClick,
  onToggleFavorite,
  onTogglePin,
  onGetDirections,
}: RestroomCardProps) {
  // origin is forwarded to the parent for in-app directions; not used here directly.
  void origin;

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGetDirections?.(restroom);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(restroom.id);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(restroom.id);
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 'var(--radius-12)',
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        boxShadow: isSelected ? 'var(--elevation-high)' : 'var(--elevation-low)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: 12, gap: 12 }}>
        <div className="flex-1 min-w-0">
          <h3 className="font-h2" style={{ color: 'var(--color-text-main)', marginBottom: 4 }}>
            {restroom.name}
          </h3>
          <div className="flex items-start font-body-md" style={{ gap: 4, color: 'var(--color-text-sub)' }}>
            <MapPin className="w-4 h-4 flex-shrink-0" style={{ marginTop: 2 }} strokeWidth={1.6} />
            <span className="line-clamp-2">{restroom.address}</span>
          </div>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 8 }}>
          {restroom.distance && (
            <div className="font-caption" style={{ color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>
              {restroom.distance}
            </div>
          )}
          <div className="flex items-center" style={{ gap: 4 }}>
            {onToggleFavorite && (
              <button
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFavorite ? 'rgba(220, 161, 68, 0.16)' : 'var(--color-bg-default)',
                  color: isFavorite ? 'var(--color-warning)' : 'var(--color-text-sub)',
                  transition: 'all 0.2s',
                }}
              >
                <Star
                  className="w-4 h-4"
                  strokeWidth={1.6}
                  style={isFavorite ? { fill: 'currentColor' } : undefined}
                />
              </button>
            )}
            {onTogglePin && (
              <button
                onClick={handleTogglePin}
                aria-label={isPinned ? '핀 해제' : '핀 고정'}
                title={isPinned ? '핀 해제' : '핀 고정'}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isPinned ? 'rgba(44, 94, 67, 0.12)' : 'var(--color-bg-default)',
                  color: isPinned ? 'var(--color-primary)' : 'var(--color-text-sub)',
                  transition: 'all 0.2s',
                }}
              >
                {isPinned ? (
                  <Pin className="w-4 h-4" strokeWidth={1.6} style={{ fill: 'currentColor' }} />
                ) : (
                  <PinOff className="w-4 h-4" strokeWidth={1.6} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 12 }}>
        {restroom.is24Hours && (
          <Chip icon={<Clock className="w-3 h-3" strokeWidth={1.8} />} label="24시간" />
        )}
        {restroom.isAccessible && (
          <Chip icon={<Accessibility className="w-3 h-3" strokeWidth={1.8} />} label="장애인 이용" />
        )}
        {restroom.hasChangingTable && (
          <Chip icon={<Baby className="w-3 h-3" strokeWidth={1.8} />} label="기저귀 교환대" />
        )}
      </div>

      <button
        onClick={handleGetDirections}
        className="w-full flex items-center justify-center font-button"
        style={{
          gap: 8,
          height: 48,
          borderRadius: 'var(--radius-12)',
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          transition: 'background 0.2s',
        }}
      >
        <Navigation className="w-4 h-4" strokeWidth={2} />
        <span>길찾기</span>
      </button>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center font-caption"
      style={{
        gap: 4,
        padding: '4px 8px',
        borderRadius: 'var(--radius-4)',
        backgroundColor: 'var(--color-bg-default)',
        color: 'var(--color-text-sub)',
        border: '1px solid var(--color-border)',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
