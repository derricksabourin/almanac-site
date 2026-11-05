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

const CSS = `.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:12px}.stat .sv{font:700 24px/1.2 Georgia,serif;font-variant-numeric:tabular-nums}
.ft{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}.ft th,.ft td{text-align:left;padding:6px 4px;border-bottom:1px solid var(--line)}.ft th{color:var(--muted);font-weight:600}.ft .n{text-align:right}.ft tr.tot td{font-weight:700}
:root{--bg:#FBFAF6;--ink:#2b2b2b;--brown:#965C2A;--blue:#7AA8D0;--muted:#6b6b6b;--card:#fff;--line:#e4e0d6}
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
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 6px}.tab{padding:8px 16px;border-radius:99px;border:1px solid var(--line);text-decoration:none;color:var(--ink);font-weight:600;font-size:15px}.tab.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin:10px 0}
.bar{margin:10px 0}.bl{font-size:14px;margin-bottom:4px}.bt{display:flex;align-items:center;gap:8px}.bf{height:16px;min-width:2px;background:var(--brown);border-radius:4px}.bt span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.pie{display:flex;gap:14px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}.pie:last-child{border-bottom:0}.pie svg{flex:none}
.legend{display:flex;gap:14px;font-size:13px;color:var(--muted);margin:6px 0}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.ms{padding:8px 0;border-bottom:1px solid var(--line)}.ms:last-child{border-bottom:0}.ms .bt{margin-top:6px}
.pill{display:inline-block;font-size:12px;padding:2px 8px;border-radius:99px;background:var(--line);margin:4px 0}
.t{width:100%;border-collapse:collapse;font-size:14px}.t td,.t th{padding:6px 4px;border-bottom:1px solid var(--line);text-align:left}.t .n{text-align:right;font-variant-numeric:tabular-nums}
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
  return r.status === 204 ? {} : r.json();
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

function page({ title, show, date, video, thumb, watch, script, notes, caption, pinned, st, i, k, flash, thread }) {
  const lines = script.split("\n").filter(Boolean).map((l) => `<li>${esc(l.replace(/^\d+\.\s*/, ""))}</li>`).join("");
  const open = st.kind === "ready";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Review: ${esc(title)}</title>
<style>${CSS}</style></head><body><main>
<div class="top">The Almanac · Review</div>
<h1>${esc(title)}</h1><p class="sub">${esc(show)}${date ? " · " + esc(date) : ""}</p>
${video ? `<video src="${esc(video)}" controls playsinline preload="metadata"></video>
<div style="display:flex;gap:8px;margin:10px 0 4px"><a class="rev save" data-src="${esc(/^https:\/\//.test(video || "") ? video : "")}" data-name="short.mp4" style="flex:2;text-align:center;text-decoration:none;font:600 17px/1 -apple-system,sans-serif;padding:16px 8px;border-radius:12px" href="/review?i=${esc(i)}&k=${esc(k)}&v=1" download="short.mp4">Save video for TikTok</a>
<a class="rev save" data-src="${esc(thumb || "")}" data-name="cover.jpg" style="flex:1;text-align:center;text-decoration:none;font:600 17px/1 -apple-system,sans-serif;padding:16px 8px;border-radius:12px" href="/review?i=${esc(i)}&k=${esc(k)}&t=1" download="cover.jpg">Save cover</a></div>
<p class="small" style="text-align:center;margin:0 0 8px">Opens your phone's share menu: tap Save Video / Save Image to put it in Photos.</p>
<script>
// Phones save plain downloads to Files, which TikTok can't see. Sharing the file instead
// offers "Save Video" / "Save Image" straight to Photos. Falls back to a normal download.
document.querySelectorAll("a.save").forEach((a) => a.addEventListener("click", async (e) => {
  const src = a.dataset.src;
  if (!src || !navigator.canShare) return;
  e.preventDefault();
  const label = a.textContent;
  try {
    a.textContent = "Loading…";
    const blob = await (await fetch(src)).blob();
    const file = new File([blob], a.dataset.name, { type: blob.type || (a.dataset.name.endsWith(".mp4") ? "video/mp4" : "image/jpeg") });
    a.textContent = label;
    if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file] });
    else location.href = a.href;
  } catch (err) {
    a.textContent = label;
    if (err && err.name !== "AbortError") location.href = a.href;
  }
}));
</script>`
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
${caption ? `<details><summary>Caption</summary><p class="small">${esc(caption).replace(/\n/g, "<br>")}</p><button type="button" class="rev" onclick="navigator.clipboard.writeText(this.dataset.t);this.textContent='Copied'" data-t="${esc(caption)}">Copy caption</button></details>` : ""}
${pinned && !/^No (book|pinned comment)/.test(pinned) ? `<details open><summary>Pinned comment</summary><p class="small">${esc(pinned)}</p><p class="small">Pin it under the post on YouTube, TikTok, Instagram and Facebook.</p><button type="button" class="rev" onclick="navigator.clipboard.writeText(this.dataset.t);this.textContent='Copied'" data-t="${esc(pinned)}">Copy pinned comment</button>
<button type="button" class="rev" style="margin-top:8px" onclick="navigator.clipboard.writeText(this.dataset.t);this.textContent='Copied'" data-t="${esc(pinned.replace(/\s*Link in bio\.?\s*$/, ""))}">Copy for TikTok (no bio link yet)</button></details>` : ""}
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

const PLAT = [["YouTube", "#d0453a"], ["Instagram", "#c2408a"], ["TikTok", "#1fa596"], ["Threads", "#8a8a8a"], ["Facebook", "#3d73d6"]];

function tabs(d, tab) {
  const t = (id, label) => `<a href="/review?d=${encodeURIComponent(d)}${id ? "&tab=" + id : ""}" class="tab${tab === id ? " on" : ""}">${label}</a>`;
  return `<nav class="tabs">${t("", "Review")}${t("stats", "Analytics")}${t("comments", "Comments")}${t("plan", "Plan")}${t("accounts", "Accounts")}</nav>`;
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

// GitHub sometimes skips scheduled runs. If the numbers are over 2.5 hours old when
// someone opens the dashboard, ask GitHub to refresh them now (best effort).
async function refreshIfStale(a) {
  if (!a || !a.updated || Date.now() - new Date(a.updated) < 2.5 * 3600e3) return false;
  try {
    const runs = await gh(`/actions/workflows/analytics.yml/runs?per_page=1`);
    const last = (runs.workflow_runs || [])[0];
    if (last && (last.status !== "completed" || Date.now() - new Date(last.created_at) < 15 * 60e3)) return true;
    await gh(`/actions/workflows/analytics.yml/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main" }) });
    return true;
  } catch { return false; }
}

