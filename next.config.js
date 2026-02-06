/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Note: compiler.removeConsole is not supported in Turbopack
  images: {
    domains: [
      'localhost',
      'ui-avatars.com',
      'cdninstagram.com',
      'scontent.cdninstagram.com',
      'p16-sign-sg.tiktokcdn.com',
      'p16-sign.tiktokcdn-us.com',
      'scontent.xx.fbcdn.net',
      'scontent-xsp1-1.xx.fbcdn.net'
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label'
    ],
  },
}

module.exports = nextConfig
