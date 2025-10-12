/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent WebSocket cleanup loops in production
  transpilePackages: ['@refinedev/antd', '@refinedev/core', '@refinedev/nextjs-router', 'antd'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })

    // Ignore @novnc/novnc during server-side bundling to avoid top-level await errors
    // VNC components are client-only and loaded dynamically, so they don't need server bundling
    if (isServer) {
      config.externals.push('@novnc/novnc')
    }

    return config
  },
}

module.exports = nextConfig