async function followersHistory() {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/state/followers_history.json`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "almanac-review" },
    });
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

// Latest followers per page and platform, and the gain since the check closest to 24 hours before.
function followerGains(hist) {
  const by = new Map();
  for (const h of hist) {
    const k = h.page + "|" + h.platform;
    (by.get(k) || by.set(k, []).get(k)).push({ t: new Date(h.at).getTime(), n: Number(h.followers) || 0, page: h.page, platform: h.platform });
  }
  return [...by.values()].map((list) => {
    list.sort((x, y) => x.t - y.t);
    const last = list[list.length - 1];
    const base = list.filter((x) => x.t <= last.t - 864e5).pop() || list[0];
    return { page: last.page, platform: last.platform, followers: last.n, gained: last.n - base.n };
  });
}

async function stateFile(name) {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/state/${name}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "almanac-review" },
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

const SCSS = `
main.wide{max-width:1120px}
.av-grid6{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));margin:10px 0}
.av-tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.av-tile .l{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px}
.av-tile .v{font:400 clamp(22px,4vw,30px)/1.15 Georgia,serif;font-variant-numeric:tabular-nums;margin-top:4px}
.av-sw{width:10px;height:10px;border-radius:2px;display:inline-block;flex:none}
.av-h{font:600 18px/1.3 Georgia,serif;margin:0 0 2px}.av-note{font-size:13px;color:var(--muted);margin:0 0 10px}
.av-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:var(--muted);margin:0 0 10px}.av-legend span{display:inline-flex;align-items:center;gap:6px}
.av-row{margin:12px 0;cursor:pointer}.av-row .n{font-size:14px;margin-bottom:4px}.av-row.sel .n{font-weight:700}
.av-stack{display:flex;align-items:center;gap:8px}.av-segs{display:flex;height:20px;border-radius:4px;overflow:hidden;min-width:2px}
.av-segs i{display:block;height:100%}.av-row:hover .av-segs{filter:brightness(1.08)}
.av-stack span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.av-two{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))}
.av-kpis{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));margin:12px 0}
.av-kpi{border:1px solid var(--line);border-radius:10px;padding:8px 10px}.av-kpi .l{font-size:12px;color:var(--muted)}.av-kpi .v{font:400 22px/1.2 Georgia,serif;font-variant-numeric:tabular-nums}
select.av-pick{font:inherit;font-size:15px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);max-width:100%}
.av-split{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center;font-size:14px}.av-split .b{display:flex;align-items:center;gap:8px}.av-split .b i{height:18px;border-radius:4px;display:block;min-width:2px}.av-split .b span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.av-chart{position:relative}.av-chart svg text{fill:var(--muted);font-size:12px}
.av-tip{position:fixed;pointer-events:none;background:var(--card);border:1px solid var(--line);border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.18);padding:6px 10px;font-size:13px;z-index:9;white-space:nowrap}
.av-tip .t{color:var(--muted)}
.learn li{margin:8px 0}
`;

async function statsPage(res, d) {
  const [a, fhist, vhist] = await Promise.all([analytics(), followersHistory(), stateFile("views_history.json")]);
  const refreshing = await refreshIfStale(a);
  const rows = (a && a.rows) || [];
  const P = PLAT.map(([n]) => n);
  const shorts = new Map();
  for (const r of rows) {
    const key = r.short || r.video;
    const s = shorts.get(key) || { name: key, page: r.page, posted: r.posted, by: {}, likes: 0, comments: 0, shares: 0, saves: 0, yt: null, drop: null, subs: null, links: {} };
    s.by[r.platform] = (s.by[r.platform] || 0) + (Number(r.views) || 0);
    for (const k of ["likes", "comments", "shares", "saves"]) s[k] += Number(r[k]) || 0;
    if (r.platform === "YouTube") { s.yt = r.avg_percent; s.drop = r.drop_second; s.subs = r.subs_gained ?? null; }
    if (r.link) s.links[r.platform] = r.link;
    if (r.posted && (!s.posted || r.posted < s.posted)) s.posted = r.posted;
    shorts.set(key, s);
  }
  const list = [...shorts.values()].map((s) => ({ ...s, total: Object.values(s.by).reduce((x, y) => x + y, 0) })).sort((x, y) => y.total - x.total);
  // Views over time per Short (all platforms added up at each check).
  const nameOf = new Map(rows.map((r) => [r.platform + "|" + r.video, r.short || r.video]));
  const series = {};
  for (const h of vhist || []) {
    const s = h.short || nameOf.get(h.platform + "|" + h.video);
    if (!s) continue;
    const m = (series[s] ||= {});
    m[h.at] = (m[h.at] || 0) + (Number(h.views) || 0);
  }
  const growth = Object.fromEntries(Object.entries(series).map(([s, m]) => [s, Object.entries(m).sort().map(([at, v]) => [at, v])]));
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  const signed = (n) => (n > 0 ? "+" : "") + fmt(n);
  const sum = (k) => list.reduce((x, s) => x + s[k], 0);
  const grand = sum("total");
  const per = Object.fromEntries(P.map((n) => [n, list.reduce((x, s) => x + (s.by[n] || 0), 0)]));
  const gains = followerGains(fhist.length ? fhist : Object.entries((a && a.followers) || {}).flatMap(([page, perP]) =>
    Object.entries(perP).filter(([, n]) => n != null).map(([platform, followers]) => ({ at: a.updated, page, platform, followers }))));
  const folTotal = gains.reduce((x, g) => x + g.followers, 0), folNew = gains.reduce((x, g) => x + g.gained, 0);
  const color = Object.fromEntries(PLAT);
  const sw = (n) => `<i class="av-sw" style="background:${color[n]}"></i>`;
  const tile = (label, v, n) => `<div class="av-tile"><div class="l">${n ? sw(n) : ""}${label}</div><div class="v">${v}</div></div>`;
  const lead = list[0];
  const tt = grand ? Math.round((per.TikTok / grand) * 100) : 0;
  const max = Math.max(1, ...list.map((s) => s.total));
  const bars = list.map((s, i) => `<div class="av-row${i === 0 ? " sel" : ""}" data-i="${i}"><div class="n">${esc(s.name)} <span class="small">· ${esc(s.page)}</span></div>
    <div class="av-stack"><div class="av-segs" style="width:${((s.total / max) * 82).toFixed(1)}%">${P.filter((n) => s.by[n]).map((n) =>
      `<i style="width:${((s.by[n] / s.total) * 100).toFixed(2)}%;background:${color[n]}" data-tip="${esc(n)}: ${fmt(s.by[n])} views"></i>`).join("")}</div><span>${fmt(s.total)}</span></div></div>`).join("");
  const pagesF = [...new Set(gains.map((g) => g.page))].sort();
  const folTable = `<table class="ft"><thead><tr><th>Page</th><th>Platform</th><th class="n">Followers</th><th class="n">New (24h)</th></tr></thead><tbody>${
    pagesF.map((p) => {
      const g = gains.filter((x) => x.page === p).sort((x, y) => y.followers - x.followers);
      const t = g.reduce((x, y) => x + y.followers, 0), n = g.reduce((x, y) => x + y.gained, 0);
      return g.map((x) => `<tr><td>${esc(p)}</td><td>${sw(x.platform)} ${esc(x.platform)}</td><td class="n">${fmt(x.followers)}</td><td class="n">${signed(x.gained)}</td></tr>`).join("")
        + `<tr class="tot"><td>${esc(p)}</td><td>All platforms</td><td class="n">${fmt(t)}</td><td class="n">${signed(n)}</td></tr>`;
    }).join("")}</tbody></table>`;
  const learn = ((a && a.learnings) || []).map((l) => `<li>${esc(l.point)}<div class="small">${esc(l.evidence)}</div></li>`).join("");
  const notes = ((a && a.notes) || []).map((n) => `<p class="small" style="color:#b3412f">${esc(n)}</p>`).join("");
  const data = JSON.stringify({ P, color, list: list.map(({ links, ...s }) => s), growth }).replace(/</g, "\\u003c");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Almanac analytics</title><style>${CSS}${SCSS}</style></head><body><main class="list wide">
<div class="top">The Almanac · Review</div>${tabs(d, "stats")}
<h1>Analytics</h1>
${lead ? `<p style="margin:4px 0"><b>${esc(lead.name)}</b> leads with <b>${fmt(lead.total)}</b> views; TikTok brings <b>${tt}%</b> of all views. Followers: <b>${fmt(folTotal)}</b>, <b>${signed(folNew)}</b> in the last 24 hours.</p>` : ""}
<p class="sub">${a ? "Updated " + esc(new Date(a.updated).toLocaleString("en-CA", { timeZone: "America/Vancouver", dateStyle: "medium", timeStyle: "short" })) + (refreshing ? " · refreshing now, check back in a few minutes" : " · refreshes every hour") : "No numbers yet."} · ${list.length} Shorts</p>
${notes}
<div class="av-grid6">${tile("All platforms", fmt(grand))}${P.map((n) => tile(n, fmt(per[n]), n)).join("")}</div>
<div class="av-grid6">${tile("New followers, 24h", signed(folNew))}${tile("Followers", fmt(folTotal))}${tile("Likes", fmt(sum("likes")))}${tile("Comments", fmt(sum("comments")))}${tile("Shares", fmt(sum("shares")))}${tile("Saves (Instagram)", fmt(sum("saves")))}</div>

<div class="card"><div class="av-h">Every Short, views by platform</div>
<p class="av-note">Total views per Short on one shared scale, split by platform. Tap a Short to open it below.</p>
<div class="av-legend">${P.map((n) => `<span>${sw(n)}${n}</span>`).join("")}</div>
${bars || '<p class="small">No views yet.</p>'}</div>

<div class="card" id="short"><div class="av-h">One Short up close</div>
<select class="av-pick" aria-label="Short">${list.map((s, i) => `<option value="${i}">${esc(s.name)} (${esc(s.page)})</option>`).join("")}</select>
<span class="small" id="av-meta"></span>
<div class="av-kpis" id="av-kpis"></div>
<div class="av-two">
  <div><div class="av-h" style="font-size:16px">Views by platform</div><p class="av-note">Where this Short's views came from.</p><div class="av-split" id="av-split"></div></div>
  <div><div class="av-h" style="font-size:16px">Views over time</div><p class="av-note">All platforms added up at each hourly check.</p><div class="av-chart" id="av-growth"></div></div>
</div></div>

<div class="av-two">
<div class="card"><div class="av-h">Followers by page and platform</div>
<p class="av-note">New = gained in the last 24 hours. YouTube shares and subscribers arrive 2–3 days late; Facebook reports views only.</p>${folTable}</div>
<div class="card"><div class="av-h">How to improve</div><p class="av-note">Written by Claude once a day from these numbers.</p><ol class="learn">${learn || "<li>Not enough data yet.</li>"}</ol></div>
</div>
<div class="av-tip" hidden></div>
<script>
const D = ${data};
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const tip = document.querySelector('.av-tip');
const showTip = (e, html) => { tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth; tip.style.left = Math.min(innerWidth - w - 8, e.clientX + 12) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; };
document.querySelectorAll('[data-tip]').forEach((el) => { el.addEventListener('mousemove', (e) => showTip(e, el.dataset.tip.replace(/&/g,'&amp;').replace(/</g,'&lt;'))); el.addEventListener('mouseleave', () => tip.hidden = true); });
const sel = document.querySelector('.av-pick');
const kpi = (l, v) => '<div class="av-kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>';
function show(i) {
  const s = D.list[i]; if (!s) return;
  sel.value = i;
  document.querySelectorAll('.av-row').forEach((r) => r.classList.toggle('sel', +r.dataset.i === +i));
  document.getElementById('av-meta').textContent = ' ' + s.page + (s.posted ? ' · posted ' + new Date(s.posted + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
  const eng = s.total ? ((s.likes + s.comments + s.shares) / s.total * 100).toFixed(1) + '%' : '—';
  document.getElementById('av-kpis').innerHTML = kpi('Views', fmt(s.total)) + kpi('Likes', fmt(s.likes)) + kpi('Comments', fmt(s.comments)) + kpi('Shares', fmt(s.shares))
    + kpi('Saves (Instagram)', fmt(s.saves)) + kpi('Engagement', eng) + kpi('YouTube % watched', s.yt == null ? '—' : Math.round(s.yt) + '%')
    + kpi('YouTube drop-off at', s.drop == null ? '—' : Math.round(s.drop) + 's') + kpi('YouTube subscribers gained', s.subs == null ? '—' : fmt(s.subs));
  const parts = D.P.map((p) => [p, s.by[p] || 0]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const m = Math.max(1, ...parts.map((x) => x[1]));
  document.getElementById('av-split').innerHTML = parts.map(([p, v]) => '<div>' + p + '</div><div class="b"><i style="width:' + (v / m * 78) + '%;background:' + D.color[p] + '"></i><span>' + fmt(v) + ' · ' + Math.round(v / s.total * 100) + '%</span></div>').join('') || '<p class="small">No views yet.</p>';
  drawGrowth(D.growth[s.name] || []);
}
function drawGrowth(pts) {
  const el = document.getElementById('av-growth');
  if (pts.length < 2) { el.innerHTML = '<p class="small">Not enough hourly checks yet for a line.</p>'; return; }
  const W = el.clientWidth || 360, H = 210, mt = 10, mb = 24, mr = 12;
  const t = pts.map((p) => new Date(p[0]).getTime()), v = pts.map((p) => p[1]);
  const vmax = Math.max(...v) || 1, step = Math.pow(10, Math.floor(Math.log10(vmax))) * (vmax / Math.pow(10, Math.floor(Math.log10(vmax))) > 5 ? 2 : 1);
  const top = Math.ceil(vmax / step) * step, ticks = []; for (let y = 0; y <= top; y += step) ticks.push(y);
  const ml = String(fmt(top)).length * 7 + 10;
  const X = (x) => ml + (x - t[0]) / ((t[t.length - 1] - t[0]) || 1) * (W - ml - mr), Y = (y) => H - mb - y / top * (H - mt - mb);
  const days = []; const d0 = new Date(t[0]); d0.setHours(0, 0, 0, 0); for (let d = d0.getTime() + 864e5; d < t[t.length - 1]; d += 864e5) days.push(d);
  let svg = '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '">';
  ticks.forEach((y) => { svg += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(y) + '" y2="' + Y(y) + '" stroke="var(--line)"/><text x="' + (ml - 6) + '" y="' + (Y(y) + 4) + '" text-anchor="end">' + fmt(y) + '</text>'; });
  days.forEach((d) => { svg += '<text x="' + X(d) + '" y="' + (H - 6) + '" text-anchor="middle">' + new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</text>'; });
  svg += '<path fill="none" stroke="var(--brown)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" d="' + t.map((x, i) => (i ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(v[i]).toFixed(1)).join('') + '"/>';
  svg += '<circle r="4" fill="var(--brown)" visibility="hidden"/><rect x="' + ml + '" y="0" width="' + (W - ml - mr) + '" height="' + H + '" fill="transparent"/></svg>';
  el.innerHTML = svg;
  const dot = el.querySelector('circle'), hit = el.querySelector('rect'), svgEl = el.querySelector('svg');
  hit.addEventListener('mousemove', (e) => {
    const r = svgEl.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * W;
    let i = 0; t.forEach((tt, j) => { if (Math.abs(X(tt) - x) < Math.abs(X(t[i]) - x)) i = j; });
    dot.setAttribute('cx', X(t[i])); dot.setAttribute('cy', Y(v[i])); dot.setAttribute('visibility', 'visible');
    showTip(e, '<div class="t">' + new Date(t[i]).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '</div>' + fmt(v[i]) + ' views');
  });
  hit.addEventListener('mouseleave', () => { tip.hidden = true; dot.setAttribute('visibility', 'hidden'); });
}
sel.addEventListener('change', () => show(+sel.value));
document.querySelectorAll('.av-row').forEach((r) => r.addEventListener('click', () => { show(+r.dataset.i); document.getElementById('short').scrollIntoView({ behavior: 'smooth' }); }));
let rw; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => show(+sel.value), 150); });
show(0);
</script>
</main></body></html>`);
}

