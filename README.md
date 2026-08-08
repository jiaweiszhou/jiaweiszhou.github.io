# jiaweizhou.org

Static site. No build step, no dependencies. GitHub Pages serves it as-is.

## Structure

```
index-new.html          page shell: about text, section headings, meta tags
preview.html            generated single-file preview (open by double-clicking)
stylesheets/main.css    all styling; design tokens at the top in :root
javascripts/site.js     reads the JSON files and renders the page
data/publications.json  every paper — the only file you touch to add one
data/overview.json      the three Research cards: title, blurb, image, paper ids
data/news.json          news feed
data/travels.json       recent talks
assets/                 PDFs, figures, profile photo
assets/illus/           Research card illustrations (Freepik)
assets/img-orig/        full-resolution originals of the figures
```

## The Research section

`data/overview.json` drives it. Each entry is one card: a title, a plain-language
blurb, an `image` path, and a list of paper `id`s pulled from `publications.json`.
The paper links render themselves, newest first, so a card stays current as long
as you add the new paper's id.

The card titles deliberately echo the highlighted phrases in the About section, in
the same order. If you reword one, reword the other so a reader meets the same
three ideas twice in the same language.

Illustrations live in `assets/illus/`, sourced from Freepik and credited in the
footer. They are square, drawn on white, and displayed with `object-fit: contain`
so nothing crops. The figure stage stays white even in dark mode, which avoids
putting a bright square on a dark card. Swap one by replacing the file or pointing
`image` somewhere else; keep new art square and on a white background so the three
cards stay consistent.

## Adding a paper

Add one object to `data/publications.json`. Nothing else changes. Entries sort by
`year` automatically, newest first.

```json
{
  "id": "zhou2027example",
  "title": "Full Paper Title",
  "authors": ["Jiawei Zhou", "Coauthor Name"],
  "venue": "CHI'27",
  "venueFull": "Proceedings of the 2027 CHI Conference..., 20 pages.",
  "year": 2027,
  "links": { "pdf": "assets/chi27_paper.pdf", "doi": "https://doi.org/..." },
  "bibtex": "@inproceedings{...}"
}
```

Optional fields:

| Field       | Effect |
|-------------|--------|
| `awards`    | array of strings, e.g. `["Best Paper"]`, renders as gold tags |
| `abstract`   | kept in the data but not rendered; re-enable in `panels()` in site.js |
| `press`     | array of HTML strings for talks, coverage, citations |
| `links.webpage`, `links.video` | extra buttons |

The Publications list is flat and reverse-chronological. There is no theme
grouping and no filter bar. To feature a paper, add its `id` to a card in
`data/overview.json` instead.

Paper titles link to the DOI. PDF, DOI, project page and BibTeX appear as buttons
underneath. The BibTeX panel has a Copy button that uses the clipboard API with an
`execCommand` fallback, so it works over `file://` and on older browsers too.

## Adding a travel or talk

Add an object to `data/travels.json`, newest first:

```json
{
  "date": "Nov 2026",
  "host": "AMIA 2026 Annual Symposium",
  "location": "Dallas, TX",
  "url": "https://..."
}
```

Only `date` and `host` are rendered, which keeps the section short. `location` is
retained in the data but not shown; to bring it back, restore the `place` span in
`renderTravels()`. `url` and `detail` are optional.

## Adding news

Prepend to `data/news.json`. `kind` picks the emoji: `paper`, `award`, `talk`,
`milestone`, `travel`. The whole list lives in a scrollable panel, so it never
pushes the rest of the page down no matter how long it gets. Adjust the height
with `.news-scroll { max-height }` in `main.css`.

## Editing the look

Every color, the max width, and the sidebar width are CSS custom properties at
the top of `main.css`. Dark mode is a second block of the same variables under
`prefers-color-scheme: dark`. Change a value once, it applies everywhere.

## Responsive behaviour

The stylesheet is mobile-first: base rules describe the phone layout, and three
media queries add to it.

| Width      | Layout |
|------------|--------|
| < 380px    | tighter padding, smaller avatar and figures |
| < 640px    | single column, photo above name, news and talks stack date over text |
| 640–899px  | photo beside name, two-column Research cards, date column returns |
| ≥ 900px    | sticky sidebar rail with section nav |

Touch targets are at least 40px, long titles wrap rather than overflow, and
BibTeX blocks scroll horizontally on their own. Research cards stack on phones,
go two-up on tablets, and become full-width rows with the art beside the text on
desktop.

## Regenerating preview.html

`preview.html` is a build artifact that inlines the CSS, JS, and JSON so it opens
without a server. Rebuild it after edits:

```bash
python3 - <<'PY'
import json, os
html = open("index-new.html").read()
css  = open("stylesheets/main.css").read()
js   = open("javascripts/site.js").read()
data = {k: json.load(open(f"data/{k}.json")) for k in ["publications","news","travels","overview"]}
out = (html
  .replace('<link rel="stylesheet" href="stylesheets/main.css">', "<style>\n"+css+"\n</style>")
  .replace('<script src="javascripts/site.js"></script>',
           "<script>window.SITE_DATA="+json.dumps(data)+";</script>\n<script>\n"+js+"\n</script>")
  .replace("<title>Jiawei Zhou —", "<title>[PREVIEW] Jiawei Zhou —"))
open("preview.html","w").write(out)
PY
```

## Previewing locally

The page loads JSON via `fetch`, which browsers block on `file://`. Run a server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index-new.html
```

## Going live

Rename `index-new.html` to `index.html` when you're happy with it. The old file
stays in git history if you want it back.
