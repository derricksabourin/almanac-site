// Review page for The Almanac's daily Shorts.
//
// The pipeline texts each reviewer a link like /review?i=12&k=<key>. This page shows the video
// and script from GitHub issue #12 and turns the buttons into issue comments, which the repo's
// approve.yml workflow acts on: /draft <notes> (preview a script change, nothing rendered),
// /render (make the cut from the draft), /revise <notes> (render straight away), /approve, /reject.
// The issue's comments show on the page as a chat thread.
// The key is random per Short and stored in the issue, so only people with the text can act.
//
// Dashboard: /review?d=<DASHBOARD_KEY> lists every Short waiting for review, with its link.
//
// Vercel environment variables:
//   DASHBOARD_KEY any long phrase; the dashboard link only works with it
//   GITHUB_TOKEN  a token that can read and comment on issues in the repo
//   GITHUB_REPO   owner/repo (default catrobert/get-rich-project)

const REPO = process.env.GITHUB_REPO || "catrobert/get-rich-project";

const CSS = `:root{--bg:#FBFAF6;--ink:#2b2b2b;--brown:#965C2A;--blue:#7AA8D0;--muted:#6b6b6b;--card:#fff;--line:#e4e0d6}
@media (prefers-color-scheme:dark){:root{--bg:#161512;--ink:#ece8df;--card:#1f1e1a;--line:#34312a;--muted:#a8a296}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:520px;margin:0 auto;padding:16px 16px 48px}
.top{font:600 13px/1 Georgia,serif;letter-spacing:.12em;color:var(--brown);text-transform:uppercase}
h1{font:700 22px/1.25 Georgia,serif;margin:6px 0 2px}.sub{color:var(--muted);font-size:14px;margin:0 0 14px}
video{width:100%;max-height:70vh;background:#000;border-radius:12px;display:block}
.status{margin:14px 0;padding:12px 14px;border-radius:10px;background:var(--card);border:1px solid var(--line)}
.status.busy{border-color:var(--blue)}.status.done{border-color:var(--brown)}
.btns{display:grid;gap:10px;margin:16px 0}
button{font:600 17px/1 -apple-system,sans-serif;padding:16px;border-radius:12px;border:0;width:100%;cursor:pointer}
.ok{background:#2f7d4f;color:#fff}.no{background:transparent;color:#b3412f;border:1px solid #b3412f}
.rev{background:var(--blue);color:#10263a}
textarea{width:100%;min-height:84px;font-size:16px;line-height:1.4;font-family:inherit;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
details{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:10px 0}
summary{font-weight:600;cursor:pointer}ol{padding-left:20px;margin:8px 0}li{margin:4px 0}
a{color:var(--brown)}.small{font-size:13px;color:var(--muted)}
.list a.item{display:block;text-decoration:none;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin:10px 0}
.thread{margin:16px 0}.msg{padding:10px 14px;border-radius:14px;margin:8px 0;max-width:92%;font-size:15px;overflow-wrap:anywhere}
.msg.me{background:var(--blue);color:#10263a;margin-left:auto;border-bottom-right-radius:4px}
.msg.bot{background:var(--card);border:1px solid var(--line);border-bottom-left-radius:4px}
.msg ul{padding-left:18px;margin:6px 0}.msg del{opacity:.6}.who{font-size:11px;color:var(--muted);margin-bottom:2px}
.list .t{font:700 17px/1.3 Georgia,serif}
.tabs{display:flex;gap:6px;margin:12px 0 6px}.tab{padding:8px 16px;border-radius:99px;border:1px solid var(--line);text-decoration:none;color:var(--ink);font-weight:600;font-size:15px}.tab.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin:10px 0}
.bar{margin:10px 0}.bl{font-size:14px;margin-bottom:4px}.bt{display:flex;align-items:center;gap:8px}.bf{height:16px;min-width:2px;background:var(--brown);border-radius:4px}.bt span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.pie{display:flex;gap:14px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}.pie:last-child{border-bottom:0}.pie svg{flex:none}
.legend{display:flex;gap:14px;font-size:13px;color:var(--muted);margin:6px 0}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.learn{padding-left:20px;margin:0}.learn li{margin:0 0 12px}.list div.item{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:8px 0}.tag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:99px;background:var(--line);margin-top:6px}`;

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "almanac-review",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Bold, strikethrough, links and "- " bullets are enough for the bot's comments.
function md(text) {
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/_(.+?)_/g, "<i>$1</i>")
    .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">link</a>');
  const out = []; let list = false;
  for (const line of String(text).split("\n")) {
    if (/^\s*[-*] /.test(line)) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(line.replace(/^\s*[-*] /, ""))}</li>`); continue; }
    if (list) { out.push("</ul>"); list = false; }
    out.push(line.trim() ? inline(line) + "<br>" : "<br>");
  }
  if (list) out.push("</ul>");
  return out.join("").replace(/(<br>){3,}/g, "<br><br>");
}

// A command comment shown as the reviewer's own words.
function said(t) {
  const m = t.match(/^\/(\w+)\s*([\s\S]*)/);
  const rest = (m && m[2] || "").replace(/_Sent from the review page\._/, "").trim();
  return { approve: "Approved.", reject: "Rejected.", render: "Make this cut.", revise: rest, draft: rest }[m && m[1]] ?? t;
}

function thread(comments) {
  const msgs = comments.filter((c) => !/^\s*$/.test(c.body)).map((c) => {
    const bot = c.user && c.user.type === "Bot";
    const text = bot ? md(c.body) : esc(said(c.body)).replace(/\n/g, "<br>");
    return `<div class="msg ${bot ? "bot" : "me"}"><div class="who">${bot ? "Studio" : esc(c.user ? c.user.login : "")}</div>${text}</div>`;
  });
  return msgs.length ? `<div class="thread">${msgs.join("")}</div>` : "";
}

function section(body, name) {
  const m = body.match(new RegExp(`### ${name}\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`));
  return m ? m[1].trim() : "";
}