// Where we are against the monetization plan (config/plan.yaml, via analytics.json).
async function planPage(res, d) {
  const a = await analytics();
  await refreshIfStale(a);
  const plan = (a && a.plan) || null;
  const fmt = (n) => Number(Math.round(n)).toLocaleString("en-US");
  const money = (n) => `${n < 0 ? "−" : ""}$${fmt(Math.abs(n))}`;
  let body = '<p class="small">No numbers yet.</p>';
  if (a && plan) {
    const day = Math.max(1, Math.floor((Date.now() - new Date(plan.launch + "T00:00:00Z")) / 864e5) + 1);
    const m = Math.min(12, Math.ceil(day / 30));
    const rows = a.rows || [];
    const total = rows.reduce((x, r) => x + (Number(r.views) || 0), 0);
    const pace = (total / day) * 30;                 // views per 30 days at the current rate
    const target = (k) => plan.views[k][m - 1];
    const band = pace >= target("breakout") ? ["Ahead of Breakout", "#2f7d4f"] : pace >= target("base") ? ["Above Base", "#2f7d4f"]
      : pace >= target("conservative") ? ["Between Conservative and Base", "#a07415"] : ["Below Conservative", "#b3412f"];
    const max = Math.max(pace, target("breakout"));
    const bar = (label, v, c) => `<div class="bar"><div class="bl">${label} <span class="small">${fmt(v)}</span></div>
      <div class="bt"><div class="bf" style="width:${((v / max) * 100).toFixed(1)}%;background:${c}"></div></div></div>`;
    const earned = (plan.earned || []).reduce((x, e) => x + (Number(e.usd) || 0), 0);
    const months = day / 30;
    const spent = (a.spent || 0) + plan.fixed_monthly_usd * Math.ceil(months);
    const net = earned - spent;
    const planNet = (k) => plan.net[k][m - 1];
    // followers per page and per platform
    const fol = a.followers || {};
    const pageTotals = Object.entries(fol).map(([name, f]) => [name, Object.values(f).reduce((x, y) => x + (Number(y) || 0), 0), f]);
    const ytMax = Math.max(0, ...Object.values(fol).map((f) => Number(f.YouTube) || 0));
    const fbMax = Math.max(0, ...Object.values(fol).map((f) => Number(f.Facebook) || 0));
    const folMax = Math.max(0, ...pageTotals.map((p) => p[1]));
    // Day 30 check: median YouTube views per Short per page, and the best Short
    const yt = rows.filter((r) => r.platform === "YouTube");
    const med = (xs) => { const s = [...xs].sort((p, q) => p - q); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
    const perPage = [...new Set(yt.map((r) => r.page))].map((pg) => [pg, med(yt.filter((r) => r.page === pg).map((r) => Number(r.views) || 0))]);
    const best = Math.max(0, ...yt.map((r) => Number(r.views) || 0));
    const metric = { youtube_subs: ytMax, followers: folMax, facebook: fbMax };
    const ms = (plan.milestones || []).map((x) => {
      let v = null, done = false, note = "";
      if (x.metric) { v = metric[x.metric] || 0; done = v >= x.target; note = `${fmt(v)} of ${fmt(x.target)}`; }
      else if (x.name.startsWith("Day 30")) { done = perPage.every((p) => p[1] >= 1000) && best >= 10000; note = perPage.map((p) => `${p[0]}: median ${fmt(p[1])}`).join(" · ") + ` · best ${fmt(best)}`; }
      else if (x.name.startsWith("Day 90")) { note = day < 90 ? `in ${90 - day} days` : ""; }
      const pct = v != null ? Math.min(100, (v / x.target) * 100) : null;
      return `<div class="ms"><div><b>${done ? "✓ " : ""}${esc(x.name)}</b> <span class="small">${esc(x.detail)}</span></div>
        ${pct != null ? `<div class="bt"><div class="bf" style="width:${Math.max(1, pct).toFixed(1)}%"></div></div>` : ""}
        ${note ? `<div class="small">${esc(note)}</div>` : ""}</div>`;
    }).join("");
    // platform mix vs plan
    const byPlat = {};
    rows.forEach((r) => { byPlat[r.platform] = (byPlat[r.platform] || 0) + (Number(r.views) || 0); });
    const plats = [...new Set([...Object.keys(plan.platform_split || {}), ...Object.keys(byPlat)])];
    const mix = plats.map((p) => `<tr><td>${esc(p)}</td><td class="n">${total ? Math.round(((byPlat[p] || 0) / total) * 100) : 0}%</td><td class="n">${(plan.platform_split || {})[p] ?? "—"}${(plan.platform_split || {})[p] != null ? "%" : ""}</td></tr>`).join("");
    const levers = (plan.levers || []).map((l) => `<li><b>${esc(l.name)}</b> <span class="pill">${esc(l.status)}</span> <span class="small">${esc(l.when)}</span><div class="small">${esc(l.detail)}</div></li>`).join("");
    const advice = (a.money || []).map((l) => `<li>${esc(l.point)}<div class="small">${esc(l.evidence)}</div></li>`).join("");
    body = `<p class="sub">Day ${day} of the plan · month ${m} of 12 · launched ${esc(plan.launch)}</p>
<div class="card"><div class="small">Views, month ${m} pace (all pages, all platforms)</div>
<div style="font:700 34px/1.1 Georgia,serif;margin:4px 0">${fmt(pace)} <span class="small">views / 30 days</span></div>
<div class="pill" style="background:${band[1]};color:#fff">${band[0]}</div>
${bar("Our pace", pace, "var(--brown)")}${bar("Breakout plan", target("breakout"), "#9bb7d4")}${bar("Base plan", target("base"), "#9bb7d4")}${bar("Conservative plan", target("conservative"), "#9bb7d4")}
<div class="small">${fmt(total)} views so far in ${day} day${day === 1 ? "" : "s"}. Early days swing a lot; read the trend weekly.</div></div>

<h2 class="top" style="margin-top:22px">Money</h2>
<div class="card"><table class="t"><tr><td>Spent so far</td><td class="n">${money(spent)}</td></tr>
<tr><td>Earned so far</td><td class="n">${money(earned)}</td></tr>
<tr><td><b>Net</b></td><td class="n"><b>${money(net)}</b></td></tr>
<tr><td>Plan at month ${m}: Base</td><td class="n">${money(planNet("base"))}</td></tr>
<tr><td>Plan at month ${m}: Conservative</td><td class="n">${money(planNet("conservative"))}</td></tr></table>
<div class="small">Break-even target: month ${plan.break_even_month.base} (Base). It only happens if sponsored Shorts start around month 7, which needs about 5,000 followers per page.</div></div>

<h2 class="top" style="margin-top:22px">Followers</h2>
<div class="card">${pageTotals.map(([n, t, f]) => `<div class="ms"><b>${esc(n)}</b> <span class="small">${fmt(t)} total · ${Object.entries(f).map(([k, v]) => `${k} ${fmt(v)}`).join(" · ")}</span></div>`).join("") || '<p class="small">No follower counts yet.</p>'}</div>

<h2 class="top" style="margin-top:22px">Milestones</h2>
<div class="card">${ms}</div>

<h2 class="top" style="margin-top:22px">Where views come from vs the plan</h2>
<div class="card"><table class="t"><tr><th>Platform</th><th class="n">Us</th><th class="n">Plan</th></tr>${mix}</table></div>

<h2 class="top" style="margin-top:22px">What to do next to make money</h2>
<div class="card"><ol class="learn">${advice || "<li>Written daily once there are enough numbers.</li>"}</ol></div>

<h2 class="top" style="margin-top:22px">Money levers from the plan</h2>
<div class="card"><ul class="learn">${levers}</ul></div>`;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Almanac plan</title><style>${CSS}</style></head><body><main class="list">
<div class="top">The Almanac · Review</div>${tabs(d, "plan")}<h1>The plan</h1>${body}
</main></body></html>`);
}

// Which login owns which account, and what the studio uses to reach it (config/accounts.json).
async function accountsPage(res, d) {
  let a = null;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/config/accounts.json`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "almanac-review" },
    });
    a = r.ok ? await r.json() : null;
  } catch {}
  const pill = (s) => {
    const c = { connected: "#2f7d4f", "in use": "#2f7d4f", manual: "#a07415", optional: "#6b6b6b" }[s] || "#b3412f";
    return `<span class="pill" style="background:${c}">${esc(s)}</span>`;
  };
  const login = (x) => x ? esc(x) : '<span class="small">not recorded yet</span>';
  const row = (x) => `<div class="acct">
  <div class="ah"><b>${esc(x.platform || x.name)}</b> ${x.handle ? (x.url ? `<a href="${esc(x.url)}">${esc(x.handle)}</a>` : esc(x.handle)) : ""} ${pill(x.status)}</div>
  ${x.what ? `<div class="small">${esc(x.what)}</div>` : ""}
  <div class="kv"><span>Login</span><span>${login(x.login)}</span></div>
  ${x.studio ? `<div class="kv"><span>Studio</span><span>${esc(x.studio)}</span></div>` : ""}
  ${x.secret ? `<div class="kv"><span>Secret</span><span><code>${esc(x.secret)}</code></span></div>` : ""}
</div>`;
  const body = !a ? '<p class="small">Accounts list not found.</p>' :
    a.pages.map((p) => `<h2>${esc(p.name)}</h2>${p.accounts.map(row).join("")}`).join("") +
    `<h2>Services</h2>${a.services.map(row).join("")}
<p class="small">Passwords and keys are never stored here: only which email logs in and the name of the GitHub secret the studio uses. To change something, tell Claude.</p>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Almanac accounts</title><style>${CSS}
.acct{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}
.ah{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.pill{color:#fff;border-radius:999px;padding:1px 9px;font-size:.75rem;font-family:system-ui,sans-serif}
.kv{display:grid;grid-template-columns:62px 1fr;gap:8px;font-size:.9rem;margin-top:4px}.kv>span:first-child{color:var(--muted)}
.kv code{font-size:.8rem;word-break:break-all}</style></head><body><main class="list">
<div class="top">The Almanac · Review</div>${tabs(d, "accounts")}<h1>Accounts</h1>${body}
</main></body></html>`);
}

