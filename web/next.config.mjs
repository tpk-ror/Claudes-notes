/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Localhost binding (NFR-4.5)
  // The server is configured to bind to 127.0.0.1 only via CLI flags in package.json:
  //   - dev: next dev --turbopack -H 127.0.0.1
  //   - start: next start -H 127.0.0.1
  // This prevents the application from being accessible from other machines on the network.
};

export default nextConfig;