function status(issue, comments) {
  const texts = comments.map((c) => c.body);
  const last = (re) => texts.filter((t) => re.test(t)).pop();
  if (issue.state === "closed") {
    const posted = last(/^Posted:/);
    if (posted) {
      const links = [...posted.matchAll(/https:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/g)].map((m) => m[0]);
      return { kind: "done", text: "Approved and posted to YouTube, Instagram and Facebook.", links };
    }
    return { kind: "done", text: last(/Rejected/) ? "Rejected and deleted." : "This review is closed." };
  }
  // Newest bot update after the newest command decides whether something is in progress.
  for (let n = texts.length - 1; n >= 0; n--) {
    const t = texts[n];
    if (/^New cut is up/.test(t)) return { kind: "ready", text: "A new cut is ready (above)." };
    if (/^Draft ready/.test(t)) {
      const cost = (t.match(/\*\*Make this cut:\*\*\s*([^\n]+)/) || [])[1] || "";
      return { kind: "ready", draft: true, cost, text: "" };
    }
    if (/^\/draft/.test(t)) return { kind: "busy", text: "Drafting the change. Refresh in about a minute." };
    if (/^\/render/.test(t)) return { kind: "busy", text: "Making the cut. Refresh in a few minutes." };
    if (/^On it/.test(t)) return { kind: "busy", text: "Making the new cut. Refresh in a few minutes." };
    if (/^\/approve/.test(t)) return { kind: "busy", text: "Approved. Posting now; refresh in a couple of minutes." };
    if (/^\/reject/.test(t)) return { kind: "busy", text: "Rejecting…" };
    if (/^\/revise/.test(t)) return { kind: "busy", text: "Notes sent. The new cut takes a few minutes." };
  }
  return { kind: "ready", text: "" };
}

