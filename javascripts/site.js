/* =============================================================================
   Jiawei Zhou — site renderer
   Reads data/*.json and builds the page. No dependencies, no build step.
   To add a paper: add one object to data/publications.json. Nothing here changes.
   ========================================================================== */

(function () {
  "use strict";

  var ME = "Jiawei Zhou";

  var TALKS_VISIBLE = 6;
  var TALKS_STEP = 6;

  var NEWS_ICON = {
    paper: "📄", award: "🏅", talk: "🎤", milestone: "🚩", travel: "✈️"
  };

  // --- helpers --------------------------------------------------------------

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function el(id) { return document.getElementById(id); }

  function authorLine(authors) {
    return authors.map(function (a) {
      return a.replace(/\*/g, "") === ME
        ? '<span class="me">' + esc(a) + "</span>"
        : esc(a);
    }).join(", ");
  }

  function awardTags(p) {
    if (!p.awards || !p.awards.length) return "";
    return p.awards.map(function (a) {
      return '<span class="award-tag">🏅 ' + esc(a) + "</span>";
    }).join(" ");
  }

  /* Paper titles link to the DOI (canonical, citable). PDF stays a button. */
  function titleHref(p) {
    var L = p.links || {};
    return L.doi || L.webpage || L.pdf || null;
  }

  function linkRow(p, idx) {
    var out = [];
    var L = p.links || {};
    if (L.pdf)     out.push('<a href="' + esc(L.pdf) + '" target="_blank" rel="noopener">PDF</a>');
    if (L.doi)     out.push('<a href="' + esc(L.doi) + '" target="_blank" rel="noopener">DOI</a>');
    if (L.webpage) out.push('<a href="' + esc(L.webpage) + '" target="_blank" rel="noopener">Project page</a>');
    if (L.video)   out.push('<a href="' + esc(L.video) + '" target="_blank" rel="noopener">Video</a>');
    if (p.bibtex) {
      out.push('<button type="button" data-toggle="bib-' + idx + '" aria-expanded="false" aria-controls="bib-' + idx + '">BibTeX</button>');
    }
    return '<div class="pub-links">' + out.join("") + "</div>";
  }

  function panels(p, idx) {
    if (!p.bibtex) return "";
    return '<div class="panel" id="bib-' + idx + '" hidden>' +
             '<div class="panel-tools">' +
               '<button class="copy-btn" type="button" data-copy="bibsrc-' + idx + '">Copy</button>' +
             "</div>" +
             '<pre id="bibsrc-' + idx + '">' + esc(p.bibtex) + "</pre>" +
           "</div>";
  }

  function pressList(p) {
    if (!p.press || !p.press.length) return "";
    // press entries may contain trusted anchor markup authored in the JSON
    return '<ul class="press">' + p.press.map(function (t) {
      return "<li>" + t + "</li>";
    }).join("") + "</ul>";
  }

  function pubEntry(p, idx) {
    var href = titleHref(p);
    var title = href
      ? '<a class="pub-title" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>"
      : '<span class="pub-title">' + esc(p.title) + "</span>";

    var awards = awardTags(p);

    return '<div class="pub-head"><span class="venue">' + esc(p.venue) + "</span>" + title + "</div>" +
      (awards ? '<div class="awards">' + awards + "</div>" : "") +
      '<div class="authors">' + authorLine(p.authors) + "</div>" +
      '<div class="venue-full">' + esc(p.venueFull || "") + "</div>" +
      linkRow(p, idx) +
      panels(p, idx) +
      pressList(p);
  }

  // --- renderers ------------------------------------------------------------

  function renderOverview(groups, pubs, illus) {
    var host = el("overview");
    if (!host) return;

    var byId = {};
    pubs.forEach(function (p) { byId[p.id] = p; });

    host.innerHTML = groups.map(function (g) {
      var papers = (g.papers || []).map(function (id) { return byId[id]; })
        .filter(Boolean)
        .sort(function (a, b) { return b.year - a.year; });

      var links = papers.map(function (p) {
        var href = titleHref(p);
        var inner = '<span class="venue sm">' + esc(p.venue) + "</span> " + esc(p.title);
        return "<li>" + (href
          ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + "</a>"
          : inner) + "</li>";
      }).join("");

      // Illustrations are inlined (not <img>) so they inherit the theme color
      // and adapt to dark mode. Markup comes from data/illustrations.json.
      var art = "";
      if (g.illus && illus && illus[g.illus]) {
        art = '<div class="ov-figure">' + illus[g.illus] + "</div>";
      } else if (g.image) {
        art = '<div class="ov-figure"><img src="' + esc(g.image) + '" alt="" loading="lazy"></div>';
      }

      // Theme name sits above the descriptive title as a small kicker.
      var eyebrow = g.eyebrow ? '<p class="ov-eyebrow">' + esc(g.eyebrow) + "</p>" : "";

      return '<article class="ov-card">' + art +
        '<div class="ov-body">' + eyebrow + "<h3>" + esc(g.title) + "</h3>" +
        "<p>" + esc(g.blurb) + "</p>" +
        '<ul class="ov-papers">' + links + "</ul></div></article>";
    }).join("");
  }

  function renderPubs(pubs) {
    var host = el("pubs");
    if (!host) return;

    // Flat reverse-chronological list. No grouping, no filters.
    host.innerHTML = pubs.map(function (p, i) {
      return '<article class="pub">' + pubEntry(p, "p" + i) + "</article>";
    }).join("");
  }

  function renderNews(items) {
    var host = el("news");
    if (!host) return;
    host.innerHTML = items.map(function (n) {
      var icon = NEWS_ICON[n.kind] || "•";
      return "<li><time>" + esc(n.date) + "</time>" +
             '<span class="body"><span class="ico" aria-hidden="true">' + icon + "</span>" +
             n.html + "</span></li>";
    }).join("");
  }

  function renderTravels(items) {
    var host = el("travels");
    if (!host) return;

    host.innerHTML = items.map(function (t, i) {
      var name = t.url
        ? '<a href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.host) + "</a>"
        : esc(t.host);
      return "<li" + (i >= TALKS_VISIBLE ? " hidden" : "") + '><span class="yr">' + esc(t.date || "") + "</span><span>" +
             '<span class="tv-host">' + name + "</span>" +
             (t.detail ? '<br><span class="host">' + esc(t.detail) + "</span>" : "") +
             "</span></li>";
    }).join("");

    var btn = el("talks-more");
    if (!btn) return;
    if (items.length <= TALKS_VISIBLE) { btn.hidden = true; return; }

    // Reveal TALKS_STEP more each click until everything is shown.
    var shown = TALKS_VISIBLE;
    var lis = host.querySelectorAll("li");

    function apply() {
      lis.forEach(function (li, i) { li.hidden = i >= shown; });
      btn.hidden = shown >= items.length;
    }

    apply();
    btn.textContent = "Show more";
    btn.addEventListener("click", function () {
      shown += TALKS_STEP;
      apply();
    });
  }

  // --- panel toggles + copy-to-clipboard (delegated for the whole document) --

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-toggle]");
    if (btn) {
      var panel = document.getElementById(btn.getAttribute("data-toggle"));
      if (!panel) return;
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      return;
    }

    var copy = e.target.closest("button[data-copy]");
    if (!copy) return;

    var src = document.getElementById(copy.getAttribute("data-copy"));
    if (!src) return;

    var done = function (ok) {
      copy.textContent = ok ? "Copied" : "Press ⌘C";
      copy.classList.toggle("copied", ok);
      setTimeout(function () {
        copy.textContent = "Copy";
        copy.classList.remove("copied");
      }, 1600);
    };

    var text = src.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); },
                                              function () { fallback(); });
    } else {
      fallback();
    }

    // Older browsers, and any page not served over https, need the old path.
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  });

  // --- boot -----------------------------------------------------------------

  function load(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + ": " + r.status);
      return r.json();
    });
  }

  // Self-contained preview builds inline their data as window.SITE_DATA so the
  // page works when opened straight off disk, where fetch() is blocked.
  var inline = (typeof window !== "undefined") && window.SITE_DATA;

  var sources = inline
    ? Promise.resolve([inline.publications, inline.news, inline.travels || [],
                       inline.overview || [], inline.illustrations || {}])
    : Promise.all([
        load("data/publications.json"),
        load("data/news.json"),
        load("data/travels.json").catch(function () { return []; }),
        load("data/overview.json").catch(function () { return []; }),
        load("data/illustrations.json").catch(function () { return {}; })
      ]);

  sources.then(function (res) {
    var pubs = res[0], news = res[1], travels = res[2], overview = res[3], illus = res[4];
    pubs.sort(function (a, b) { return b.year - a.year; });
    renderOverview(overview, pubs, illus);
    renderPubs(pubs);
    renderNews(news);
    renderTravels(travels);
    document.querySelectorAll(".loading").forEach(function (n) { n.remove(); });
  }).catch(function (err) {
    console.error(err);
    document.querySelectorAll(".loading").forEach(function (n) {
      n.textContent = "Could not load content. If you are opening this file directly " +
        "from disk, run a local server instead: python3 -m http.server";
    });
  });
})();
