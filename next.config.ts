import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@react-three/fiber', '@react-three/drei', 'three', 'leva'],
};

export default nextConfig;
