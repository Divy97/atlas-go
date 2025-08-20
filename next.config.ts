import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.animatedimages.org",
      },
      {
        protocol: "https",
        hostname: "www.cameronsworld.net",
      },
      {
        protocol: "https",
        hostname: "web.archive.org",
      },
      {
        protocol: "https",
        hostname: "blob.gifcities.org"
      }
    ],
  },
};

export default nextConfig;
