/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.ALLOW_WEB_TS_ERRORS === "true",
  },
};

module.exports = nextConfig;