function page({ title, show, date, video, thumb, watch, script, notes, caption, st, i, k, flash, thread }) {
  const lines = script.split("\n").filter(Boolean).map((l) => `<li>${esc(l.replace(/^\d+\.\s*/, ""))}</li>`).join("");
  const open = st.kind === "ready";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Review: ${esc(title)}</title>
<style>${CSS}</style></head><body><main>
<div class="top">The Almanac · Review</div>
<h1>${esc(title)}</h1><p class="sub">${esc(show)}${date ? " · " + esc(date) : ""}</p>
${video ? `<video src="${esc(video)}" controls playsinline preload="metadata"></video>`
         : `<p><a href="${esc(watch)}">Watch on GitHub</a> (needs your GitHub login)</p>`}
${thumb ? `<details><summary>Thumbnail</summary><img src="${esc(thumb)}" alt="Thumbnail" style="width:60%;display:block;margin:10px auto 4px;border-radius:10px"><p class="small" style="text-align:center">To change the words, ask below (e.g. "thumbnail text: BROKE AT 40").</p></details>` : ""}
${flash ? `<div class="status busy">${esc(flash)}</div>` : ""}
${st.text ? `<div class="status ${st.kind}">${esc(st.text)}${(st.links || []).map((l) => `<br><a href="${esc(l)}">${esc(l)}</a>`).join("")}</div>` : ""}
${thread}
${open ? `<form method="post" class="btns">
  <input type="hidden" name="i" value="${esc(i)}"><input type="hidden" name="k" value="${esc(k)}">
  ${st.draft ? `<button class="ok" name="action" value="render">Make this cut${(st.cost.match(/\$[\d.]+/) || [])[0] ? ` · about ${esc(st.cost.match(/\$[\d.]+/)[0])}` : ""}</button>` : ""}
  <textarea name="notes" placeholder="${st.draft ? "Anything else to change in this draft?" : "What should change? e.g. explain why they were shot, say the year sooner"}"></textarea>
  <button class="rev" name="action" value="draft">${st.draft ? "Update the draft" : "Show me the change"}</button>
  <p class="small" style="margin:0">You'll see the new script and price first. Nothing is rendered until you tap Make this cut.</p>
  ${st.draft ? "" : `<button class="ok" name="action" value="approve">Approve and post</button>`}
  <details style="margin:0"><summary class="small">More</summary>
    ${st.draft ? `<button class="ok" style="margin-top:10px" name="action" value="approve">Ignore the draft: approve the current cut</button>` : ""}
    <button class="rev" style="margin-top:10px" name="action" value="revise">Skip the preview: render my notes now</button>
    <button class="no" style="margin-top:10px" name="action" value="reject" onclick="return confirm('Throw this Short away?')">Reject</button>
  </details>
</form>` : ""}
<details open><summary>Script</summary><ol>${lines}</ol></details>
${notes && notes !== "- none" ? `<details><summary>Fact-check notes</summary><p class="small">${esc(notes).replace(/\n/g, "<br>")}</p></details>` : ""}
${caption ? `<details><summary>Caption</summary><p class="small">${esc(caption).replace(/\n/g, "<br>")}</p></details>` : ""}
<p class="small">Changes only re-make the shots they touch. <a href="https://github.com/${REPO}/issues/${esc(i)}">Open in GitHub</a></p>
</main></body></html>`;
}


async function analytics() {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/state/analytics.json`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "almanac-review" },
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

const PLAT = [["YouTube", "#b3412f"], ["Instagram", "#965C2A"], ["Facebook", "#4f86b8"]];

function tabs(d, tab) {
  const t = (id, label) => `<a href="/review?d=${encodeURIComponent(d)}${id ? "&tab=" + id : ""}" class="tab${tab === id ? " on" : ""}">${label}</a>`;
  return `<nav class="tabs">${t("", "Review")}${t("stats", "Analytics")}</nav>`;
}

// One pie per Short: its views split by platform.
function pie(parts) {
  const total = parts.reduce((s, p) => s + p.v, 0);
  if (!total) return `<svg viewBox="0 0 80 80" width="80" height="80"><circle cx="40" cy="40" r="34" fill="var(--line)"/></svg>`;
  let a0 = -Math.PI / 2, paths = "";
  for (const p of parts) {
    if (!p.v) continue;
    const a1 = a0 + (p.v / total) * Math.PI * 2;
    if (p.v === total) { paths += `<circle cx="40" cy="40" r="34" fill="${p.c}"/>`; break; }
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = 40 + 34 * Math.cos(a0), y0 = 40 + 34 * Math.sin(a0), x1 = 40 + 34 * Math.cos(a1), y1 = 40 + 34 * Math.sin(a1);
    paths += `<path d="M40 40 L${x0.toFixed(2)} ${y0.toFixed(2)} A34 34 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${p.c}"/>`;
    a0 = a1;
  }
  return `<svg viewBox="0 0 80 80" width="80" height="80" role="img" aria-label="Views by platform">${paths}</svg>`;
}

