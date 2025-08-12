/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
  }
}

export default nextConfig