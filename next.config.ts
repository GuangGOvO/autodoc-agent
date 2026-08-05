import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 自包含输出：Docker 镜像运行 .next/standalone/server.js
  output: 'standalone',
  // 开发环境允许的来源（逗号分隔），生产环境无需配置
  allowedDevOrigins: (process.env.NEXT_PUBLIC_DEV_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
};

export default nextConfig;
