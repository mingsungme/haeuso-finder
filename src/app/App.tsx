import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, MapIcon, List, Menu } from 'lucide-react';
import DirectionsScreen from './components/DirectionsScreen';
import MapView, { Restroom } from './components/MapView';
import RestroomCard from './components/RestroomCard';
import FilterPanel, { FilterOptions } from './components/FilterPanel';
import { GoogleMapsProvider } from './components/GoogleMapsProvider';
import {
  searchNearbyRestrooms,
  geocodeAddress,
  fetchAddressSuggestions,
  resetAutocompleteSession,
  type AutocompleteSuggestion,
} from './lib/places';

// Fallback sample data used before Places API returns
const mockRestrooms: Restroom[] = [
  {
    id: '1',
    name: '서울역 공중화장실',
    address: '서울특별시 중구 봉래동2가 122 서울역',
    lat: 37.5547,
    lng: 126.9707,
    isAccessible: true,
    is24Hours: true,
    hasChangingTable: true,
    distance: '120m',
  },
  {
    id: '2',
    name: '남대문시장 공중화장실',
    address: '서울특별시 중구 남대문시장4길 21',
    lat: 37.5592,
    lng: 126.9775,
    isAccessible: true,
    is24Hours: false,
    hasChangingTable: false,
    distance: '350m',
  },
  {
    id: '3',
    name: '명동역 공중화장실',
    address: '서울특별시 중구 명동8길 31',
    lat: 37.5615,
    lng: 126.9863,
    isAccessible: false,
    is24Hours: true,
    hasChangingTable: true,
    distance: '580m',
  },
  {
    id: '4',
    name: '숭례문 공중화장실',
    address: '서울특별시 중구 세종대로 40',
    lat: 37.5602,
    lng: 126.9754,
    isAccessible: true,
    is24Hours: true,
    hasChangingTable: false,
    distance: '720m',
  },
  {
    id: '5',
    name: '시청역 공중화장실',
    address: '서울특별시 중구 태평로1가 31',
    lat: 37.5663,
    lng: 126.9780,
    isAccessible: true,
    is24Hours: false,
    hasChangingTable: true,
    distance: '890m',
  },
];

