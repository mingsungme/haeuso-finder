import { defineConfig, loadEnv, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { handleRouteRequest } from './api/_tmap'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/**
 * 개발 서버에서 POST /api/route를 처리한다.
 *
 * 배포에서는 같은 경로를 Vercel 서버리스 함수(api/route.ts)가 맡는다.
 * 로직은 양쪽 다 api/_tmap.ts의 handleRouteRequest 하나만 쓰므로,
 * 로컬과 배포의 동작이 갈라질 일이 없다.
 */
function tmapDevApi(appKey: string | undefined): Plugin {
  return {
    name: 'tmap-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/route', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }

        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST')
          send(405, { error: 'POST만 지원합니다.' })
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : {}
          const result = await handleRouteRequest(body, appKey)
          send(result.status, result.body)
        } catch (e) {
          send(400, { error: `요청 처리 실패: ${(e as Error).message}` })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // TMAP_APP_KEY는 VITE_ 접두사가 없어 클라이언트 번들에 들어가지 않는다.
  // 그래서 vite.config에서 직접 읽어 dev 미들웨어에만 넘긴다.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      tmapDevApi(env.TMAP_APP_KEY),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
