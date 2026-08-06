import { ReactNode, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

// Get API key from environment variable or use hardcoded key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBj04hWexiislQE4cUM-Po-0iAHcQO6apg';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

function hasImportLibrary(): boolean {
  const g = (window as any).google;
  return typeof g?.maps?.importLibrary === 'function';
}

// Google's official inline bootstrap loader.
// Guarantees google.maps.importLibrary is registered before any script loads.
function installBootstrap(apiKey: string) {
  if (hasImportLibrary()) return;
  ((g: any) => {
    let h: Promise<any> | undefined;
    let a: HTMLScriptElement;
    let k: string;
    const p = 'The Google Maps JavaScript API';
    const c = 'google';
    const l = 'importLibrary';
    const q = '__ib__';
    const m = document;
    const b: any = (window as any)[c] || ((window as any)[c] = {});
    const d = b.maps || (b.maps = {});
    const r = new Set<string>();
    const e = new URLSearchParams();
    const u = () =>
      h ||
      (h = new Promise<any>((f, n) => {
        a = m.createElement('script');
        e.set('libraries', Array.from(r).join(','));
        for (k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
        e.set('callback', c + '.maps.' + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e.toString();
        d[q] = f;
        a.onerror = () => (h = n(new Error(p + ' could not load.')));
        a.nonce = (m.querySelector('script[nonce]') as HTMLScriptElement)?.nonce || '';
        m.head.append(a);
      }));
    if (d[l]) {
      console.warn(p + ' only loads once. Ignoring:', g);
    } else {
      d[l] = (f: string, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n));
    }
  })({ key: apiKey, v: 'weekly' });
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      installBootstrap(apiKey);
      // @ts-ignore
      await (window as any).google.maps.importLibrary('maps');
      // @ts-ignore
      await (window as any).google.maps.importLibrary('marker');
      // @ts-ignore
      await (window as any).google.maps.importLibrary('places');
      // @ts-ignore
      await (window as any).google.maps.importLibrary('geocoding');
      resolve();
    } catch (err) {
      reject(err as Error);
    }
  });
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setLoadError(new Error('No API key provided'));
      return;
    }
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => setIsLoaded(true))
      .catch((error) => {
        console.error('Google Maps load error:', error);
        setLoadError(error);
      });
  }, []);

  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Google Maps 로딩 오류</h3>
          <p className="text-gray-600 mb-4">
            지도를 불러오는 중에 문제가 발생했습니다.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm space-y-2 border border-gray-200">
            {loadError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700 font-semibold">에러 메시지:</p>
                <p className="text-xs text-red-600">{loadError.message}</p>
              </div>
            )}
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-700 font-semibold">현재 API 키 상태:</p>
              <p className="text-xs text-blue-600 break-all">
                {GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 30)}...` : '설정되지 않음'}
              </p>
            </div>
            <p className="font-semibold text-gray-900">디버깅 팁:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
              <li>브라우저 콘솔에서 자세한 에러 확인</li>
              <li>Google Cloud Console에서 API 활성화 확인</li>
              <li>API 키 제한 설정 확인</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-gray-600">지도를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export { GOOGLE_MAPS_API_KEY };
