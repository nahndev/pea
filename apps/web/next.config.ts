import type { NextConfig } from 'next';
import { z } from 'zod';

const { API_URL } = z
  .object({
    API_URL: z.url().refine((value) => new URL(value).pathname === '/', 'API_URL must be the api origin without a path'),
  })
  .parse(process.env);

const nextConfig: NextConfig = {
  transpilePackages: ['@tomato/ui'],
  allowedDevOrigins: ['127.0.0.1'],
  rewrites: async () => [{ source: '/rest/:path*', destination: `${API_URL}/rest/:path*` }],
};

export default nextConfig;
