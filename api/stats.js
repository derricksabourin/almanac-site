// Read-only views data for the Almanac Views dashboard (public numbers only:
// views, likes and comments per video per platform, view history, learnings).
const REPO = process.env.GITHUB_REPO || "catrobert/get-rich-project";

async function file(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "almanac-stats" },
  });
  return r.ok ? r.json() : null;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.setHeader("Content-Type", "application/json");
  const [a, hist] = await Promise.all([file("state/analytics.json"), file("state/views_history.json")]);
  if (!a) return res.status(503).send(JSON.stringify({ error: "No analytics yet" }));
  const what = String(req.query.what || "videos");
  if (what === "history") return res.status(200).send(JSON.stringify(hist || []));
  if (what === "learnings")
    return res.status(200).send(JSON.stringify((a.learnings || []).map((l) => ({ ...l, at: a.learned_at }))));
  if (what === "notes") return res.status(200).send(JSON.stringify((a.notes || []).map((n) => ({ note: n, updated: a.updated }))));
  res.status(200).send(JSON.stringify((a.rows || []).map((r) => ({ ...r, updated: a.updated }))));
};