export default function App() {
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    is24Hours: false,
    isAccessible: false,
    hasChangingTable: false,
  });
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('otd:favorites');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });
  const [favoriteRestrooms, setFavoriteRestrooms] = useState<Record<string, Restroom>>(() => {
    try {
      const raw = localStorage.getItem('otd:favoriteRestrooms');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });
  const [pinned, setPinned] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('otd:pinned');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });
  const [userLocation, setUserLocation] = useState({ lat: 37.5563, lng: 126.9723 });
  const [showFilters, setShowFilters] = useState(false);
  const [restrooms, setRestrooms] = useState<Restroom[]>(mockRestrooms);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [directionsTarget, setDirectionsTarget] = useState<Restroom | null>(null);

  const handleGetDirections = useCallback((restroom: Restroom) => {
    setDirectionsTarget(restroom);
    setSelectedRestroom(restroom);
    setViewMode('map');
  }, []);

  const clearDirections = useCallback(() => {
    setDirectionsTarget(null);
  }, []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  const fetchNearby = useCallback(async (center: { lat: number; lng: number }) => {
    setIsSearching(true);
    const results = await searchNearbyRestrooms(center);
    setIsSearching(false);
    if (results.length > 0) {
      setRestrooms(results);
    }
  }, []);

  const scheduleFetch = useCallback((center: { lat: number; lng: number }) => {
    const last = lastCenterRef.current;
    if (last) {
      const dLat = Math.abs(last.lat - center.lat);
      const dLng = Math.abs(last.lng - center.lng);
      if (dLat < 0.0005 && dLng < 0.0005) return;
    }
    lastCenterRef.current = center;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchNearby(center), 800);
  }, [fetchNearby]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied or unavailable', error);
        }
      );
    }
  }, []);

  const filteredRestrooms = useMemo(() => {
    return restrooms.filter((restroom) => {
      const matchesFilters =
        (!filters.is24Hours || restroom.is24Hours) &&
        (!filters.isAccessible || restroom.isAccessible) &&
        (!filters.hasChangingTable || restroom.hasChangingTable);

      return matchesFilters;
    });
  }, [restrooms, filters]);

  const runGeocode = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const { result, error } = await geocodeAddress(trimmed);
    if (result) {
      setApiError(null);
      lastCenterRef.current = null;
      setUserLocation(result);
      fetchNearby(result);
    } else if (error) {
      setApiError(error);
    }
  }, [fetchNearby]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    resetAutocompleteSession();
    await runGeocode(searchQuery);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    const q = value.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      const list = await fetchAddressSuggestions(q, 3);
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
    }, 200);
  };

  const handleSelectSuggestion = (s: AutocompleteSuggestion) => {
    setSearchQuery(s.text);
    setShowSuggestions(false);
    resetAutocompleteSession();
    runGeocode(s.text);
  };

  const handleRestroomClick = (restroom: Restroom) => {
    setSelectedRestroom(selectedRestroom?.id === restroom.id ? null : restroom);
  };

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('otd:favorites', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    const found =
      restrooms.find((r) => r.id === id) ||
      (selectedRestroom?.id === id ? selectedRestroom : undefined);
    if (found) {
      setFavoriteRestrooms((prev) => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id];
        } else {
          next[id] = found;
        }
        try {
          localStorage.setItem('otd:favoriteRestrooms', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [restrooms, selectedRestroom]);

  const favoritesList = useMemo(
    () => Object.values(favoriteRestrooms),
    [favoriteRestrooms]
  );

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try {
        localStorage.setItem('otd:pinned', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const listRestrooms = useMemo(() => {
    const map = new Map<string, Restroom>();
    for (const r of favoritesList) map.set(r.id, r);
    for (const r of filteredRestrooms) if (!map.has(r.id)) map.set(r.id, r);
    return Array.from(map.values()).sort((a, b) => {
      const ap = pinned.has(a.id) ? 0 : 1;
      const bp = pinned.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const af = favorites.has(a.id) ? 0 : 1;
      const bf = favorites.has(b.id) ? 0 : 1;
      return af - bf;
    });
  }, [favoritesList, filteredRestrooms, favorites, pinned]);

  return (
    <GoogleMapsProvider>
      <div className="h-screen flex flex-col relative" style={{ backgroundColor: 'var(--color-bg-default)' }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ padding: '20px 20px 16px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <h1 className="font-h1" style={{ color: 'var(--color-primary)' }}>해우소</h1>
                <p className="font-caption" style={{ color: 'var(--color-text-sub)', marginTop: 2 }}>
                  근심을 비워내는 곳
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-label="필터"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: showFilters ? 'var(--color-primary)' : 'transparent',
                  color: showFilters ? '#fff' : 'var(--color-text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--color-text-sub)' }}
              />
              <input
                type="text"
                placeholder="주소를 입력해 비울 곳을 찾으세요"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                className="w-full font-body-md"
                style={{
                  paddingLeft: 40,
                  paddingRight: 16,
                  height: 48,
                  borderRadius: 'var(--radius-8)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-default)',
                  color: 'var(--color-text-main)',
                  outline: 'none',
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    padding: 4,
                    borderRadius: 'var(--radius-12)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--elevation-high)',
                    listStyle: 'none',
                    margin: 0,
                  }}
                >
                  {suggestions.map((s, idx) => (
                    <li key={`${s.placeId ?? idx}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left flex items-center font-body-md"
                        style={{
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-8)',
                          color: 'var(--color-text-main)',
                          backgroundColor: 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            'var(--color-bg-default)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            'transparent';
                        }}
                      >
                        <Search
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: 'var(--color-text-sub)' }}
                          strokeWidth={1.6}
                        />
                        <span className="truncate">{s.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            {/* View Toggle */}
            <div
              className="flex"
              style={{
                marginTop: 16,
                padding: 4,
                backgroundColor: 'var(--color-bg-default)',
                borderRadius: 'var(--radius-full)',
                gap: 4,
              }}
            >
              <button
                onClick={() => setViewMode('map')}
                className="flex-1 flex items-center justify-center font-button"
                style={{
                  gap: 6,
                  height: 40,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: viewMode === 'map' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'map' ? '#fff' : 'var(--color-text-sub)',
                  transition: 'all 0.2s',
                }}
              >
                <MapIcon className="w-4 h-4" />
                <span>지도</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="flex-1 flex items-center justify-center font-button"
                style={{
                  gap: 6,
                  height: 40,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: viewMode === 'list' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--color-text-sub)',
                  transition: 'all 0.2s',
                }}
              >
                <List className="w-4 h-4" />
                <span>목록</span>
              </button>
            </div>
          </div>

          {/* Results Counter */}
          <div
            className="font-caption"
            style={{
              padding: '8px 20px',
              color: 'var(--color-text-sub)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {isSearching
              ? '주변을 살피는 중…'
              : `${filteredRestrooms.length}곳 · 즐겨찾기 ${favoritesList.length} · 핀 ${pinned.size}`}
          </div>
          {apiError && (
            <div
              className="font-caption"
              style={{
                padding: '8px 20px',
                color: 'var(--color-error)',
                backgroundColor: 'rgba(208, 74, 60, 0.06)',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              {apiError}
            </div>
          )}
        </header>

        {/* Filters */}
        {showFilters && (
          <FilterPanel filters={filters} onFilterChange={setFilters} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {viewMode === 'map' ? (
            <div className="h-full relative">
              <MapView
                restrooms={filteredRestrooms}
                center={userLocation}
                selectedRestroom={selectedRestroom}
                favorites={favorites}
                onSelectRestroom={setSelectedRestroom}
                onIdle={scheduleFetch}
              />
              {selectedRestroom && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ bottom: 0, padding: 20 }}
                >
                  <div className="pointer-events-auto">
                    <RestroomCard
                      restroom={selectedRestroom}
                      isSelected={true}
                      isFavorite={favorites.has(selectedRestroom.id)}
                      isPinned={pinned.has(selectedRestroom.id)}
                      onClick={() => setSelectedRestroom(null)}
                      onToggleFavorite={toggleFavorite}
                      onTogglePin={togglePin}
                      onGetDirections={handleGetDirections}
                      origin={userLocation}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {listRestrooms.length > 0 ? (
                  listRestrooms.map((restroom) => (
                    <RestroomCard
                      key={restroom.id}
                      restroom={restroom}
                      isSelected={selectedRestroom?.id === restroom.id}
                      isFavorite={favorites.has(restroom.id)}
                      isPinned={pinned.has(restroom.id)}
                      onClick={() => handleRestroomClick(restroom)}
                      onToggleFavorite={toggleFavorite}
                      onTogglePin={togglePin}
                      onGetDirections={handleGetDirections}
                      origin={userLocation}
                    />
                  ))
                ) : (
                  <div
                    className="text-center"
                    style={{ padding: '48px 20px', color: 'var(--color-text-sub)' }}
                  >
                    <p className="font-h2" style={{ marginBottom: 8, color: 'var(--color-text-main)' }}>
                      비워낼 곳이 보이지 않습니다
                    </p>
                    <p className="font-body-md">잠시 후 다시 찾아보세요</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {directionsTarget && (
          <DirectionsScreen
            origin={userLocation}
            destination={directionsTarget}
            onClose={clearDirections}
          />
        )}
      </div>
    </GoogleMapsProvider>
  );
}