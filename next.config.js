/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  basePath: isProd ? '/aumara-site' : '',
  assetPrefix: isProd ? '/aumara-site/' : undefined,
  output: 'export',
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: isProd ? '/aumara-site' : '' },
};
module.exports = nextConfig;
