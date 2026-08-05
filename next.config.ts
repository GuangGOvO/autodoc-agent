import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 自包含输出：Docker 镜像运行 .next/standalone/server.js
  output: 'standalone',
  allowedDevOrigins: ['192.168.5.7'],
};

export default nextConfig;
