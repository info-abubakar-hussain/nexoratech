/* =============================================================
   CodemityTech — interactions
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
      try { localStorage.setItem("codemity-theme", next); } catch (e) { }
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

  /* ---------- 6. stat count-up & hero interactions ---------- */
  var counters = $$("[data-count]");
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "true";
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    if (reduce) { el.textContent = String(target); return; }
    var dur = 1400, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }

  // Count up hero stats right when hero entrance plays
  setTimeout(function () {
    $$(".hero .stat [data-count]").forEach(function (el) {
      countUp(el);
    });
  }, 700);

  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- 7. carousel engine (featured work & team slider) ---------- */
  function wireCarousel(trackSel, cardSel, prevSel, nextSel, dotsSel, autoplaySeconds) {
    var track = $(trackSel);
    if (!track) return;
    var cards = $$(cardSel, track);
    var prev = $(prevSel);
    var next = $(nextSel);
    var dotsBox = $(dotsSel);
    var index = 0;
    var autoplayMs = typeof autoplaySeconds === "number" ? autoplaySeconds * 1000 : 0;
    var autoplayId = null;

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
    function stopAutoplay() {
      if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
      }
    }
    function startAutoplay() {
      if (!autoplayMs || reduce || !cards.length || cards.length < 2) return;
      stopAutoplay();
      autoplayId = setInterval(function () {
        var nextIndex = index >= maxIndex() ? 0 : index + 1;
        goTo(nextIndex, true);
      }, autoplayMs);
    }
    function goTo(i, smooth) {
      i = Math.max(0, Math.min(i, maxIndex()));
      index = i;
      track.scrollLeft = cards[i].offsetLeft - cards[0].offsetLeft;
      sync();
    }
    function readIndex() {
      var step = cardStep() || 1;
      return Math.round(track.scrollLeft / step);
    }
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
          b.addEventListener("click", function () { goTo(i); startAutoplay(); });
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
    if (prev) prev.addEventListener("click", function () { goTo(index - 1); startAutoplay(); });
    if (next) next.addEventListener("click", function () { goTo(index + 1); startAutoplay(); });
    track.addEventListener("mouseenter", stopAutoplay);
    track.addEventListener("mouseleave", startAutoplay);
    track.addEventListener("focusin", stopAutoplay);
    track.addEventListener("focusout", startAutoplay);

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
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); startAutoplay(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); startAutoplay(); }
    });

    var rTimer;
    window.addEventListener("resize", function () {
      clearTimeout(rTimer);
      rTimer = setTimeout(function () {
        buildDots();
        index = Math.min(index, maxIndex());
        goTo(index, false);
        startAutoplay();
      }, 160);
    });
    sync();
    startAutoplay();
  }

  wireCarousel("#car-track", ".wcard", "#car-prev", "#car-next", "#dots", 3.5);
  wireCarousel("#team-track", ".team-card", "#team-prev", "#team-next", "#team-dots");

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

  /* ---------- 11. team profile modal (rich resume data) ---------- */
  var teamData = {
    nouman: {
      name: "Nouman Hanif",
      role: "Co-founder & Chief Technology Officer",
      tag: "Executive Leadership",
      color: "#22D3EE",
      badgeIcon: "#i-layers",
      photo: "assets/img/team/nouman-hanif.jpg",
      quickStats: ["18+ Years Experience", "MSc Dundee University", "Ex-Evosus & Kuju"],
      bio: "Eighteen years in software engineering, starting in console video games and advancing into enterprise mobile and cloud architectures. At Evosus, he established the mobile division from scratch, introduced Flutter and Dart as the enterprise standard, and authored Clean Architecture guidelines reused across multiple company applications. Specializes in on-device AI/ML, offline-first synchronization, high-performance rendering math, and complex IoT/hardware integrations.",
      skills: [
        {
          category: "Languages & Frameworks",
          items: ["Flutter", "Dart", "C++", "C#", ".NET", "Python", "TypeScript"]
        },
        {
          category: "Architecture & Core",
          items: ["Clean Architecture", "BLoC & Riverpod", "Offline Sync", "Real-time Graphics", "Microservices"]
        },
        {
          category: "Cloud, AI & Storage",
          items: ["Machine Learning", "Firebase", "Realm & SQLite", "IoT Protocols", "Docker & CI/CD"]
        }
      ],
      experience: [
        {
          title: "Co-founder & Chief Technology Officer",
          company: "CodemityTech",
          date: "Present",
          desc: "Directs technical vision, engineering standards, architecture frameworks, and product innovation across AI, blockchain, and enterprise mobile solutions."
        },
        {
          title: "Lead Mobile Architect / Division Head",
          company: "Evosus",
          date: "Previous",
          desc: "Built the mobile division from scratch, established the shared Flutter package ecosystem, and reduced multi-platform engineering pipelines by 2x."
        },
        {
          title: "Senior Real-time Software Engineer",
          company: "Kuju Games",
          date: "Previous",
          desc: "Engineered real-time 3D camera mechanics, graphics rendering algorithms, and mathematical simulation systems for console titles."
        }
      ],
      projects: [
        {
          name: "DiDconn Digital Identity Platform",
          desc: "Decentralized digital identity ecosystem with biometric authentication, OCR verification, and blockchain wallet security.",
          chips: ["AI", "Blockchain", "Flutter", ".NET"]
        },
        {
          name: "Enterprise Offline Sync Engine",
          desc: "Ultra-resilient bidirectional data synchronization library for distributed field operations apps with zero connectivity.",
          chips: ["Flutter", "SQLite", "Clean Arch"]
        }
      ],
      education: [
        {
          degree: "MSc in Computer Games Technology",
          school: "University of Abertay Dundee, Scotland"
        },
        {
          degree: "BSc Computer Science",
          school: "Hajvery University"
        },
        {
          degree: "Autonomous Flight Engineer Nanodegree",
          school: "Udacity Certification"
        },
        {
          degree: "Open AR Cloud Council Member & Journal Editorial Board",
          school: "The Computer Games Journal (Springer 2014–20)"
        }
      ]
    },

    abubakar: {
      name: "AbuBakar Hussain",
      role: "Co-founder, Solution Architect & Mobile App Developer",
      tag: "Founding Leadership",
      color: "#8B5CF6",
      badgeIcon: "#i-layers",
      photo: "assets/img/team/abubakar-hussain.jpg",
      quickStats: ["Solution Architecture", "Mobile App Development", "Cloud & Delivery"],
      bio: "Founding leader and solution architect focused on product strategy, mobile app delivery, and scalable system design. He brings together architecture planning, engineering leadership, and app development execution to keep product roadmaps practical and production-ready.",
      skills: [
        {
          category: "Architecture & Leadership",
          items: ["Enterprise Solution Architecture", "Mobile Product Strategy", "System Design", "Technical Leadership"]
        },
        {
          category: "Technologies & Delivery",
          items: ["Flutter Apps", "Cloud Native Systems", "REST APIs", "Scalable Delivery", "Agile Execution"]
        }
      ],
      experience: [
        {
          title: "Founder, Solution Architect & Mobile App Developer",
          company: "CodemityTech",
          date: "Present",
          desc: "Leads product architecture, solution design, and mobile engineering execution for client products and internal platforms."
        }
      ],
      projects: [
        {
          name: "DiDconn, CareCircle & Enterprise Mobile Platforms",
          desc: "Designed and guided the technical architecture for secure digital identity and connected care products across mobile-first customer journeys.",
          chips: ["Architecture", "Mobile", "Product Strategy"]
        }
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science & Systems",
          school: "Engineering & Technology Leadership"
        }
      ]
    },

    mudassar: {
      name: "Mudassar Irshad",
      role: "Co-founder | Senior .NET Developer",
      tag: "Engineering Lead",
      color: "#3B82F6",
      badgeIcon: "#i-building",
      photo: "assets/img/team/mudassar-irshad.jpg",
      quickStats: ["Co-founder", "5+ Years Experience", "Senior .NET Developer"],
      bio: "Co-founder and experienced .NET developer focused on robust backend systems, enterprise APIs, and modern application architecture. Brings strong implementation discipline with SQL, ASP.NET Core, and service-driven architecture, helping teams deliver maintainable and secure business applications.",
      skills: [
        {
          category: "Languages & Frameworks",
          items: ["C#", ".NET Core", "ASP.NET Core", "Entity Framework Core", "REST APIs"]
        },
        {
          category: "Frontend Development",
          items: ["React.js", "Angular", "TypeScript", "Tailwind CSS", "HTML5/CSS3"]
        },
        {
          category: "Databases & Architecture",
          items: ["SQL Server", "PostgreSQL", "MongoDB", "SOLID / DRY", "Role-Based Access (RBAC)"]
        },
        {
          category: "DevOps & Security",
          items: ["Docker", "Git CI/CD", "JWT & 2FA", "xUnit Testing", "Secure API Design"]
        }
      ],
      experience: [
        {
          title: "Senior .NET Developer",
          company: "Swati Corporation",
          date: "April 2024 – Present",
          desc: "Builds secure enterprise systems and backend services for digital workflows, document handling, and role-based access management."
        },
        {
          title: "Full Stack .NET and React Developer",
          company: "ItTrends",
          date: "January 2022 – March 2024",
          desc: "Developed secure web applications and integrated external systems for client operations and finance workflows."
        },
        {
          title: "Full Stack .NET / Angular Developer",
          company: "Nixaam",
          date: "March 2022 – January 2023",
          desc: "Built maintainable ASP.NET Core APIs and optimized database-driven operations with complex relationships."
        }
      ],
      projects: [
        {
          name: "Multi-NGO Secure Platform",
          desc: "Delivered secure, multi-tenant enterprise workflows for registration and document management with role-based access control.",
          chips: [".NET Core", "React", "PostgreSQL", "Docker"]
        },
        {
          name: "Client & Task Management System",
          desc: "Built enterprise onboarding and workflow tooling with strong API security and system reliability.",
          chips: ["ASP.NET Core", "React", "JWT / 2FA", "SQL Server"]
        }
      ],
      education: [
        {
          degree: "Bachelor of Computer System Engineering",
          school: "The Islamia University of Bahawalpur (2021)"
        }
      ]
    },

    sarfraz: {
      name: "Sarfraz Ahmad",
      role: "Co-founder | Senior Flutter Developer",
      tag: "Mobile Engineering",
      color: "#F59E0B",
      badgeIcon: "#i-mobile",
      photo: "assets/img/team/sarfraz-ahmad.jpg",
      quickStats: ["Co-founder", "5+ Years Experience", "Flutter & Cross-Platform"],
      bio: "Co-founder and Senior Flutter developer with 5+ years of experience building cross-platform mobile apps for production-grade products. Worked on DiDconn, CareCircle, and the DiDconn Admin app, delivering polished user experiences, clean architecture, and reliable product execution for business-critical mobile systems.",
      skills: [
        {
          category: "Mobile Development",
          items: ["Flutter", "Dart", "State Management", "Cross-Platform App Design", "Mobile UI Architecture"]
        },
        {
          category: "Product Delivery",
          items: ["DiDconn", "CareCircle", "DiDconn Admin App", "Production Mobile Apps", "API Integration"]
        }
      ],
      experience: [
        {
          title: "Senior Flutter Developer",
          company: "Swati Technologies",
          date: "Present",
          desc: "Develops and maintains cross-platform applications for business-critical mobile products, with a focus on product quality, UX polish, and reliable release delivery."
        }
      ],
      projects: [
        {
          name: "DiDconn",
          desc: "Built a digital identity platform experience with secure onboarding and efficient client workflows.",
          chips: ["Flutter", "Mobile", "UX"]
        },
        {
          name: "CareCircle",
          desc: "Developed a connected user experience focused on care coordination and service interaction flows.",
          chips: ["Flutter", "Healthcare", "Product App"]
        },
        {
          name: "DiDconn Admin App",
          desc: "Delivered admin-side tooling to support operational management for the main DiDconn platform.",
          chips: ["Flutter", "Admin Tooling", "Operations"]
        }
      ],
      education: [
        {
          degree: "Computer Science / Software Engineering",
          school: "Professional Experience"
        }
      ]
    },

    zia: {
      name: "Zia Ur Rehman",
      role: "Senior UI/UX Designer",
      tag: "Design Lead",
      color: "#EC4899",
      badgeIcon: "#i-brush",
      photo: "assets/img/team/zia-ur-rehman.jpg",
      quickStats: ["6+ Years Experience", "BS Computer Science", "Enterprise Design Systems"],
      bio: "Accomplished Senior UI/UX Designer bringing a blend of technical computer science background and design creativity. Specializes in end-to-end user experience strategy, comprehensive design systems, user persona mapping, and responsive multi-platform interfaces for enterprise dashboards and consumer mobile apps.",
      skills: [
        {
          category: "UI/UX & Product Design",
          items: ["User Interface (UI) Design", "UX Research", "Wireframing & Prototyping", "Design Systems & Component Libraries"]
        },
        {
          category: "Strategy & Usability",
          items: ["Interaction Design (IxD)", "Information Architecture", "WCAG Accessibility", "Usability Testing & A/B Testing", "Mobile-First Design"]
        },
        {
          category: "Design Tools",
          items: ["Figma", "Adobe XD", "Adobe Photoshop", "Adobe Illustrator", "Design Tokens", "Agile/Scrum"]
        }
      ],
      experience: [
        {
          title: "Senior UI/UX Designer",
          company: "Swati Technologies",
          date: "July 2022 – Present",
          desc: "Leads UI/UX design for web and mobile products, oversees design systems, conducts user research and usability testing, and translates complex AI insights into intuitive dashboards."
        },
        {
          title: "User Experience Designer",
          company: "HighApp Solutions",
          date: "April 2021 – July 2022",
          desc: "Designed cross-platform mobile application flows in Adobe XD and Figma with focus on aesthetic UI and frictionless onboarding."
        },
        {
          title: "UI/UX Designer",
          company: "My Technology & Siteronics",
          date: "2018 – 2021",
          desc: "Created journey maps, wireframes, high-fidelity prototypes, and brand graphic assets for global clients."
        }
      ],
      projects: [
        {
          name: "Attendify — Geolocation & Facial Attendance",
          desc: "Location-aware employee check-in interface with biometric facial recognition user flows and cross-platform dashboards.",
          chips: ["UI/UX", "Figma", "Design System", "Mobile"]
        },
        {
          name: "SecurEye — AI Surveillance & Anomaly Dashboard",
          desc: "Real-time video surveillance and threat detection interface translating complex computer vision alerts into actionable UI.",
          chips: ["Dashboard", "AI-UI", "UX Research", "Figma"]
        },
        {
          name: "SERP — Enterprise Operations Platform",
          desc: "Complete enterprise ERP interface for finance, purchasing, warehouse inventory, and workforce resource planning.",
          chips: ["ERP", "Enterprise UX", "Design System"]
        }
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science (BS CS)",
          school: "The University of Lahore (2014–18)"
        }
      ]
    },

    faisal: {
      name: "Faisal Akram",
      role: "Associate UI/UX Designer",
      tag: "UI/UX Specialist",
      color: "#14B8A6",
      badgeIcon: "#i-brush",
      photo: "assets/img/team/faisal-akram.jpg",
      quickStats: ["4+ Years Experience", "BS Computer Science", "Prototyping & Visual Design"],
      bio: "Skilled Graphic and UI/UX Designer with a Computer Science degree, bringing structured design thinking to web and mobile products. Excels in rapid wireframing, high-fidelity interactive prototyping, user journey mapping, and visual design systems that elevate product conversion and usability.",
      skills: [
        {
          category: "Design & UX Architecture",
          items: ["UI Design", "Wireframing & Prototyping", "User Research", "User Personas & Journey Maps", "Interaction Design"]
        },
        {
          category: "Tools & Technologies",
          items: ["Figma", "Adobe Illustrator", "Adobe Photoshop", "InDesign", "CorelDraw", "Vector Graphics", "AI-Assisted Design"]
        }
      ],
      experience: [
        {
          title: "Associate UI/UX Designer",
          company: "Swati Technologies",
          date: "August 2023 – Present",
          desc: "Designs web and mobile interfaces, creates interactive prototypes in Figma, facilitates user testing, and collaborates closely with engineers on pixel-perfect frontend delivery."
        },
        {
          title: "Graphic & Digital Designer",
          company: "InstaPrint DHA",
          date: "June 2021 – July 2023",
          desc: "Revamped visual branding and digital templates resulting in a 30% boost in engagement, adhering to tight turnaround schedules."
        }
      ],
      projects: [
        {
          name: "Truwild — Personalized E-Commerce",
          desc: "Fitness and nutrition shopping interface featuring user-profile recommendation funnels and frictionless checkout.",
          chips: ["Figma", "E-Commerce", "UX Design"]
        },
        {
          name: "GoldDigits — SIM Marketplace Mobile App",
          desc: "Mobile application interface enabling rapid discovery and purchasing of premium numbers with custom filters.",
          chips: ["Mobile UI", "App Design", "Figma"]
        }
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science (BS CS)",
          school: "Lahore Garrison University (2019–23)"
        }
      ]
    },

    rauf: {
      name: "Abdul Rauf",
      role: "AI & Software Engineer",
      tag: "Software Specialist",
      color: "#F43F5E",
      badgeIcon: "#i-ai",
      photo: "assets/img/team/abdul-rauf.jpg",
      quickStats: ["Computer Science (AI)", "GPA 3.78", "C++, C# & OOP Architecture"],
      bio: "Dedicated Computer Science (AI) engineer with solid core competencies in C++, C#, Object-Oriented Programming (OOP), and MySQL databases. Experienced in developing standalone desktop systems, database-driven applications, and applying AI/machine learning problem-solving to real-world software.",
      skills: [
        {
          category: "Programming Languages",
          items: ["C++", "C#", "Object-Oriented Programming (OOP)", "SQL Queries", "Data Structures"]
        },
        {
          category: "Databases & Tools",
          items: ["MySQL", "MySQL Workbench", "Visual Studio", "Database Design", "Debugging & Optimization"]
        },
        {
          category: "Domains & Intelligence",
          items: ["Artificial Intelligence", "Machine Learning Fundamentals", "Desktop Windows Forms", "WordPress Technical Setup"]
        }
      ],
      experience: [
        {
          title: "Software & AI Engineer",
          company: "CodemityTech",
          date: "Present",
          desc: "Develops core desktop modules, database schemas, and AI integrations using clean OOP design patterns and optimized query architecture."
        },
        {
          title: "Technical Assistant (Freelance)",
          company: "Self Employed",
          date: "November 2020 – Present",
          desc: "Assisted international clients with website maintenance, database troubleshooting, custom plugin configuration, and project coordination."
        }
      ],
      projects: [
        {
          name: "Enterprise Banking Core System",
          desc: "C# and MySQL banking application featuring account creation, transaction auditing, and clean OOP inheritance and encapsulation.",
          chips: ["C#", "MySQL", "OOP", "Windows Forms"]
        },
        {
          name: "Point of Sale (POS) Management System",
          desc: "Comprehensive POS application with inventory tracking, automated billing, product catalog database, and authenticated staff login.",
          chips: ["C#", "SQL Server", "Inventory", "POS"]
        },
        {
          name: "Desktop Scientific & Business Calculator",
          desc: "Robust Windows Forms calculator with arithmetic exception handling and modular architectural separation.",
          chips: ["C#", ".NET", "OOP"]
        }
      ],
      education: [
        {
          degree: "Bachelors of Computer Science (Artificial Intelligence)",
          school: "Lincoln University College, Malaysia (2024 – Present, GPA: 3.78)"
        },
        {
          degree: "Diploma of Associate Engineer",
          school: "Government College of Technology, Sahiwal (2020 – 2023)"
        }
      ]
    }
  };

  var pmodal = $("#pmodal");
  var pmPhoto = $("#pm-photo");
  var pmBadgeUse = $("#pm-badge-use");
  var pmTag = $("#pm-tag");
  var pmName = $("#pm-name");
  var pmRole = $("#pm-role");
  var pmQuickStats = $("#pm-quick-stats");
  var pmBio = $("#pm-bio");
  var pmSkills = $("#pm-skills");
  var pmExperience = $("#pm-experience");
  var pmProjects = $("#pm-projects");
  var pmEducation = $("#pm-education");
  var pmClose = $("#pmodal-close");
  var pmOverlay = $("#pmodal-overlay");
  var pmCta = $("#pm-cta");
  var lastActiveTrigger = null;

  function renderProfile(key) {
    var d = teamData[key];
    if (!d) return;

    if (pmodal) pmodal.style.setProperty("--c", d.color || "#8B5CF6");
    if (pmPhoto) { pmPhoto.src = d.photo || ""; pmPhoto.alt = d.name; }
    if (pmBadgeUse) pmBadgeUse.setAttribute("href", d.badgeIcon || "#i-layers");
    if (pmTag) pmTag.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-award"/></svg><span>' + (d.tag || "Team Specialist") + '</span>';
    if (pmName) pmName.textContent = d.name;
    if (pmRole) pmRole.textContent = d.role;

    if (pmQuickStats) {
      pmQuickStats.innerHTML = (d.quickStats || []).map(function (st) {
        return '<span class="pmodal-stat-pill">' + st + '</span>';
      }).join("");
    }

    if (pmBio) pmBio.textContent = d.bio || "";

    if (pmSkills) {
      pmSkills.innerHTML = (d.skills || []).map(function (grp) {
        var chips = (grp.items || []).map(function (it) {
          return '<span class="pmodal-chip">' + it + '</span>';
        }).join("");
        return '<div class="pmodal-skill-group">' +
          '<h4>' + grp.category + '</h4>' +
          '<div class="pmodal-skill-chips">' + chips + '</div>' +
          '</div>';
      }).join("");
    }

    if (pmExperience) {
      pmExperience.innerHTML = (d.experience || []).map(function (xp) {
        return '<div class="pmodal-exp-item">' +
          '<div class="pmodal-exp-head">' +
          '<span class="pmodal-exp-title">' + xp.title + '</span>' +
          '<span class="pmodal-exp-date">' + xp.date + '</span>' +
          '</div>' +
          '<div class="pmodal-exp-company">' + xp.company + '</div>' +
          '<p class="pmodal-exp-desc">' + xp.desc + '</p>' +
          '</div>';
      }).join("");
    }

    if (pmProjects) {
      pmProjects.innerHTML = (d.projects || []).map(function (pj) {
        var chips = (pj.chips || []).map(function (c) {
          return '<span class="chip-t">' + c + '</span>';
        }).join("");
        return '<div class="pmodal-proj">' +
          '<h4>' + pj.name + '</h4>' +
          '<p>' + pj.desc + '</p>' +
          '<div class="chips">' + chips + '</div>' +
          '</div>';
      }).join("");
    }

    if (pmEducation) {
      pmEducation.innerHTML = (d.education || []).map(function (ed) {
        return '<li class="pmodal-edu-item">' +
          '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-file"/></svg>' +
          '<div class="pmodal-edu-info">' +
          '<strong>' + ed.degree + '</strong>' +
          '<span>' + ed.school + '</span>' +
          '</div>' +
          '</li>';
      }).join("");
    }
  }

  function openProfile(key, triggerEl) {
    if (!teamData[key]) return;
    lastActiveTrigger = triggerEl;
    renderProfile(key);
    if (pmodal) {
      pmodal.removeAttribute("hidden");
      pmodal.classList.add("on");
      document.body.classList.add("pmodal-open");
      if (pmClose) pmClose.focus();
    }
  }

  function closeProfile() {
    if (!pmodal) return;
    pmodal.classList.remove("on");
    pmodal.setAttribute("hidden", "");
    document.body.classList.remove("pmodal-open");
    if (lastActiveTrigger) {
      try { lastActiveTrigger.focus(); } catch (e) { }
      lastActiveTrigger = null;
    }
  }

  /* Delegated click & keyboard handlers for team profile triggers */
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest ? e.target.closest(".pmodal-card-trigger") : null;
    if (trigger) {
      var memberKey = trigger.getAttribute("data-member");
      if (memberKey) {
        openProfile(memberKey, trigger);
        return;
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("pmodal-card-trigger")) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var memberKey = e.target.getAttribute("data-member");
        if (memberKey) openProfile(memberKey, e.target);
      }
    }

    if (pmodal && pmodal.classList.contains("on")) {
      if (e.key === "Escape") closeProfile();
    }
  });

  if (pmClose) pmClose.addEventListener("click", closeProfile);
  if (pmOverlay) pmOverlay.addEventListener("click", closeProfile);
  if (pmCta) {
    pmCta.addEventListener("click", function () {
      closeProfile();
    });
  }

  /* ---------- 12. project brief — opens a prefilled mailto ---------- */
  var brief = $("#brief");
  var briefOk = $("#brief-ok");
  if (brief) {
    brief.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = ($("#brief-name") || {}).value || "";
      var email = ($("#brief-email") || {}).value || "";
      var company = ($("#brief-company") || {}).value || "";
      var need = ($("#brief-need") || {}).value || "";
      var message = ($("#brief-message") || {}).value || "";
      var body = [
        "Name: " + name,
        "Email: " + email,
        "Company: " + company,
        "Need: " + need,
        "",
        message
      ].join("\n");
      window.location.href = "mailto:info@codemitytech.com?subject=" +
        encodeURIComponent("Project brief — " + (need || "CodemityTech")) +
        "&body=" + encodeURIComponent(body);
      if (briefOk) briefOk.removeAttribute("hidden");
    });
  }
})();
