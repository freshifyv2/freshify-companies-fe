/**
 * freshify-companies-fe — Sovereign Portal Companies module FE.
 *
 * assetPrefix lets the portal shell route this FE's static chunks
 * correctly when multiple FE Next.js apps are composed under one host.
 * See freshify-users-fe/next.config.mjs for the full explanation.
 */
const ASSET_PREFIX = "/_companies-fe";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  assetPrefix: ASSET_PREFIX,
};

export default nextConfig;
