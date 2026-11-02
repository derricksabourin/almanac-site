// Connects a page's TikTok account so the studio can read its views (TikTok Login Kit +
// Display API, scopes user.info.basic,user.info.stats,video.list).
//   /tiktok/login?page=grey_almanac&d=<dashboard key>  → TikTok's sign-in screen
//   /tiktok/callback                                   → shows the refresh token to save
//                                                          as the GitHub secret <PAGE>_TIKTOK_REFRESH_TOKEN
// Needs TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Vercel's environment variables.
const crypto = require("crypto");

const PAGES = { grey_almanac: "Grey Almanac", fortune_almanac: "Fortune Almanac" };
const REDIRECT = "https://almanac-site-ten.vercel.app/tiktok/callback";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = (x) => String(x || "").replace(/[\s+]/g, "").toLowerCase();
const sign = (page) => crypto.createHmac("sha256", norm(process.env.DASHBOARD_KEY) + "|tiktok").update(page).digest("hex").slice(0, 24);

function html(res, code, body) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(code).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Connect TikTok</title><style>
:root{--bg:#FBFAF6;--ink:#2b2b2b;--brown:#965C2A;--line:#e4e0d6;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#1b1a17;--ink:#ece8df;--brown:#d39a63;--line:#3a3731;--card:#24221e}}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 -apple-system,system-ui,sans-serif}main{max-width:560px;margin:0 auto;padding:28px 16px}
h1{color:var(--brown);font-size:1.4rem}code,textarea{font:13px ui-monospace,monospace}textarea{width:100%;height:90px;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;box-sizing:border-box}
a.b,button{display:block;text-align:center;background:var(--brown);color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:600;border:0;width:100%;margin:10px 0}</style></head>
<body><main>${body}</main></body></html>`);
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const path = (req.url || "").split("?")[0];
  const key = (process.env.TIKTOK_CLIENT_KEY || "").trim(), secret = (process.env.TIKTOK_CLIENT_SECRET || "").trim();   // pasted values often carry a stray newline
  if (!key || !secret) return html(res, 503, "<h1>Not set up yet</h1><p>TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET aren't in Vercel's environment variables.</p>");

  if (!q.cb && !path.endsWith("/callback")) {
    if (!norm(process.env.DASHBOARD_KEY) || norm(q.d) !== norm(process.env.DASHBOARD_KEY)) return html(res, 403, "<p>This link isn't valid.</p>");
    if (!PAGES[q.page]) {
      const links = Object.entries(PAGES).map(([p, n]) => `<a class="b" href="/tiktok/login?page=${p}&d=${encodeURIComponent(q.d)}">Connect ${n}</a>`).join("");
      return html(res, 200, `<h1>Connect TikTok</h1><p>Log into the matching TikTok account when TikTok asks.</p>${links}`);
    }
    const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
    u.searchParams.set("client_key", key);
    u.searchParams.set("scope", "user.info.basic,user.info.stats,video.list");
    u.searchParams.set("response_type", "code");
    u.searchParams.set("redirect_uri", REDIRECT);
    u.searchParams.set("state", `${q.page}.${sign(q.page)}`);
    res.writeHead(302, { Location: u.toString() });
    return res.end();
  }

  const [page, sig] = String(q.state || "").split(".");
  if (!PAGES[page] || sig !== sign(page)) return html(res, 403, "<p>This sign-in link expired or isn't valid. Start again from the Connect page.</p>");
  if (q.error) return html(res, 400, `<h1>TikTok said no</h1><p>${esc(q.error_description || q.error)}</p>`);
  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: key, client_secret: secret, code: String(q.code || ""), grant_type: "authorization_code", redirect_uri: REDIRECT }),
  });
  const t = await r.json().catch(() => ({}));
  if (!t.refresh_token) return html(res, 502, `<h1>Couldn't connect</h1><p>${esc(t.error_description || t.error || "No token came back from TikTok.")}</p>`);
  const name = `${page.toUpperCase()}_TIKTOK_REFRESH_TOKEN`;
  return html(res, 200, `<h1>${esc(PAGES[page])} is connected</h1>
<p>Last step: save this as a GitHub secret named <code>${name}</code>.</p>
<textarea readonly onclick="this.select()">${esc(t.refresh_token)}</textarea>
<button onclick="navigator.clipboard.writeText(document.querySelector('textarea').value);this.textContent='Copied'">Copy token</button>
<a class="b" href="https://github.com/catrobert/get-rich-project/settings/secrets/actions/new" target="_blank">Open GitHub secrets</a>
<p style="font-size:.85rem">Name: <code>${name}</code> · Secret: paste the token. After that the studio keeps it fresh by itself. Don't share this token anywhere else.</p>`);
};
