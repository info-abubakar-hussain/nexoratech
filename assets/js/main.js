/* =============================================================
   NEXORA — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully:
   with JS off you still get the full page, just without the
   carousel arrows, theme switch and count-up.
   ============================================================= */
(function () {
  "use strict";

  var mq = window.matchMedia;
  var reduce = mq && mq("(prefers-reduced-motion:reduce)").matches;
  var isMobileNav = function () { return mq && mq("(max-width:1060px)").matches; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. header state, back-to-top, scrollspy ---------- */
  var hdr = $("#hdr");
  var toTop = $("#to-top");
  var spyLinks = $$(".nav-link[data-spy]");
  var spyTargets = spyLinks
    .map(function (a) { return { a: a, el: $(a.getAttribute("href")) }; })
    .filter(function (o) { return o.el; });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      if (hdr) hdr.classList.toggle("scrolled", y > 20);
      if (toTop) toTop.classList.toggle("show", y > 620);

      if (spyTargets.length) {
        var probe = y + 150;
        /* Pick the lowest section that has already passed the probe. Written as
           a max rather than "last one in the list" on purpose: the nav order
           and the document order are not the same (Insights sits above How We
           Work on the page but below it in the menu), so relying on the order
           of the links would highlight the wrong item. */
        var cur = null, best = -1;
        spyTargets.forEach(function (o) {
          var top = o.el.offsetTop;
          if (top <= probe && top > best) { best = top; cur = o; }
        });
        spyLinks.forEach(function (a) { a.classList.remove("active"); });
        if (cur) cur.a.classList.add("active");
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 2. mobile drawer ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  function setBurger(open) {
    if (!burger || !nav) return;
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    var use = burger.querySelector("use");
    if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  if (burger && nav) {
    burger.addEventListener("click", function () {
      setBurger(!nav.classList.contains("open"));
    });
    nav.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      /* the Solutions parent toggles its submenu on mobile instead of closing the drawer */
      if (a && a.id !== "drop-btn" && isMobileNav()) setBurger(false);
    });
  }

  /* ---------- 3. solutions dropdown ---------- */
  var dropItem = $("#drop-item");
  var dropBtn = $("#drop-btn");
  function setDrop(open) {
    if (!dropItem || !dropBtn) return;
    dropItem.classList.toggle("open", open);
    dropBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (dropItem && dropBtn) {
    dropBtn.addEventListener("click", function (e) {
      /* on mobile the label is a disclosure toggle; on desktop it still links to the section */
      if (isMobileNav()) {
        e.preventDefault();
        setDrop(!dropItem.classList.contains("open"));
      } else {
        setDrop(false);
      }
    });
    dropItem.addEventListener("mouseenter", function () { if (!isMobileNav()) setDrop(true); });
    dropItem.addEventListener("mouseleave", function () { if (!isMobileNav()) setDrop(false); });
    dropItem.addEventListener("focusin", function () { if (!isMobileNav()) setDrop(true); });
    dropItem.addEventListener("focusout", function (e) {
      if (!isMobileNav() && !dropItem.contains(e.relatedTarget)) setDrop(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setDrop(false);
        if (nav && nav.classList.contains("open")) { setBurger(false); burger.focus(); }
      }
    });
    document.addEventListener("click", function (e) {
      if (!isMobileNav() && !dropItem.contains(e.target)) setDrop(false);
    });
  }

  /* ---------- 4. theme ---------- */
  var themeBtn = $("#theme");
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function applyTheme(t) {
    if (t === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#F7F5FF" : "#07050F");
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
      themeBtn.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
    }
  }
  applyTheme(currentTheme());
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("nexora-theme", next); } catch (e) {}
    });
  }

  /* ---------- 5. reveal on scroll ---------- */
  var revs = $$(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    revs.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    revs.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- 6. stat count-up ---------- */
  var counters = $$("[data-count]");
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    if (reduce) { el.textContent = String(target); return; }
    var dur = 1200, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- 7. featured-work carousel ---------- */
  var track = $("#car-track");
  if (track) {
    var cards = $$(".wcard", track);
    var prev = $("#car-prev");
    var next = $("#car-next");
    var dotsBox = $("#dots");
    var index = 0;

    function cardStep() {
      if (cards.length < 2) return track.clientWidth;
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    function perView() {
      return Math.max(1, Math.round(track.clientWidth / cardStep()));
    }
    function maxIndex() {
      return Math.max(0, cards.length - perView());
    }
    function goTo(i, smooth) {
      i = Math.max(0, Math.min(i, maxIndex()));
      index = i;
      track.scrollTo({
        left: cards[i].offsetLeft - cards[0].offsetLeft,
        behavior: reduce || smooth === false ? "auto" : "smooth"
      });
      sync();
    }
    function readIndex() {
      var step = cardStep() || 1;
      return Math.round(track.scrollLeft / step);
    }
    /* One dot per reachable scroll position, not per card — three cards are
       visible at once on a wide screen, so six cards only make four stops.
       Rebuilt on resize because the number of stops changes with the layout. */
    function buildDots() {
      if (!dotsBox) return;
      var n = maxIndex() + 1;
      if (dotsBox.childElementCount === n) return;
      dotsBox.innerHTML = "";
      for (var i = 0; i < n; i++) {
        (function (i) {
          var b = document.createElement("button");
          var name = cards[i] && cards[i].querySelector("h3");
          b.type = "button";
          b.setAttribute("aria-label", name ? "Show " + name.textContent : "Go to slide " + (i + 1));
          b.addEventListener("click", function () { goTo(i); });
          dotsBox.appendChild(b);
        })(i);
      }
    }
    function sync() {
      var max = maxIndex();
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= max;
      if (dotsBox) {
        $$("button", dotsBox).forEach(function (d, i) {
          d.setAttribute("aria-current", i === index ? "true" : "false");
        });
      }
    }

    buildDots();
    if (prev) prev.addEventListener("click", function () { goTo(index - 1); });
    if (next) next.addEventListener("click", function () { goTo(index + 1); });

    var sTick = false;
    track.addEventListener("scroll", function () {
      if (sTick) return;
      sTick = true;
      requestAnimationFrame(function () {
        index = Math.max(0, Math.min(readIndex(), maxIndex()));
        sync();
        sTick = false;
      });
    }, { passive: true });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    });

    var rTimer;
    window.addEventListener("resize", function () {
      clearTimeout(rTimer);
      rTimer = setTimeout(function () {
        buildDots();
        index = Math.min(index, maxIndex());
        goTo(index, false);
      }, 160);
    });
    sync();
  }

  /* ---------- 8. lightbox ----------
     Shared by the highlights grid and by any standalone shot elsewhere on the
     page (the DiDconn banner). A shot marked data-lb-solo opens on its own with
     no prev/next, so the banner does not land in the middle of the LEAP gallery.
     Declared before the filter block because filtering changes which photos are
     reachable and has to re-collect them. */
  var lb = $("#lb");
  var lbImg = $("#lb-img");
  var lbCap = $("#lb-cap");
  var lbNum = $("#lb-n");
  var shots = [];
  var at = 0;
  var opener = null;
  var solo = false;

  /* every gallery photo currently on screen, in document order */
  function collectShots() {
    shots = $$("[data-lb]").filter(function (s) {
      return !s.closest("[hidden]") && !s.getAttribute("data-lb-solo");
    });
  }
  collectShots();

  function show(i) {
    if (!shots.length) return;
    at = (i + shots.length) % shots.length;   /* wraps both ways */
    var s = shots[at];
    var img = s.querySelector("img");
    lbImg.src = s.getAttribute("data-lb");
    lbImg.alt = img ? img.alt : "";
    lbCap.innerHTML = "<strong>" + (s.getAttribute("data-title") || "") + "</strong>" +
                      (s.getAttribute("data-cap") || "");
    lbNum.textContent = (at + 1) + " / " + shots.length;
  }
  function openLb(s) {
    solo = !!s.getAttribute("data-lb-solo");
    if (solo) shots = [s];
    else collectShots();
    var i = shots.indexOf(s);
    if (i < 0) return;
    opener = s;
    show(i);
    lb.classList.toggle("solo", solo);
    lb.removeAttribute("hidden");
    lb.classList.add("on");
    document.body.classList.add("lb-open");
    $("#lb-x").focus();
  }
  function closeLb() {
    lb.classList.remove("on", "solo");
    lb.setAttribute("hidden", "");
    document.body.classList.remove("lb-open");
    lbImg.src = "";
    /* send focus back where it came from, or a keyboard user is stranded at
       the top of the document */
    if (opener) { opener.focus(); opener = null; }
    if (solo) { solo = false; collectShots(); }
  }

  if (lb && lbImg) {
    /* one delegated listener for the whole document: it covers the highlights
       grid, the DiDconn banner, and anything added later */
    document.addEventListener("click", function (e) {
      var shot = e.target.closest ? e.target.closest("[data-lb],[data-video]") : null;
      if (!shot) return;
      if (shot.getAttribute("data-lb")) { openLb(shot); return; }

      /* ---------- 9. inline video ---------- */
      var src = shot.getAttribute("data-video");
      if (!src) return;
      var v = document.createElement("video");
      v.className = "hl-video";
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.setAttribute("playsinline", "");
      shot.innerHTML = "";
      shot.appendChild(v);
      shot.style.cursor = "default";
    });

    $("#lb-x").addEventListener("click", closeLb);
    $("#lb-prev").addEventListener("click", function () { show(at - 1); });
    $("#lb-next").addEventListener("click", function () { show(at + 1); });
    lb.addEventListener("click", function (e) {
      /* backdrop only: a click that lands on the figure or a button is not a dismissal */
      if (e.target === lb) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("on")) return;
      if (e.key === "Escape") closeLb();
      if (solo) return;
      if (e.key === "ArrowRight") show(at + 1);
      if (e.key === "ArrowLeft") show(at - 1);
    });
  }

  /* ---------- 10. card filters ----------
     Used twice on the page (highlights, products) so it is written once and
     scoped to a grid. A card joins a group through data-k; a button selects
     one through data-f. */
  function wireFilter(gridSel, cardSel, btnSel, countSel, noun) {
    var grid = $(gridSel);
    if (!grid) return;
    var cards = $$(cardSel, grid);
    var btns = $$(btnSel);
    var out = $(countSel);

    function apply(kind) {
      var shown = 0;
      cards.forEach(function (c) {
        var match = kind === "all" || c.getAttribute("data-k") === kind;
        /* hidden rather than a class: it takes the card out of the grid flow and
           out of the tab order in one attribute, and needs no JS to undo */
        if (match) { c.removeAttribute("hidden"); shown++; }
        else c.setAttribute("hidden", "");
      });
      btns.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-f") === kind ? "true" : "false");
      });
      if (out) {
        var label = btns.filter(function (b) { return b.getAttribute("data-f") === kind; })[0];
        out.textContent = kind === "all"
          ? "Showing all " + shown + (noun ? " " + noun : "")
          : "Showing " + shown + " in " + (label ? label.textContent : kind);
      }
      /* the photo set changes with the filter, so the lightbox order must too */
      collectShots();
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-f")); });
    });
  }

  wireFilter("#hl-grid", ".hl", ".hl-f", "#hl-count", "");
  wireFilter("#pr-grid", ".pr", ".pr-f", "#pr-count", "products");
})();
