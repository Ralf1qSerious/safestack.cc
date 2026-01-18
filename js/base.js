// js/base.js
(() => {
  const { hostname, pathname } = window.location;

  // If deployed at https://username.github.io/repo/...
  // base becomes "/repo"
  let base = "";
  const parts = pathname.split("/").filter(Boolean);

  if (hostname.endsWith("github.io") && parts.length > 0) {
    base = "/" + parts[0];
  }

  // Allow override (optional): <meta name="ss-base" content="/yourbase">
  const meta = document.querySelector('meta[name="ss-base"]');
  if (meta?.content) base = meta.content.replace(/\/+$/, "");

  window.SS_BASE = base;

  // Helper to build absolute-in-site URLs safely
  window.ssUrl = (p) => {
    if (!p) return base + "/";
    return base + (p.startsWith("/") ? p : "/" + p);
  };

  // Normalize pathname by stripping repo base (so "/repo/status.html" => "/status.html")
  window.ssPath = () => {
    if (!base) return pathname;
    return pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  };
})();
