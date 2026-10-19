/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Client-folder uploads go through a server action (files up to 4 MB).
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Pages from the earlier design that the Lovable-style site doesn't have.
  async redirects() {
    return [
      { source: "/quote", destination: "/start", permanent: false },
      ...["/about", "/how-it-works", "/why-compare", "/contact"].map(source => ({ source, destination: "/", permanent: false })),
    ];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};
export default nextConfig;
