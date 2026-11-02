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
  const [a, hist, fol] = await Promise.all([file("state/analytics.json"), file("state/views_history.json"), file("state/followers_history.json")]);
  if (!a) return res.status(503).send(JSON.stringify({ error: "No analytics yet" }));
  const what = String(req.query.what || "videos");
  if (what === "history") {
    // Name each sample's Short (older samples only carry the caption): same platform and caption as a current row.
    const short = new Map((a.rows || []).map((r) => [r.platform + "|" + r.video, [r.short, r.page]]));
    return res.status(200).send(JSON.stringify((hist || []).map((h) => {
      const [s, p] = short.get(h.platform + "|" + h.video) || [h.short || h.video, h.page || ""];
      return { at: h.at, platform: h.platform, short: h.short || s, page: h.page || p, views: h.views };
    })));
  }
  if (what === "followers") {
    // Hourly follower counts per page and platform; before history began, today's count stands alone.
    const now = Object.entries(a.followers || {}).flatMap(([page, per]) =>
      Object.entries(per).filter(([, n]) => n != null).map(([platform, followers]) => ({ at: a.updated, page, platform, followers })));
    const rows = (fol && fol.length) ? fol : now;
    return res.status(200).send(JSON.stringify(rows));
  }
  if (what === "learnings")
    return res.status(200).send(JSON.stringify((a.learnings || []).map((l) => ({ ...l, at: a.learned_at }))));
  if (what === "notes") return res.status(200).send(JSON.stringify((a.notes || []).map((n) => ({ note: n, updated: a.updated }))));
  res.status(200).send(JSON.stringify((a.rows || []).map((r) => ({ ...r, updated: a.updated }))));
};
