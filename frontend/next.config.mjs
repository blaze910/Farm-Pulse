/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api/* through Vercel's own server to the Django backend instead
  // of the browser calling Render directly. This is the real fix for iOS
  // Safari failing to sign up/log in at all: Safari's Intelligent Tracking
  // Prevention (ITP) blocks cookies on cross-site subresource requests —
  // i.e. exactly what "browser on vercel.app calls fetch() against
  // onrender.com" is — regardless of Secure/SameSite=None being set
  // correctly. It doesn't matter how correct the cookie attributes are;
  // Safari treats the two different registrable domains as unrelated
  // sites and withholds the cookie.
  //
  // Routing every API call through this same-origin path means the
  // browser only ever talks to its own origin (farm-pulse-live.vercel.app)
  // — Vercel's server fetches Render on the backend and streams the
  // response (including Set-Cookie) straight back. From the browser's
  // point of view the cookie was set by a first-party same-origin
  // response, so ITP (and any future Chrome/Firefox third-party cookie
  // restrictions) never come into play at all.
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET || "http://localhost:8000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
