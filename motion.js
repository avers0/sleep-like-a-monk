/* motion.js — GSAP + Lenis layer for the ClearPath-style build.
   Additive: app.js still runs (masthead .stuck fallback, widgets, minicta).
   Everything here is gated on prefers-reduced-motion and on GSAP loading;
   without it the page is a clean stack of static full-bleed panels. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = window.gsap && window.ScrollTrigger;

  /* draw every swoop immediately when we can't scrub it */
  function drawAllSwoops() {
    document.querySelectorAll(".swoop path").forEach(function (p) {
      p.style.strokeDashoffset = "0";
    });
  }

  if (!hasGSAP || reduce) {
    drawAllSwoops();
    return;
  }

  window.__motion = 1;
  document.documentElement.classList.add("gsap-live");
  gsap.registerPlugin(ScrollTrigger);

  /* ---- Lenis smooth scroll feeding ScrollTrigger ---- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -60 });
      });
    });
  }

  /* ---- glass masthead: .stuck past the hero, .on-dark over dark panels ---- */
  var mast = document.querySelector(".masthead");
  if (mast) {
    var firstPanel = document.querySelector("main .panel");
    ScrollTrigger.create({
      trigger: firstPanel || document.body,
      start: "bottom top+=62", end: "max",
      onToggle: function (self) { mast.classList.toggle("stuck", self.isActive); }
    });
    document.querySelectorAll("[data-dark]").forEach(function (p) {
      ScrollTrigger.create({
        trigger: p, start: "top top+=54", end: "bottom top+=54",
        onToggle: function (self) { mast.classList.toggle("on-dark", self.isActive); }
      });
    });
  }

  /* ---- grey -> colour: --chroma 0 at the top, 1 by the Two Hours ---- */
  var root = document.documentElement;
  root.style.setProperty("--chroma", "0");
  var chromaTrigger = document.querySelector("#two-hours") || document.body;
  gsap.to(root, {
    "--chroma": 1, ease: "none",
    scrollTrigger: { trigger: chromaTrigger, start: "top bottom", end: "top 45%", scrub: true }
  });

  /* ---- reveals: one trigger each so anything already above the fold on
     load or after a reflow still gets revealed (batch missed those) ---- */
  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    el.classList.add("cp");
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () { el.classList.add("in"); }
    });
  });
  // hard safety net: after everything settles, reveal anything still hidden but on screen
  window.addEventListener("load", function () {
    setTimeout(function () {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) el.classList.add("in");
      });
    }, 200);
  });

  /* ---- counters ---- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var obj = { v: 0 }, suffix = /\+$/.test(el.textContent) ? "+" : "";
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: 1.2, ease: "power3.out",
          onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  /* ---- parallax on panel backgrounds. Bg travels at roughly a third of
     the panel's own scroll distance (ClearPath-style lag), same direction
     as scroll. Scale > the travel so a shifted bg never exposes the
     panel's dark fill at an edge. ---- */
  document.querySelectorAll("[data-parallax]").forEach(function (bg) {
    gsap.fromTo(bg, { yPercent: -18, scale: 1.5 }, {
      yPercent: 18, scale: 1.5, ease: "none",
      scrollTrigger: { trigger: bg.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---- story photo parallax: the founder portrait drifts slower than
     the text beside it as the page scrolls, same lag as the panel bgs. ---- */
  document.querySelectorAll("[data-parallax-img]").forEach(function (img) {
    var card = img.closest(".story__media") || img;
    gsap.fromTo(card, { yPercent: -10 }, {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---- curtain reveal: the CLOSE panel pins in place while the CONTACT
     band that follows it keeps scrolling at normal speed and slides up
     over it, covering it like a sheet drawn over the previous panel.
     pinSpacing:false means no gap is reserved — the next section's own
     normal-flow scroll is what does the covering. ---- */
  (function () {
    var closeHeading = document.getElementById("s-close");
    var closePanel = closeHeading && closeHeading.closest("section");
    if (!closePanel) return;
    ScrollTrigger.create({
      trigger: closePanel, start: "top top",
      end: "+=100%", pin: true, pinSpacing: false,
      // this removes the panel's height from the doc flow while pinned —
      // every trigger below it needs to recompute against that shift, so
      // (like the pinned arc section above) it must refresh first.
      refreshPriority: 10, invalidateOnRefresh: true
    });
  })();

  /* ---- the swoop spine: two braided threads. A strong lead, and a
     lighter trail — offset, twisted, and drawn on a lag so it winds
     around the lead down the page rather than moving with it. Both are
     scrubbed, so they retract as you scroll back up. ---- */
  document.querySelectorAll(".swoop").forEach(function (svg) {
    var lead = svg.querySelector("path");
    if (!lead) return;
    lead.classList.add("swoop__lead");

    // trailing thread: cloned from the lead, nudged a touch and drawn on
    // a lag so it braids lightly alongside without winding around it
    var trail = lead.cloneNode(true);
    trail.classList.remove("swoop__lead");
    trail.classList.add("swoop__trail");
    trail.setAttribute("transform", "translate(22 30) rotate(1.6 720 450)");
    lead.after(trail);

    // draw starts as the panel enters and FINISHES at ~75% of the way
    // through (lead) / ~85% (trail), so the thread lands its endpoint
    // before the panel leaves; retracts the same way on the way back up
    var section = svg.closest("section") || svg.parentElement;
    function endAt(frac) {
      return function () {
        return "+=" + Math.round((section.offsetHeight + window.innerHeight) * frac);
      };
    }
    [[lead, "top bottom", endAt(0.85), 0.4], [trail, "top bottom", endAt(0.95), 1.1]]
      .forEach(function (cfg) {
        var p = cfg[0], L = p.getTotalLength();
        p.style.setProperty("--len", L);
        p.style.strokeDasharray = L;
        p.style.strokeDashoffset = L;
        gsap.to(p, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: {
            trigger: section, start: cfg[1], end: cfg[2], scrub: cfg[3],
            invalidateOnRefresh: true
          }
        });
      });
  });

  /* ---- particle footer: slow drifting field on a 2d canvas ---- */
  (function () {
    var cv = document.querySelector("[data-particles]");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var host = cv.parentElement, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [], W = 0, H = 0, raf = 0, visible = false;

    function size() {
      W = host.clientWidth; H = host.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((W * H) / 14000);
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.6 + 0.4,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -(Math.random() * 0.22 + 0.05),
          a: Math.random() * 0.5 + 0.15
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = "rgba(127,180,214," + p.a + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) frame(); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    size();
    window.addEventListener("resize", size, { passive: true });
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) start(); else stop();
    }, { rootMargin: "120px" }).observe(host);
  })();

  /* ============================================================
     RELAX LIKE A MONK — scrollytelling. All blocks no-op when their
     elements are absent, so this is safe on every page.
     ============================================================ */

  /* --- staggered groups walk in (with the same above-the-fold safety net) --- */
  document.querySelectorAll("[data-stagger]").forEach(function (grp) {
    gsap.set(grp.children, { opacity: 0, y: 22 });
    gsap.to(grp.children, {
      opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: grp, start: "top 88%", once: true }
    });
  });
  window.addEventListener("load", function () {
    setTimeout(function () {
      document.querySelectorAll("[data-stagger]").forEach(function (grp) {
        if (grp.getBoundingClientRect().top < window.innerHeight * 1.1) {
          gsap.to(grp.children, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 });
        }
      });
    }, 250);
  });

  /* --- the arc: pinned, scroll-scrubbed through the two hours --- */
  (function () {
    var wrap = document.querySelector("[data-arc-scrolly]");
    if (!wrap) return;
    var pin = wrap.querySelector(".scrolly__pin");
    var fig = wrap.querySelector("[data-arc]");
    var path = fig.querySelector(".curve");
    var marker = fig.querySelector(".marker");
    var now = fig.querySelector(".arc__now");
    var len = path.getTotalLength();
    var isSleep = /sleep/i.test(document.title);
    var beats = [
      ["0:00", "You arrive. Phones down, nothing to solve yet."],
      ["0:15", "You learn to calm the mind on demand: a single move you can make anywhere."],
      ["0:30", "You rehearse it against a hard moment: a demanding client, a deadline, bad news."],
      ["0:45", "Again, and again, until the response is automatic rather than effortful."],
      ["1:00", "Part two begins. You lie back. Nothing is required of you now."],
      ["1:15", "Tension leaves the body one region at a time: jaw, shoulders, chest, hands."],
      ["1:30", "The mind goes quiet. Thoughts arrive slower, and matter less."],
      ["1:45", isSleep ? "The relaxation carries all the way down into deep sleep." : "Deep rest, the kind the body only reaches when it feels safe."],
      ["2:00", "You return: calm, clear, unhurried. Most people cannot remember the last time they felt it."]
    ];
    var cur = -1;
    function render(p) {
      p = Math.max(0, Math.min(1, p));
      path.style.strokeDashoffset = (1 - p);
      var pt = path.getPointAtLength(p * len);
      marker.setAttribute("cx", pt.x.toFixed(1));
      marker.setAttribute("cy", pt.y.toFixed(1));
      var i = Math.round(p * (beats.length - 1));
      if (i !== cur) { cur = i; now.innerHTML = "<time>" + beats[i][0] + "</time>" + beats[i][1]; }
    }
    render(0);
    ScrollTrigger.create({
      trigger: wrap, start: "top top",
      end: function () { return "+=" + Math.round(window.innerHeight * 1.9); },
      pin: pin, scrub: true, invalidateOnRefresh: true,
      // refresh this (and size its pin-spacer) before every trigger below it,
      // so their start/end account for the extra height
      refreshPriority: 10,
      onUpdate: function (self) { render(self.progress); }
    });
  })();

  /* --- breathing pacer auto-runs while in view --- */
  (function () {
    var pacer = document.querySelector("#pacer[data-autopace]");
    var btn = document.getElementById("pacerBtn");
    if (!pacer || !btn) return;
    ScrollTrigger.create({
      trigger: pacer, start: "top 72%", end: "bottom 28%",
      onToggle: function (self) {
        var running = btn.getAttribute("aria-pressed") === "true";
        if (self.isActive && !running) btn.click();
        else if (!self.isActive && running) btn.click();
      }
    });
  })();

  /* --- 24h dial: advance around the ring on scroll --- */
  (function () {
    var dial = document.querySelector("[data-dial-scrub]");
    if (!dial) return;
    var nodes = dial.querySelectorAll(".node");
    var items = dial.querySelectorAll(".dial__list li");
    var n = items.length, last = -1;
    function pick(i) {
      if (i === last) return; last = i;
      nodes.forEach(function (el) { el.classList.toggle("on", +el.getAttribute("data-i") === i); });
      items.forEach(function (el) { el.classList.toggle("on", +el.getAttribute("data-i") === i); });
    }
    ScrollTrigger.create({
      trigger: dial, start: "top 78%", end: "bottom 40%", scrub: true,
      onUpdate: function (self) { pick(Math.min(n - 1, Math.floor(self.progress * n))); }
    });
  })();

  /* --- body map flips before -> after as you scroll past --- */
  (function () {
    var bm = document.querySelector("[data-bodymap-flip]");
    if (!bm) return;
    var cap = bm.querySelector(".bodymap__cap");
    var btns = bm.querySelectorAll(".bodymap__toggle button");
    var before = cap ? cap.textContent : "";
    var after = "Released, one region at a time. The jaw softens, the shoulders drop, the breath reaches the belly.";
    function set(state) {
      bm.classList.toggle("released", state === "after");
      if (cap) cap.textContent = state === "after" ? after : before;
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-state") === state ? "true" : "false"); });
    }
    ScrollTrigger.create({
      trigger: bm, start: "center 58%", end: "bottom top",
      onEnter: function () { set("after"); },
      onLeaveBack: function () { set("before"); }
    });
  })();

  /* --- cost calculator: the big number counts up on first view --- */
  (function () {
    var big = document.querySelector(".calc__big[data-countup]");
    if (!big) return;
    function inr(n) {
      n = Math.round(n);
      var s = String(n), last3 = s.slice(-3), rest = s.slice(0, -3);
      if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ",";
      return "₹" + rest + last3;
    }
    ScrollTrigger.create({
      trigger: big, start: "top 85%", once: true,
      onEnter: function () {
        var target = parseInt((big.textContent || "0").replace(/[^\d]/g, ""), 10) || 0;
        if (!target) return;
        var o = { v: 0 };
        gsap.to(o, {
          v: target, duration: 1.4, ease: "power3.out",
          onUpdate: function () { big.textContent = inr(o.v); }
        });
      }
    });
  })();

  /* --- 7-in-10 ratio grid: dots light up across the section's scroll --- */
  (function () {
    var fig = document.querySelector("[data-ratio-scrub]");
    if (!fig) return;
    var dots = [].slice.call(fig.querySelectorAll(".ratio__grid span"));
    var full = 7, last = -1;
    dots.forEach(function (d) { d.classList.remove("on"); });
    ScrollTrigger.create({
      trigger: fig, start: "top 82%", end: "bottom 55%", scrub: true,
      onUpdate: function (self) {
        var n = Math.round(self.progress * full);
        if (n === last) return; last = n;
        dots.forEach(function (d, i) { d.classList.toggle("on", i < n); });
      }
    });
  })();

  /* --- sleep-debt bar: the fill draws to its value on first view --- */
  (function () {
    var box = document.querySelector("[data-debt-draw]");
    if (!box) return;
    var fill = box.querySelector(".debt__fill");
    if (!fill) return;
    ScrollTrigger.create({
      trigger: box, start: "top 84%", once: true,
      onEnter: function () {
        var target = fill.style.width || getComputedStyle(fill).width;
        fill.style.transition = "none";
        fill.style.width = "0%";
        // next frame: animate to whatever app.js computed
        requestAnimationFrame(function () {
          gsap.to(fill, { width: target, duration: 1.1, ease: "power3.out" });
        });
      }
    });
  })();

  /* Recalculate all trigger positions once everything is in the DOM.
     The pinned arc section adds a pin-spacer that shifts every trigger
     below it; without these refreshes the swoop draws finish before
     their panel is even on screen. */
  function refresh() { ScrollTrigger.refresh(); }
  requestAnimationFrame(refresh);
  window.addEventListener("load", function () { refresh(); setTimeout(refresh, 300); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();
