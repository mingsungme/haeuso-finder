/**
 * POST /api/route — Vercel 서버리스 함수.
 *
 * 브라우저는 TMAP을 직접 부르지 않고 이 창구만 호출한다.
 * 덕분에 TMAP_APP_KEY는 서버 환경변수로만 존재하고 번들에 구워지지 않는다.
 * (로컬 개발에서는 vite.config.ts의 tmapDevApi 미들웨어가 같은 경로를 대신 처리한다.)
 */
import { handleRouteRequest, type RouteRequestBody } from './_tmap';

interface VercelRequest {
  method?: string;
  body?: RouteRequestBody | string;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: unknown): void;
  setHeader(name: string, value: string): void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'POST만 지원합니다.' });
    return;
  }

  // Vercel은 Content-Type: application/json이면 body를 미리 파싱해 준다.
  // 다만 문자열로 넘어오는 경우가 있어 양쪽 모두 대비한다.
  let body: RouteRequestBody = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  } catch {
    res.status(400).json({ error: '요청 본문이 올바른 JSON이 아닙니다.' });
    return;
  }

  const result = await handleRouteRequest(body, process.env.TMAP_APP_KEY);
  res.status(result.status).json(result.body);
}
