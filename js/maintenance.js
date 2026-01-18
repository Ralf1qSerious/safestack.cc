// js/maintenance.js
(async () => {
  // base.js must run first
  if (!window.ssUrl || !window.ssPath) return;

  let cfg;
  try {
    const res = await fetch(ssUrl("/config.json"), { cache: "no-store" });
    if (!res.ok) return;
    cfg = await res.json();
  } catch {
    return;
  }

  const m = cfg?.maintenance;
  if (!m?.enabled) return;

  // Compare allowed paths against normalized path (no repo prefix)
  const path = ssPath(); // ex: "/status.html"
  const allowed = (m.allowedPaths || []).some((p) => p === path);
  if (allowed) return;

  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const siteName = esc(cfg?.site?.name || "SafeStack");
  const title = esc(m.title || "Under Maintenance");
  const message = esc(m.message || "We’re deploying updates.");
  const sub = esc(m.submessage || "");

  const showIcon = m.showIcon !== false;

  const statusPath = m.statusPagePath || "/status.html";
  const showStatusButton = m.showStatusButton !== false;

  const primary = m.primaryButton || { label: "View Status", href: statusPath };
  const secondary = m.secondaryButton || { label: "Back to Home", href: "/index.html" };

  const sev = (m.severity || "warning").toLowerCase();
  const sevMap = {
    info: { bg: "rgba(56,189,248,0.12)", br: "rgba(56,189,248,0.22)", label: "Info", icon: "ℹ️" },
    warning: { bg: "rgba(245,158,11,0.12)", br: "rgba(245,158,11,0.22)", label: "Maintenance", icon: "⚠️" },
    danger: { bg: "rgba(239,68,68,0.12)", br: "rgba(239,68,68,0.22)", label: "Incident", icon: "🛑" }
  };
  const s = sevMap[sev] || sevMap.warning;

  // Banner mode (non-blocking)
  if ((m.mode || "page") === "banner") {
    const banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <div style="
        position: sticky; top: 0; z-index: 9999;
        width: 100%;
        background: ${s.bg};
        border-bottom: 1px solid ${s.br};
        backdrop-filter: blur(10px);
      ">
        <div style="
          max-width: 1020px; margin: 0 auto;
          padding: 0.65rem 1rem;
          display: flex; gap: 0.65rem; align-items: center; justify-content: space-between;
          color: rgba(230,237,243,0.92);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          font-size: 0.95rem;
        ">
          <div style="display:flex; gap:0.6rem; align-items:center;">
            ${showIcon ? `<span aria-hidden="true">${s.icon}</span>` : ""}
            <strong style="opacity:0.95;">${title}</strong>
            <span style="opacity:0.85;">${message}</span>
          </div>
          ${showStatusButton ? `
            <a href="${esc(ssUrl(statusPath))}" style="
              padding: 0.35rem 0.65rem;
              border-radius: 999px;
              border: 1px solid ${s.br};
              background: rgba(255,255,255,0.04);
              color: rgba(230,237,243,0.92);
              text-decoration: none;
              font-weight: 800;
              white-space: nowrap;
            ">Status →</a>
          ` : ""}
        </div>
      </div>
    `;
    document.body.prepend(banner);
    return;
  }

  // Full-page overlay
  document.documentElement.style.overflow = "hidden";

  const win = m.window || {};
  const startIso = win.start || "";
  const etaIso = win.eta || "";
  const progress = Math.max(0, Math.min(100, Number(win.progress ?? 65)));

  const updates = Array.isArray(m.updates) && m.updates.length
    ? m.updates.map(esc)
    : ["Deploying updates", "Running checks", "Warming caches", "Verifying routes"].map(esc);

  const overlay = document.createElement("div");
  overlay.setAttribute("role", "alert");

  overlay.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 99999;
      display: grid; place-items: center;
      background:
        radial-gradient(900px 600px at 20% 10%, rgba(56,189,248,0.10), transparent 60%),
        radial-gradient(900px 600px at 80% 15%, rgba(34,197,94,0.07), transparent 55%),
        #070A12;
      color: #E6EDF3;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      padding: 1.25rem;
    ">
      <div style="
        width: min(760px, calc(100% - 1rem));
        border-radius: 22px;
        border: 1px solid rgba(148,163,184,0.16);
        background: rgba(255,255,255,0.035);
        box-shadow: 0 18px 60px rgba(0,0,0,0.55);
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position:absolute; inset:-2px;
          background:
            radial-gradient(560px 260px at 25% 20%, rgba(56,189,248,0.16), transparent 60%),
            radial-gradient(560px 260px at 75% 35%, rgba(34,197,94,0.10), transparent 60%);
          filter: blur(14px);
          opacity: 0.9;
          pointer-events:none;
        "></div>

        <div style="position:relative; padding: 1.6rem;">
          <div style="display:flex; align-items:flex-start; justify-content: space-between; gap: 1rem;">
            <div style="display:flex; gap: 0.95rem; align-items:flex-start;">
              ${showIcon ? `
                <div aria-hidden="true" style="
                  width: 48px; height: 48px;
                  display:grid; place-items:center;
                  border-radius: 16px;
                  background: ${s.bg};
                  border: 1px solid ${s.br};
                  font-size: 1.15rem;
                ">${s.icon}</div>
              ` : ""}

              <div>
                <div style="opacity:0.82; font-weight:900; letter-spacing:0.2px;">${siteName}</div>
                <h1 style="font-size: 1.7rem; letter-spacing:-0.5px; margin: 0.25rem 0 0;">${title}</h1>
                <div style="
                  margin-top: 0.55rem;
                  display:inline-flex;
                  padding: 0.2rem 0.65rem;
                  border-radius: 999px;
                  border: 1px solid ${s.br};
                  background: ${s.bg};
                  color: rgba(230,237,243,0.92);
                  font-size: 0.86rem;
                  font-weight: 850;
                ">${s.label}</div>
              </div>
            </div>

            <div style="display:flex; gap: 0.65rem; flex-wrap:wrap; justify-content:flex-end;">
              <a href="${esc(ssUrl(primary.href || statusPath))}" style="
                display:inline-flex; align-items:center; justify-content:center;
                padding: 0.72rem 0.95rem;
                border-radius: 12px;
                border: 1px solid rgba(56,189,248,0.28);
                background: rgba(56,189,248,0.10);
                color: rgba(230,237,243,0.92);
                text-decoration:none;
                font-weight: 900;
                white-space: nowrap;
              ">${esc(primary.label || "View Status")} →</a>

              <a href="${esc(ssUrl(secondary.href || "/index.html"))}" style="
                display:inline-flex; align-items:center; justify-content:center;
                padding: 0.72rem 0.95rem;
                border-radius: 12px;
                border: 1px solid rgba(148,163,184,0.16);
                background: rgba(255,255,255,0.04);
                color: rgba(230,237,243,0.92);
                text-decoration:none;
                font-weight: 850;
                white-space: nowrap;
              ">${esc(secondary.label || "Back to Home")}</a>
            </div>
          </div>

          <p style="margin-top: 1.05rem; color: rgba(230,237,243,0.86); font-size: 1.02rem;">${message}</p>
          ${sub ? `<p style="margin-top: 0.35rem; color: rgba(230,237,243,0.62); font-size: 0.95rem;">${sub}</p>` : ""}

          <div style="margin-top: 1.15rem; border-top: 1px solid rgba(148,163,184,0.10); padding-top: 1rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap;">
              <div style="font-weight:900; letter-spacing:0.2px;">Deployment progress</div>
              <div style="color: rgba(230,237,243,0.62); font-size:0.92rem;">
                <span id="ss-last-updated">Last updated: just now</span>
                <span style="opacity:0.55;"> · </span>
                <span id="ss-eta">ETA: calculating…</span>
              </div>
            </div>

            <div style="
              margin-top: 0.65rem;
              height: 12px;
              border-radius: 999px;
              border: 1px solid rgba(148,163,184,0.14);
              background: rgba(255,255,255,0.03);
              overflow:hidden;
            ">
              <div id="ss-bar" style="
                height: 100%;
                width: ${progress}%;
                border-radius: 999px;
                background: linear-gradient(90deg, rgba(56,189,248,0.85), rgba(34,197,94,0.65));
                box-shadow: 0 0 30px rgba(56,189,248,0.18);
                transition: width 600ms ease;
              "></div>
            </div>

            <div style="margin-top: 0.85rem; display:flex; gap:0.65rem; flex-wrap:wrap;">
              <span style="
                display:inline-flex; align-items:center; gap:0.35rem;
                padding: 0.22rem 0.55rem; border-radius:999px;
                border:1px solid ${s.br}; background:${s.bg}; font-weight:850;
              ">Progress: <strong id="ss-pct" style="margin-left:0.3rem;">${progress}%</strong></span>
              ${startIso ? `<span style="
                display:inline-flex; align-items:center; gap:0.35rem;
                padding: 0.22rem 0.55rem; border-radius:999px;
                border:1px solid rgba(148,163,184,0.16); background:rgba(255,255,255,0.03);
                font-weight:750; color: rgba(230,237,243,0.82);
              ">Started: <strong style="margin-left:0.3rem;">${esc(new Date(startIso).toLocaleString())}</strong></span>` : ""}
            </div>

            <div style="
              margin-top: 0.9rem;
              padding: 0.85rem 0.95rem;
              border-radius: 16px;
              border: 1px solid rgba(148,163,184,0.12);
              background: rgba(255,255,255,0.02);
            ">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:0.8rem;">
                <div style="font-weight:850;">Live update</div>
                <div style="color: rgba(230,237,243,0.62); font-size:0.92rem;">Rolling deployment · Health checks</div>
              </div>
              <p id="ss-rot" style="margin-top:0.5rem; color: rgba(230,237,243,0.82);">…</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const rot = document.getElementById("ss-rot");
  const etaEl = document.getElementById("ss-eta");
  const lastEl = document.getElementById("ss-last-updated");
  const pctEl = document.getElementById("ss-pct");
  const barEl = document.getElementById("ss-bar");

  let idx = 0;
  let lastTick = Date.now();

  function fmtRemaining(ms) {
    if (ms <= 0) return "Soon";
    const min = Math.round(ms / 60000);
    if (min <= 1) return "< 1 min";
    return `${min} min`;
  }

  function updateEta() {
    if (!etaIso) { etaEl.textContent = "ETA: soon"; return; }
    const eta = new Date(etaIso).getTime();
    const now = Date.now();
    etaEl.textContent = "ETA: " + fmtRemaining(eta - now);
  }

  function updateLastUpdated() {
    const sec = Math.floor((Date.now() - lastTick) / 1000);
    if (sec < 5) lastEl.textContent = "Last updated: just now";
    else if (sec < 60) lastEl.textContent = `Last updated: ${sec}s ago`;
    else lastEl.textContent = `Last updated: ${Math.floor(sec / 60)}m ago`;
  }

  function rotateLine() {
    rot.textContent = updates[idx % updates.length];
    idx += 1;
  }

  function nudgeProgress() {
    let p = Number(String(pctEl.textContent).replace("%", "")) || progress;
    if (p >= 99) return;
    const bump = Math.random() < 0.6 ? 0 : 1;
    p = Math.min(99, p + bump);
    pctEl.textContent = p + "%";
    barEl.style.width = p + "%";
  }

  rotateLine();
  updateEta();
  updateLastUpdated();

  setInterval(() => { rotateLine(); lastTick = Date.now(); }, 4000);
  setInterval(() => { updateEta(); updateLastUpdated(); }, 1000);
  setInterval(() => { nudgeProgress(); }, 6000);
})();
