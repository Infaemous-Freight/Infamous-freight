/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone', // Enable standalone output for Docker/Fly.io
    compress: true,
    poweredByHeader: false,
};
export default nextConfig;
