# NEXORA — homepage

A single-page marketing site built from the supplied design mock-up. Plain HTML,
CSS and vanilla JavaScript — no build step, no npm install, no framework. Open
`index.html` in a browser and it runs.

```
nexora-website/
├── index.html            the whole page
├── README.md             this file
└── assets/
    ├── css/styles.css    design tokens + every rule
    ├── js/main.js        nav, theme, reveals, count-up, carousel, lightbox, filters
    └── img/
        ├── work/         six 800×600 project images
        ├── brand/        the DiDconn banner (display + lightbox copies)
        ├── highlights/   LEAP photos
        └── team/         portrait tiles
```

Total weight is just under 1 MB, of which the images are about four fifths
(highlights 332 KB, work 192 KB, team 136 KB, DiDconn brand 128 KB). The only
external request is the Google Fonts stylesheet for Sora and Inter; if you would
rather have zero third-party requests, delete the three `fonts.g*` `<link>` tags
in the `<head>` and the page falls back to the system UI font stack that is
already declared in `--font-d` / `--font-b`.

## Real content vs. mock-up content

The page mixes two kinds of content and it matters which is which.

**Real and verifiable** — sourced from Nouman Hanif's CV, safe to keep:

- The **leadership card** at the top of `#people`. Every fact in it (18 years,
  the 50% and 2× figures, MSc Abertay Dundee, BSc Hajvery, Open AR Cloud, the
  Springer editorial board, the Udacity certificate) comes from the CV. The three
  profile links are his real LinkedIn, GitHub and Stack Overflow.
- The whole **`#products` section** — twelve products, each with its real employer
  and every link taken verbatim from the CV. Nine are publicly listed, one is a
  fixed installation and two were proofs of concept; the cards say which.
- The hero's **18 Years Engineering Experience** stat (was `10+` in the mock-up).
  No `+`: the older CV says "over 15 years" and the newer one says a flat
  "18 years", so the site takes the flat number rather than stretching it.
- The **DiDconn** name and its *Identity · Connectivity · Economy* tagline, and
  the banner in `assets/img/brand/`.

One deliberate exception: his title. **Co-founder & Chief Technology Officer**
is a NEXORA role, not a CV fact — the CVs top out at "Team Lead / Senior Mobile
Developer". That is a business decision, so it stands, but it is the one line in
the card that a CV cannot back up.

The rest of the card and the product deks were checked claim-by-claim against
both CVs and reworded wherever they ran ahead of the source. If you edit that
copy, keep it conservative: three of the twelve products were not public
releases (two proofs of concept, one fixed installation) and each card says so.

**Two things to check with him:**

1. The two CVs disagree on the MSc programme — one says *Computer Games
   Technology*, the other *Software Engineering*, same university and dates. The
   card says just "MSc, University of Abertay Dundee" until that is settled.
2. His personal mobile and Hotmail address are in the CV but are deliberately
   **not** on the site. Add a work address if he wants to be contactable here.

**Still mock-up** — replace before launch:

Everything below came from the mock-up and is deliberately obvious rather than
invented. The same list lives in a comment at the top of `index.html`.

| # | What | Where |
|---|------|-------|
| 1 | Brand name **NEXORA** | header, footer, `<title>`, `og:` meta, inline SVG favicon |
| 2 | **hello@nexora.com** | CTA buttons (two `mailto:` links) and the footer contact list |
| 3 | **+966 50 XXX.XXXX** | footer contact list — kept as plain text, not a `tel:` link, because it is not a real number. The floating WhatsApp button points at `#cta` for the same reason; swap it for `https://wa.me/<full number>` |
| 4 | **Riyadh, Saudi Arabia** | footer contact list, and the dot on the little dotted world map |
| 5 | **© 2024** | footer bottom bar |
| 6 | Stats **100+ / 95%** | hero. Nothing in the CVs verifies these two, so they were left as-is. `8+ Countries Served` was changed to `5 Countries Delivered In` because the page contradicted itself — the leadership card below it lists the countries, and there are five. The number lives twice: in `data-count` (what the count-up animates to) and as the text inside the span (what shows with JS off). Change both |
| 7 | Social links | four `href="#"` in the footer |
| 8 | Client logos | the "Trusted by" row is still invented names. **Do not** move the product-section clients (Evosus, Jazz, Spacecubed, Kuju) up here — they are the CTO's former employers, not NEXORA clients, and claiming otherwise would be false. That row needs NEXORA's own clients |
| 9 | **5.0 · (40+ Reviews)** | CTA band |
| 10 | Nav items with no page yet | About Us and Insights point at the closest homepage section |
| 11 | Footer and dropdown links | anything still `href="#"` |
| 12 | The **six team cards** below the leadership card | names, roles and one-liners are all placeholders. The card above them is the only real person |

