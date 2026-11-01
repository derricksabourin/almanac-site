// /books — the bio link for every Almanac account: the real book behind each Short,
// newest first, linked to Amazon with our Associates tag (almanac06-20; AMAZON_TAG env var overrides).
// Reads state/books.json, which the studio appends to whenever a Short is posted.
const REPO = process.env.GITHUB_REPO || "catrobert/get-rich-project";
const PAGES = { grey_almanac: "Grey Almanac", fortune_almanac: "Fortune Almanac" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function amazon(q, audible) {
  const u = new URL("https://www.amazon.com/s");
  u.searchParams.set("k", q);
  if (audible) u.searchParams.set("i", "audible");
  u.searchParams.set("tag", (process.env.AMAZON_TAG || "almanac06-20").trim());   // Associates ID (not secret)
  return u.toString();
}

async function books() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/state/books.json`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "almanac-books" },
  });
  return r.ok ? r.json() : [];
}

const CSS = `:root{--bg:#FBFAF6;--ink:#2b2b2b;--brown:#965C2A;--blue:#7AA8D0;--muted:#6b6b6b;--line:#e4e0d6;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#1b1a17;--ink:#ece8df;--brown:#d39a63;--blue:#7AA8D0;--muted:#a9a397;--line:#3a3731;--card:#24221e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 Georgia,'Times New Roman',serif}
main{max-width:560px;margin:0 auto;padding:28px 16px 56px}
header{text-align:center;margin-bottom:18px}h1{color:var(--brown);font-size:1.7rem;margin:0 0 4px}header p{margin:0;color:var(--muted)}
nav{display:flex;gap:8px;justify-content:center;margin:16px 0 8px;flex-wrap:wrap}
nav a{border:1px solid var(--line);border-radius:999px;padding:6px 14px;color:var(--ink);text-decoration:none;font-size:.9rem;background:var(--card)}
nav a.on{background:var(--brown);border-color:var(--brown);color:#fff}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0;scroll-margin-top:16px}
.card:target{border-color:var(--brown);box-shadow:0 0 0 3px color-mix(in srgb,var(--brown) 25%,transparent)}
.kicker{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.short{font-weight:bold;margin:4px 0 8px}.book{margin:0 0 12px}.book i{color:var(--brown)}
.btn{display:block;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font:600 16px/1.2 system-ui,sans-serif;margin-top:8px}
.buy{background:var(--brown);color:#fff}.listen{border:1px solid var(--line);color:var(--ink)}
.watch{font-size:.85rem}.watch a{color:var(--muted)}footer{margin-top:28px;font-size:.8rem;color:var(--muted);text-align:center}`;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const only = PAGES[req.query.page] ? req.query.page : "";
  const list = (await books()).filter((b) => !only || b.page === only).reverse();
  const cards = list.map((b) => {
    const q = `${b.book} ${b.author}`;
    return `<div class="card" id="${esc(b.id)}">
<div class="kicker">${esc(PAGES[b.page] || b.page)}</div>
<div class="short">${esc(b.short)}</div>
<p class="book">${b.note ? esc(b.note) + ": " : "The book behind it: "}<i>${esc(b.book)}</i> by ${esc(b.author)}</p>
<a class="btn buy" href="${esc(amazon(q))}" rel="sponsored noopener" target="_blank">Get the book</a>
<a class="btn listen" href="${esc(amazon(q, true))}" rel="sponsored noopener" target="_blank">Listen on Audible</a>
${b.youtube ? `<p class="watch"><a href="${esc(b.youtube)}">Watch the Short again</a></p>` : ""}
</div>`;
  }).join("");
  const tab = (k, label) => `<a href="/books${k ? "?page=" + k : ""}" class="${only === k ? "on" : ""}">${label}</a>`;
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>The Almanac Books</title>
<meta name="description" content="The real books behind every Grey Almanac and Fortune Almanac story.">
<style>${CSS}</style></head><body><main>
<header><h1>The Almanac</h1><p>Liked a story? Here's the book it comes from.</p></header>
<nav>${tab("", "All")}${tab("grey_almanac", "Grey Almanac")}${tab("fortune_almanac", "Fortune Almanac")}</nav>
${cards || "<p>No books yet.</p>"}
<footer>As an Amazon Associate, The Almanac earns from qualifying purchases.</footer>
</main></body></html>`);
};
