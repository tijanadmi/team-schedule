import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @returns {import('next').NextConfig} */
const nextConfig = (phase) => ({
  // A production build must not overwrite chunks used by the running dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});

export default nextConfig;
