import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'socket.io'],
};

export default nextConfig;
