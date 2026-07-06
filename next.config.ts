import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);

initOpenNextCloudflareForDev();