The six project images are real work, but they are heavily desaturated in CSS
(`.wcard-media img { filter: saturate(.72) brightness(.82) }`) so the original
bright brand colours do not fight the violet palette. Hovering releases the
filter. If you swap in your own screenshots, keep them 4:3 and around 800×600 —
anything larger is wasted, since the cards never render bigger than that.

## Editing

**Colours, spacing, radii, fonts** are all custom properties in the `:root`
block at the top of `styles.css`. Changing `--violet`, `--grad` and `--grad-text`
re-skins the entire page. The `[data-theme="light"]` block immediately below
overrides only the atmosphere tokens (backgrounds, text, glow, grain), so a new
accent colour is picked up by both themes automatically.

**Add a solution card**: copy an `<article class="sol t-cyan rv">` block in
`#solutions`. The `t-*` class picks the accent (`t-rose`, `t-violet`, `t-cyan`,
`t-blue`, `t-pink`, `t-green`, `t-amber`, `t-teal`); `rv` opts the card into the
scroll reveal and `data-d="1..5"` staggers it.

**Add a project**: copy an `<li class="wcard">` inside `#car-track`. Nothing is
hard-coded to six — the arrows, the dots and the keyboard handler all measure the
real cards, and the dots rebuild themselves on resize so their count always
matches the number of reachable scroll positions.

**Add a product**: copy an `<li class="pr t-cyan rv">` inside `#pr-grid`. Set
`data-k` to one of `mobile | enterprise | iot | games` so the filter picks it up,
name the client in `.pr-org`, and either give it a `.pr-links` row or a
`<p class="pr-none">` line saying why there is nothing to link to. To add a whole
new filter group, add a matching `<button class="pr-f" data-f="...">` to the bar —
the count line updates itself.

**The two filter bars** (highlights, products) are driven by one function,
`wireFilter(gridSel, cardSel, btnSel, countSel, noun)` at the bottom of
`main.js`. The button classes are deliberately different (`.hl-f` vs `.pr-f`)
even though they look identical, because each call queries its buttons by class
document-wide — share the class and one bar would drive both grids. The pill
styling is a shared `.hl-f,.pr-f` rule in the CSS.

**A gotcha worth knowing**: `.hl` and `.pr` both declare a `display`, which beats
the browser's built-in `[hidden] { display: none }`. Both therefore need an
explicit `.hl[hidden]`/`.pr[hidden]` rule or filtering silently does nothing.
Watch for this on any other flex or grid element you toggle with `hidden`.

**The lightbox** is one shared instance. A photo joins the gallery by carrying
`data-lb="<full-size src>"` plus `data-title` and `data-cap`. Adding
`data-lb-solo="true"` — as the DiDconn banner does — opens it on its own with no
prev/next arrows, so a one-off image does not land in the middle of the LEAP
gallery.

**The DiDconn band** (`#didconn`) is the one place on the page that leaves the
violet palette, because the product has its own blue/green brand. Those two
colours are scoped to `--b1` / `--b2` inside `.spot-band` and nowhere else, and
there is a `[data-theme="light"]` override beside it. Keep them scoped.

**Icons** are one inline `<symbol>` sprite near the top of `index.html`,
referenced as `<svg class="ic"><use href="#i-name"/></svg>`. Strokes inherit
`currentColor`; a few glyphs that are solid shapes set `fill="currentColor"
stroke="none"` on the path instead.

**Sections and the sticky nav**: a link joins the scrollspy by carrying
`data-spy`, and it highlights whichever section id its `href` names. Any new
`<section>` needs an `id` for that to work; `[id] { scroll-margin-top: 96px }`
already keeps anchor targets clear of the fixed header.

Accessibility and motion are wired in and worth not breaking: skip link, visible
`:focus-visible` rings, `aria-expanded` on the burger and the dropdown, Escape
and outside-click to close, and a `prefers-reduced-motion` block that disables
every transition, the reveals, the count-up and smooth scrolling.

## Deploying

Any static host works — there is nothing to compile.

**GitHub Pages**: push this folder as the repository root, then Settings →
Pages → deploy from branch `main`, folder `/ (root)`. Because every path in the
HTML is relative (`assets/...`, never `/assets/...`), it also works unchanged
from a project subpath like `username.github.io/nexora-website/`.

**Netlify / Cloudflare Pages / S3**: drag the folder in, or point the deploy at
it with no build command and the folder itself as the publish directory.

Before going live, add an `og:image` (1200×630) and set `og:url` to the real
domain — those are the two meta tags left out because they need a hosted URL.

## Notes on what is not here

You asked for the homepage done properly rather than a thin version of the whole
site, so the inner pages the nav gestures at (About Us, Insights, individual case
studies) do not exist yet. The markup is ready for them: a comment above the
carousel track marks where each card's `<a href="work/<slug>.html">` wrapper goes,
and the nav links only need their `href` changed.

The product cards have no cover art on purpose — an icon and a tech chip row are
honest, whereas invented screenshots for someone else's shipped app would not be.
If real screenshots turn up, `.pr` has room for a media block above `.pr-top`.
