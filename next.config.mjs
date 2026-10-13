/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io', 'localhost'],
}

export default nextConfig
