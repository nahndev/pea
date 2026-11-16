import type { NextConfig } from 'next';
import { z } from 'zod';

const { API_URL } = z
  .object({
    API_URL: z.url().refine((value) => new URL(value).pathname === '/', 'API_URL must be the api origin without a path'),
  })
  .parse(process.env);

/** Read from source like `@tomato/ui`, so dev picks up changes without rebuilding `dist` */
const SOURCE_PACKAGES = { '@tomato/constants': '../../packages/constants/src/index.ts' };

const nextConfig: NextConfig = {
  transpilePackages: ['@tomato/ui', ...Object.keys(SOURCE_PACKAGES)],
  turbopack: { resolveAlias: SOURCE_PACKAGES },
  allowedDevOrigins: ['127.0.0.1'],
  rewrites: async () => [{ source: '/rest/:path*', destination: `${API_URL}/rest/:path*` }],
};

export default nextConfig;