async function statsPage(res, d) {
  const a = await analytics();
  const rows = (a && a.rows) || [];
  const shorts = new Map();
  for (const r of rows) {
    const key = r.short || r.video;
    const s = shorts.get(key) || { name: key, page: r.page, posted: r.posted, by: {} };
    s.by[r.platform] = (s.by[r.platform] || 0) + (Number(r.views) || 0);
    shorts.set(key, s);
  }
  const list = [...shorts.values()].map((s) => ({ ...s, total: Object.values(s.by).reduce((x, y) => x + y, 0) }))
    .sort((x, y) => y.total - x.total);
  const max = Math.max(1, ...list.map((s) => s.total));
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const legend = `<div class="legend">${PLAT.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}</div>`;
  const bars = list.map((s) => `<div class="bar"><div class="bl">${esc(s.name)}</div>
      <div class="bt"><div class="bf" style="width:${((s.total / max) * 100).toFixed(1)}%"></div><span>${fmt(s.total)}</span></div></div>`).join("");
  const pies = list.map((s) => {
    const parts = PLAT.map(([n, c]) => ({ n, c, v: s.by[n] || 0 }));
    const top = parts.slice().sort((x, y) => y.v - x.v)[0];
    return `<div class="pie">${pie(parts)}<div><div class="t">${esc(s.name)}</div>
      <div class="small">${esc(s.page)} · ${esc(s.posted)}</div>
      <div class="small">${parts.map((p) => `${p.n}: ${fmt(p.v)}`).join(" · ")}</div>
      ${top.v ? `<div class="small">Most views: <b>${top.n}</b></div>` : ""}</div></div>`;
  }).join("");
  const grand = list.reduce((x, s) => x + s.total, 0);
  const perPlat = PLAT.map(([n]) => [n, list.reduce((x, s) => x + (s.by[n] || 0), 0)]);
  const learn = ((a && a.learnings) || []).map((l) => `<li>${esc(l.point)}<div class="small">${esc(l.evidence)}</div></li>`).join("");
  const notes = ((a && a.notes) || []).map((n) => `<p class="small" style="color:#b3412f">${esc(n)}</p>`).join("");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Almanac analytics</title><style>${CSS}</style></head><body><main class="list">
<div class="top">The Almanac · Review</div>${tabs(d, "stats")}
<h1>Analytics</h1><p class="sub">${a ? "Updated " + esc(new Date(a.updated).toLocaleString("en-CA", { timeZone: "America/Vancouver", dateStyle: "medium", timeStyle: "short" })) + " · refreshes every 2 hours" : "No numbers yet."}</p>
${notes}
<div class="card"><div class="small">Total views, all platforms</div>
<div style="font:700 40px/1.1 Georgia,serif;font-variant-numeric:tabular-nums;margin:4px 0">${fmt(grand)}</div>
<div class="small">${perPlat.map(([n, v]) => `${n} ${fmt(v)}`).join(" · ")} · ${list.length} Shorts</div></div>
<h2 class="top" style="margin-top:22px">Most views overall</h2>
<div class="card">${bars || '<p class="small">No views yet.</p>'}</div>
<h2 class="top" style="margin-top:22px">Views by platform, per Short</h2>
${legend}<div class="card">${pies || '<p class="small">No views yet.</p>'}</div>
<h2 class="top" style="margin-top:22px">How to improve</h2>
<div class="card"><ol class="learn">${learn || "<li>Not enough data yet.</li>"}</ol></div>
</main></body></html>`);
}

async function dashboard(res, d) {
  const open = await gh(`/issues?labels=approval&state=open&per_page=30`);
  const done = await gh(`/issues?labels=approval&state=closed&per_page=6`);
  const item = (it, live) => {
    const key = ((it.body || "").match(/<!-- key:([a-f0-9]+) -->/) || [])[1];
    const head = ((it.body || "").match(/^## (.+?) — (\S+)/m) || []);
    const title = it.title.replace(/^(\[TEST[^\]]*\]\s*)?Approve:\s*/, "").replace(/^.*? — /, "");
    const href = key ? `/review?i=${it.number}&k=${key}` : it.html_url;
    const test = /^\[TEST/.test(it.title) ? " · test" : "";
    const tag = live ? "Waiting for you" : (it.state_reason === "completed" ? "Posted" : "Rejected");
    return `<a class="item" href="${esc(href)}"><div class="t">${esc(title)}</div>
      <div class="small">${esc(head[1] || "")}${head[2] ? " · " + esc(head[2]) : ""}${test}</div><span class="tag">${tag}</span></a>`;
  };
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Almanac reviews</title><style>${CSS}</style></head><body><main class="list">
<div class="top">The Almanac · Review</div>${tabs(d, "")}<h1>${open.length ? `${open.length} waiting` : "All caught up"}</h1>
<p class="sub">A new Short arrives early each morning.</p>
${open.map((it) => item(it, true)).join("") || `<p class="small">Nothing to review right now.</p>`}
${done.length ? `<h2 class="top" style="margin-top:28px">Recent</h2>${done.map((it) => item(it, false)).join("")}` : ""}
</main></body></html>`);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const q = req.method === "POST" ? { ...req.query, ...(req.body || {}) } : req.query;
  const i = String(q.i || "").replace(/\D/g, "");
  const k = String(q.k || "");
  try {
    if (q.d !== undefined) {
      // Forgiving match: ignore spaces, plus signs and capitals, which phones and copy-paste mangle.
      const norm = (x) => String(x || "").replace(/[\s+]/g, "").toLowerCase();
      if (!norm(process.env.DASHBOARD_KEY) || norm(q.d) !== norm(process.env.DASHBOARD_KEY)) {
        res.status(403).send("This dashboard link isn't valid.");
        return;
      }
      return q.tab === "stats" ? await statsPage(res, String(q.d)) : await dashboard(res, String(q.d));
    }
    if (!i || !k) throw new Error("bad link");
    const issue = await gh(`/issues/${i}`);
    const body = issue.body || "";
    const key = (body.match(/<!-- key:([a-f0-9]+) -->/) || [])[1];
    if (!key || key !== k) {
      res.status(403).send("This review link isn't valid. Use the latest text, or open the issue in GitHub.");
      return;
    }

    // ?v=1 plays the video straight from the GitHub release when it wasn't copied to
    // public storage: a short-lived download link, so no GitHub login is needed.
    if (q.v !== undefined) {
      const tag = (body.match(/tag:(short-[a-z_]+-[0-9-]+)/) || [])[1];
      if (!tag) { res.status(404).send("No video for this Short."); return; }
      const rel = await gh(`/releases/tags/${tag}`);
      const asset = (rel.assets || []).find((a) => a.name === "short.mp4");
      if (!asset) { res.status(404).send("No video for this Short."); return; }
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`, {
        redirect: "manual",
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/octet-stream", "User-Agent": "almanac-review" },
      });
      const loc = r.headers.get("location");
      if (!loc) { res.status(502).send("Couldn't get the video from GitHub."); return; }
      res.setHeader("Cache-Control", "no-store");
      res.writeHead(302, { Location: loc });
      res.end();
      return;
    }

    if (req.method === "POST") {
      const action = String(q.action || "");
      const notes = String(q.notes || "").trim();
      let comment = null;
      if (action === "approve") comment = "/approve\n\n_Sent from the review page._";
      if (action === "reject") comment = "/reject\n\n_Sent from the review page._";
      if (action === "revise" && notes) comment = `/revise ${notes}`;
      if (action === "draft" && notes) comment = `/draft ${notes}`;
      if (action === "render") comment = "/render";
      if (comment && issue.state === "open") await gh(`/issues/${i}/comments`, { method: "POST", body: JSON.stringify({ body: comment }) });
      const flash = (action === "revise" || action === "draft") && !notes ? "Type your notes first, then send." : "";
      res.writeHead(303, { Location: `/review?i=${i}&k=${k}${flash ? "&e=notes" : ""}` });
      res.end();
      return;
    }

    const comments = await gh(`/issues/${i}/comments?per_page=100`);
    const head = (body.match(/^## (.+?) — (\S+)/m) || []);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(page({
      title: issue.title.replace(/^(\[TEST[^\]]*\]\s*)?Approve:\s*/, "").replace(/^.*? — /, ""),
      show: head[1] || "", date: head[2] || "",
      video: (body.match(/<!-- video:(\S+) -->/) || [])[1] || `/review?i=${i}&k=${k}&v=1`,
      thumb: (body.match(/<!-- thumb:(\S+) -->/) || [])[1],
      watch: (body.match(/Watch:\*\*\s*(\S+)/) || [])[1] || issue.html_url,
      script: section(body, "Script"), notes: section(body, "Minor fact-check notes"), caption: section(body, "Caption"),
      st: status(issue, comments), i, k, thread: thread(comments),
      flash: q.e === "notes" ? "Type your notes first, then send." : "",
    }));
  } catch (e) {
    res.status(500).send(`Couldn't load this review (${esc(e.message)}). Open the issue in GitHub instead.`);
  }
};
