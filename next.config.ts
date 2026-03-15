import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg", permanent: false },
    ];
  },
};

export default nextConfig;
