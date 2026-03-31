/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workaround for Windows + OneDrive reparse-point issue causing EINVAL readlink in Next cleanup.
  cleanDistDir: false,
  // Standalone output cho Docker (giảm image size ~70%)
  output: 'standalone',
  swcMinify: true,
  // Note: compiler.removeConsole is not supported in Turbopack
  images: {
    domains: [
      'localhost',
      'wsrv.nl',
      'images.weserv.nl',
      'ui-avatars.com',
      'cdninstagram.com',
      'scontent.cdninstagram.com',
      'p16-sign-sg.tiktokcdn.com',
      'p16-sign.tiktokcdn-us.com',
      'scontent.xx.fbcdn.net',
      'scontent-xsp1-1.xx.fbcdn.net',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'googleusercontent.com',
      'drive.google.com'
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