// New comments on our posts, each with a reply Claude drafted. Nothing is posted from here:
// copy the reply, open the comment in the app, paste, then tick Done (remembered on this phone).
async function commentsPage(res, d) {
  const all = Object.values((await stateFile("comments.json")) || {});
  const todo = all.filter((c) => !c.replied && c.draft !== "").sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const colour = Object.fromEntries(PLAT);
  const card = (c) => `<div class="cm" data-id="${esc(c.id)}">
  <div class="ch"><span class="dot" style="background:${colour[c.platform] || "#888"}"></span><b>${esc(c.platform)}</b> · ${esc(c.page)} · <span class="small">${esc(c.short)}</span></div>
  <p class="ct"><b>${esc(c.author)}</b>: ${esc(c.text)}</p>
  ${c.draft ? `<p class="dr">${esc(c.draft)}</p>` : '<p class="small">No draft yet (next hourly run).</p>'}
  <div class="row">${c.draft ? `<button type="button" onclick="navigator.clipboard.writeText(this.dataset.t);this.textContent='Copied'" data-t="${esc(c.draft)}">Copy reply</button>` : ""}
  ${c.link ? `<a class="btn2" href="${esc(c.link)}" target="_blank" rel="noopener">Open</a>` : ""}
  <button type="button" class="ghost" onclick="done(this)">Done</button></div></div>`;
  const body = !all.length
    ? '<p class="small">No comments collected yet. The hourly analytics run reads YouTube, Instagram and Threads comments and drafts a reply for each. TikTok and Facebook comments need replying in their apps.</p>'
    : (todo.length ? todo.map(card).join("") : '<p class="small">All caught up.</p>') +
      `<p class="small">${all.length} comments seen · ${all.filter((c) => c.replied).length} already replied. Edit any draft so it sounds like you; reply within the first hour of a post when you can.</p>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Almanac comments</title><style>${CSS}
.cm{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}
.ch{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:.9rem}.dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.ct{margin:8px 0 6px}.dr{margin:0 0 8px;padding:8px 10px;border-left:3px solid var(--brown);background:var(--bg);border-radius:6px}
.row{display:flex;gap:8px;flex-wrap:wrap}.row button,.row a{flex:1;min-width:90px;text-align:center;padding:10px;border-radius:10px;border:0;font-weight:600;font-size:.9rem;text-decoration:none}
.row button{background:var(--brown);color:#fff}.row .btn2{background:var(--line);color:var(--ink)}.row .ghost{background:transparent;border:1px solid var(--line);color:var(--ink)}
.cm.hide{display:none}</style></head><body><main class="list">
<div class="top">The Almanac · Review</div>${tabs(d, "comments")}<h1>Comments</h1>${body}
<script>
const K = "almanac-done-comments";
const get = () => { try { return JSON.parse(localStorage.getItem(K) || "[]"); } catch { return []; } };
function done(b) { const c = b.closest(".cm"); const s = get(); s.push(c.dataset.id); try { localStorage.setItem(K, JSON.stringify(s.slice(-500))); } catch {} c.classList.add("hide"); }
for (const id of get()) { const c = document.querySelector('.cm[data-id="' + CSS.escape(id) + '"]'); if (c) c.classList.add("hide"); }
</script>
</main></body></html>`);
}

