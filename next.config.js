/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      exceljs: 'exceljs/dist/exceljs.min.js',
    };
    return config;
  },
};

module.exports = nextConfig;

