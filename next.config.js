/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["www.arweave.net"],
  },
  compiler: {
    removeConsole: {
      exclude: ["error"],
    },
  },
};

module.exports = nextConfig;
