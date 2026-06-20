/**
 * Next.js configuration.
 *
 * Security headers are defined here so they apply to every route in both
 * development and production (including on Vercel). These follow OWASP
 * "Secure Headers" guidance and give the app an industrial-standard baseline
 * even though v1 stores data locally in the browser.
 *
 * See SECURITY.md for the full threat model, the residual-risk notes, and the
 * backend hardening path.
 */

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js (App Router) injects inline bootstrap/hydration scripts. Without a
  // nonce (which requires dynamic rendering — this app is fully static) these
  // need 'unsafe-inline'. Everything else is locked to same-origin.
  "script-src 'self' 'unsafe-inline'",
  // Inline style *attributes* (e.g. style={{ width }}) and Next's critical CSS
  // require 'unsafe-inline' for styles.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // No external network calls in v1 — keep connections same-origin only.
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "child-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  // Clickjacking protection (legacy + CSP frame-ancestors above).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Block MIME sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Leak as little referrer information as possible.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Drop powerful features the app never uses.
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), browsing-topics=()',
  },
  // Cross-origin isolation / info-leak hardening.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Force HTTPS for two years, including subdomains, and allow preload listing.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework/version.
  poweredByHeader: false,
  // The app uses no next/image; disabling the optimizer removes the entire
  // image-optimization attack surface (DoS / SSRF-style advisories).
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