// GitHub sometimes skips its schedule for a whole day; opening the Review tab starts the
// daily job if it hasn't run in 20 hours (it skips pages that already have today's Short).
async function kickDailyIfMissed() {
  try {
    const last = ((await gh(`/actions/workflows/daily.yml/runs?per_page=1`)).workflow_runs || [])[0];
    if (last && (last.status !== "completed" || Date.now() - new Date(last.created_at) < 20 * 3600e3)) return false;
    await gh(`/actions/workflows/daily.yml/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main" }) });
    return true;
  } catch { return false; }
}

async function dashboard(res, d) {
  const kicked = await kickDailyIfMissed();
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
${open.map((it) => item(it, true)).join("") || (kicked ? `<p class="small">Today's Shorts hadn't started, so they're being made now. They'll show here in about 20 minutes.</p>` : `<p class="small">Nothing to review right now.</p>`)}
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
      if (q.tab === "plan") return await planPage(res, String(q.d));
      if (q.tab === "accounts") return await accountsPage(res, String(q.d));
      if (q.tab === "comments") return await commentsPage(res, String(q.d));
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
    // ?t=1 does the same for the cover image (thumbnail.jpg), for posting to TikTok.
    if (q.v !== undefined || q.t !== undefined) {
      const file = q.t !== undefined ? "thumbnail.jpg" : "short.mp4";
      const tag = (body.match(/tag:(short-[a-z_]+-[0-9-]+)/) || [])[1];
      if (!tag) { res.status(404).send("No video for this Short."); return; }
      const rel = await gh(`/releases/tags/${tag}`);
      const asset = (rel.assets || []).find((a) => a.name === file);
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
      script: section(body, "Script"), notes: section(body, "Minor fact-check notes"), caption: section(body, "Caption"), pinned: section(body, "Pinned comment"),
      st: status(issue, comments), i, k, thread: thread(comments),
      flash: q.e === "notes" ? "Type your notes first, then send." : "",
    }));
  } catch (e) {
    res.status(500).send(`Couldn't load this review (${esc(e.message)}). Open the issue in GitHub instead.`);
  }
};
