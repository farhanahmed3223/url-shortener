/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/r/:code",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/r/:code`,
      },
    ];
  },
};

module.exports = nextConfig;
