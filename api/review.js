// Review page for The Almanac's daily Shorts.
//
// The pipeline texts each reviewer a link like /review?i=12&k=<key>. This page shows the video
// and script from GitHub issue #12 and turns the buttons into issue comments (/approve,
// /revise <notes>, /reject), which the repo's approve.yml workflow acts on.
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
.list .t{font:700 17px/1.3 Georgia,serif}.tag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:99px;background:var(--line);margin-top:6px}`;

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
    if (/^New cut is up/.test(t)) return { kind: "ready", text: "A new cut is ready (below)." };
    if (/^On it/.test(t)) return { kind: "busy", text: "Making the new cut. Refresh in a few minutes." };
    if (/^\/approve/.test(t)) return { kind: "busy", text: "Approved. Posting now; refresh in a couple of minutes." };
    if (/^\/reject/.test(t)) return { kind: "busy", text: "Rejecting…" };
    if (/^\/revise/.test(t)) return { kind: "busy", text: "Notes sent. The new cut takes a few minutes." };
  }
  return { kind: "ready", text: "" };
}

function page({ title, show, date, video, watch, script, notes, caption, st, i, k, flash }) {
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
${flash ? `<div class="status busy">${esc(flash)}</div>` : ""}
${st.text ? `<div class="status ${st.kind}">${esc(st.text)}${(st.links || []).map((l) => `<br><a href="${esc(l)}">${esc(l)}</a>`).join("")}</div>` : ""}
${open ? `<form method="post" class="btns">
  <input type="hidden" name="i" value="${esc(i)}"><input type="hidden" name="k" value="${esc(k)}">
  <button class="ok" name="action" value="approve">Approve and post</button>
  <textarea name="notes" placeholder="What should change? e.g. say the year sooner, slower ending"></textarea>
  <button class="rev" name="action" value="revise">Send notes for a new cut</button>
  <button class="no" name="action" value="reject" onclick="return confirm('Throw this Short away?')">Reject</button>
</form>` : ""}
<details open><summary>Script</summary><ol>${lines}</ol></details>
${notes && notes !== "- none" ? `<details><summary>Fact-check notes</summary><p class="small">${esc(notes).replace(/\n/g, "<br>")}</p></details>` : ""}
${caption ? `<details><summary>Caption</summary><p class="small">${esc(caption).replace(/\n/g, "<br>")}</p></details>` : ""}
<p class="small">Revisions only re-make the shots your notes change. <a href="https://github.com/${REPO}/issues/${esc(i)}">Open in GitHub</a></p>
</main></body></html>`;
}


async function dashboard(res) {
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
<div class="top">The Almanac · Review</div><h1>${open.length ? `${open.length} waiting` : "All caught up"}</h1>
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
      if (!process.env.DASHBOARD_KEY || String(q.d) !== process.env.DASHBOARD_KEY) {
        res.status(403).send("This dashboard link isn't valid.");
        return;
      }
      return await dashboard(res);
    }
    if (!i || !k) throw new Error("bad link");
    const issue = await gh(`/issues/${i}`);
    const body = issue.body || "";
    const key = (body.match(/<!-- key:([a-f0-9]+) -->/) || [])[1];
    if (!key || key !== k) {
      res.status(403).send("This review link isn't valid. Use the latest text, or open the issue in GitHub.");
      return;
    }

    if (req.method === "POST") {
      const action = String(q.action || "");
      const notes = String(q.notes || "").trim();
      let comment = null;
      if (action === "approve") comment = "/approve\n\n_Sent from the review page._";
      if (action === "reject") comment = "/reject\n\n_Sent from the review page._";
      if (action === "revise" && notes) comment = `/revise ${notes}`;
      if (comment && issue.state === "open") await gh(`/issues/${i}/comments`, { method: "POST", body: JSON.stringify({ body: comment }) });
      const flash = action === "revise" && !notes ? "Type your notes first, then send." : "";
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
      video: (body.match(/<!-- video:(\S+) -->/) || [])[1],
      watch: (body.match(/Watch:\*\*\s*(\S+)/) || [])[1] || issue.html_url,
      script: section(body, "Script"), notes: section(body, "Minor fact-check notes"), caption: section(body, "Caption"),
      st: status(issue, comments), i, k,
      flash: q.e === "notes" ? "Type your notes first, then send." : "",
    }));
  } catch (e) {
    res.status(500).send(`Couldn't load this review (${esc(e.message)}). Open the issue in GitHub instead.`);
  }
};
