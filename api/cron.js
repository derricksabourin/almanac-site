// Backup clock for the studio. GitHub often skips its own scheduled runs (whole days of
// them in Nov 2026), so Vercel's cron calls this a few times a day and it starts the
// GitHub workflows itself. Both are safe to start twice: the daily job skips a page that
// already has today's Short, and analytics just refreshes the numbers.
const REPO = "catrobert/get-rich-project";

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "almanac-cron", ...(opts.headers || {}) },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.status === 204 ? null : r.json();
}

async function kick(workflow, minHours) {
  const runs = await gh(`/actions/workflows/${workflow}/runs?per_page=1`);
  const last = (runs.workflow_runs || [])[0];
  if (last && (last.status !== "completed" || Date.now() - new Date(last.created_at) < minHours * 3600e3)) return "recent";
  await gh(`/actions/workflows/${workflow}/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main" }) });
  return "started";
}

module.exports = async (req, res) => {
  if (!String(req.headers["user-agent"] || "").startsWith("vercel-cron")) return res.status(403).send("no");
  const out = {};
  for (const [wf, h] of [["daily.yml", 2], ["analytics.yml", 0.75]]) {
    try { out[wf] = await kick(wf, h); } catch (e) { out[wf] = String(e.message || e); }
  }
  res.status(200).json(out);
};
