import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SECONDME_API_BASE_URL: process.env.NEXT_PUBLIC_SECONDME_API_BASE_URL,
    NEXT_PUBLIC_TOWOW_API_URL: process.env.NEXT_PUBLIC_TOWOW_API_URL,
  },
};

export default nextConfig;
